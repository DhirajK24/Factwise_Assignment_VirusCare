-- ====================================================================
-- VIRUSCARE: Patient Quarantine & Treatment Management System
-- Initial Migration: Schema, Constraints, Functions, RLS & Triggers
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'nurse', 'doctor')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Facility Settings table
CREATE TABLE IF NOT EXISTS public.facility_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name TEXT NOT NULL DEFAULT 'VirusCare Quarantine Center',
    facility_timezone TEXT NOT NULL DEFAULT 'UTC',
    maximum_capacity INTEGER NOT NULL DEFAULT 74 CHECK (maximum_capacity > 0),
    fever_threshold_celsius NUMERIC(4, 1) NOT NULL DEFAULT 37.5 CHECK (fever_threshold_celsius >= 35.0 AND fever_threshold_celsius <= 43.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES public.profiles(id)
);

-- 4. Patients table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 130),
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'undisclosed')),
    contact_information TEXT,
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bed_number INTEGER NOT NULL CHECK (bed_number >= 1 AND bed_number <= 74),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discharge_eligible', 'discharged', 'deceased')),
    outcome TEXT CHECK (outcome IN ('recovered', 'deceased')),
    outcome_date TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Only active / discharge-eligible patients occupy a bed
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_active_bed 
ON public.patients (bed_number) 
WHERE status IN ('active', 'discharge_eligible');

CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_admission_date ON public.patients(admission_date);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);

-- 5. Temperature Readings table
CREATE TABLE IF NOT EXISTS public.temperature_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    temperature_celsius NUMERIC(4, 1) NOT NULL CHECK (temperature_celsius >= 30.0 AND temperature_celsius <= 45.0),
    reading_date DATE NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    recorded_by UUID NOT NULL REFERENCES public.profiles(id),
    corrected_at TIMESTAMPTZ,
    correction_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_patient_daily_temperature UNIQUE (patient_id, reading_date)
);

CREATE INDEX IF NOT EXISTS idx_temp_patient_date ON public.temperature_readings(patient_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_temp_reading_date ON public.temperature_readings(reading_date);

-- 6. Doctor Visits table
CREATE TABLE IF NOT EXISTS public.doctor_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    doctor_id UUID NOT NULL REFERENCES public.profiles(id),
    clinical_notes TEXT NOT NULL,
    exception_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_patient_daily_doctor_visit UNIQUE (patient_id, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_visits_patient_date ON public.doctor_visits(patient_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON public.doctor_visits(doctor_id);

-- 7. Audit Logs table (append-only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    previous_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);

-- 8. Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_settings_modtime
BEFORE UPDATE ON public.facility_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_patients_modtime
BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Helper Auth Functions for RLS
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_nurse()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'nurse' AND is_active = true
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'doctor' AND is_active = true
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies

-- Profiles Policies
CREATE POLICY "Profiles viewable by authenticated active users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Profiles insertable and updatable by admin only"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Facility Settings Policies
CREATE POLICY "Facility settings viewable by authenticated users"
ON public.facility_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Facility settings modifiable by admin only"
ON public.facility_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Patients Policies
CREATE POLICY "Patients viewable by authenticated users"
ON public.patients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Patients manageable by admin and doctors"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() OR public.is_doctor());

CREATE POLICY "Patients updatable by admin and doctors"
ON public.patients FOR UPDATE
TO authenticated
USING (public.is_admin() OR public.is_doctor())
WITH CHECK (public.is_admin() OR public.is_doctor());

-- Temperature Readings Policies
CREATE POLICY "Temperature readings viewable by authenticated users"
ON public.temperature_readings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Temperature readings insertable by nurses and admins"
ON public.temperature_readings FOR INSERT
TO authenticated
WITH CHECK (public.is_nurse() OR public.is_admin());

CREATE POLICY "Temperature readings updatable with correction by nurse or admin"
ON public.temperature_readings FOR UPDATE
TO authenticated
USING (public.is_nurse() OR public.is_admin())
WITH CHECK (public.is_nurse() OR public.is_admin());

-- Doctor Visits Policies
CREATE POLICY "Doctor visits viewable by authenticated users"
ON public.doctor_visits FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Doctor visits manageable by doctors and admin"
ON public.doctor_visits FOR ALL
TO authenticated
USING (public.is_doctor() OR public.is_admin())
WITH CHECK (public.is_doctor() OR public.is_admin());

-- Audit Logs Policies (Read-only for users, append-only via server/functions)
CREATE POLICY "Audit logs viewable by authenticated users"
ON public.audit_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Audit logs insertable by authenticated users"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 12. Transactional Stored Procedure: Patient Admission with 74-bed capacity lock
CREATE OR REPLACE FUNCTION public.sp_admit_patient(
    p_patient_code TEXT,
    p_full_name TEXT,
    p_age INTEGER,
    p_gender TEXT,
    p_contact_information TEXT,
    p_admission_date DATE,
    p_bed_number INTEGER,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_max_cap INTEGER;
    v_current_active INTEGER;
    v_bed_occupied BOOLEAN;
    v_patient RECORD;
    v_actor_name TEXT;
BEGIN
    -- 1. Lock settings row to serialize concurrent admissions
    SELECT maximum_capacity INTO v_max_cap
    FROM public.facility_settings
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_max_cap IS NULL THEN
        v_max_cap := 74;
    END IF;

    -- 2. Count current active patients
    SELECT COUNT(*) INTO v_current_active
    FROM public.patients
    WHERE status IN ('active', 'discharge_eligible');

    IF v_current_active >= v_max_cap THEN
        RAISE EXCEPTION 'FACILITY_CAPACITY_REACHED: Facility is at maximum capacity (% of % beds occupied). Admission blocked.', v_current_active, v_max_cap;
    END IF;

    -- 3. Validate bed number range
    IF p_bed_number < 1 OR p_bed_number > v_max_cap THEN
        RAISE EXCEPTION 'INVALID_BED_NUMBER: Bed % is out of range (1-%).', p_bed_number, v_max_cap;
    END IF;

    -- 4. Check if chosen bed is already occupied
    SELECT EXISTS (
        SELECT 1 FROM public.patients
        WHERE bed_number = p_bed_number
        AND status IN ('active', 'discharge_eligible')
    ) INTO v_bed_occupied;

    IF v_bed_occupied THEN
        RAISE EXCEPTION 'BED_ALREADY_OCCUPIED: Bed % is already occupied by an active patient.', p_bed_number;
    END IF;

    -- 5. Insert patient
    INSERT INTO public.patients (
        patient_code,
        full_name,
        age,
        gender,
        contact_information,
        admission_date,
        bed_number,
        status,
        created_by
    ) VALUES (
        p_patient_code,
        p_full_name,
        p_age,
        p_gender,
        p_contact_information,
        p_admission_date,
        p_bed_number,
        'active',
        p_actor_id
    ) RETURNING * INTO v_patient;

    -- 6. Insert audit log
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        new_data
    ) VALUES (
        p_actor_id,
        'PATIENT_ADMITTED',
        'patients',
        v_patient.id::text,
        to_jsonb(v_patient)
    );

    RETURN to_jsonb(v_patient);
END;
$$;

-- 13. Stored Procedure: Discharge Patient with 3-consecutive-fever-free-days check
CREATE OR REPLACE FUNCTION public.sp_discharge_patient(
    p_patient_id UUID,
    p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_patient RECORD;
    v_fever_thresh NUMERIC(4, 1);
    v_consecutive_days INTEGER := 0;
    v_current_day DATE := CURRENT_DATE;
    v_reading RECORD;
    v_prev_data JSONB;
BEGIN
    -- 1. Fetch patient
    SELECT * INTO v_patient
    FROM public.patients
    WHERE id = p_patient_id
    FOR UPDATE;

    IF v_patient IS NULL THEN
        RAISE EXCEPTION 'PATIENT_NOT_FOUND: Patient % not found.', p_patient_id;
    END IF;

    IF v_patient.status NOT IN ('active', 'discharge_eligible') THEN
        RAISE EXCEPTION 'INVALID_PATIENT_STATUS: Cannot discharge patient with status %.', v_patient.status;
    END IF;

    -- 2. Fetch fever threshold
    SELECT fever_threshold_celsius INTO v_fever_thresh
    FROM public.facility_settings
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_fever_thresh IS NULL THEN
        v_fever_thresh := 37.5;
    END IF;

    -- 3. Calculate consecutive fever-free calendar days (must have valid readings on 3 consecutive days)
    FOR i IN 0..2 LOOP
        SELECT * INTO v_reading
        FROM public.temperature_readings
        WHERE patient_id = p_patient_id
        AND reading_date = (v_current_day - i)
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_reading IS NULL THEN
            -- Missing reading means sequence is broken!
            EXIT;
        END IF;

        IF v_reading.temperature_celsius >= v_fever_thresh THEN
            -- Fever means sequence broken!
            EXIT;
        END IF;

        v_consecutive_days := v_consecutive_days + 1;
    END LOOP;

    IF v_consecutive_days < 3 THEN
        RAISE EXCEPTION 'DISCHARGE_INELIGIBLE: Patient has only % consecutive fever-free days. 3 complete days required (< %°C).', v_consecutive_days, v_fever_thresh;
    END IF;

    v_prev_data := to_jsonb(v_patient);

    -- 4. Update patient to discharged and recovered
    UPDATE public.patients
    SET 
        status = 'discharged',
        outcome = 'recovered',
        outcome_date = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_patient_id
    RETURNING * INTO v_patient;

    -- 5. Audit log
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        previous_data,
        new_data
    ) VALUES (
        p_actor_id,
        'PATIENT_DISCHARGED',
        'patients',
        p_patient_id::text,
        v_prev_data,
        to_jsonb(v_patient)
    );

    RETURN to_jsonb(v_patient);
END;
$$;

-- 14. Stored Procedure: Mark Patient Deceased
CREATE OR REPLACE FUNCTION public.sp_record_patient_deceased(
    p_patient_id UUID,
    p_actor_id UUID,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_patient RECORD;
    v_prev_data JSONB;
BEGIN
    SELECT * INTO v_patient
    FROM public.patients
    WHERE id = p_patient_id
    FOR UPDATE;

    IF v_patient IS NULL THEN
        RAISE EXCEPTION 'PATIENT_NOT_FOUND: Patient % not found.', p_patient_id;
    END IF;

    IF v_patient.status NOT IN ('active', 'discharge_eligible') THEN
        RAISE EXCEPTION 'INVALID_PATIENT_STATUS: Cannot record outcome for patient with status %.', v_patient.status;
    END IF;

    v_prev_data := to_jsonb(v_patient);

    UPDATE public.patients
    SET 
        status = 'deceased',
        outcome = 'deceased',
        outcome_date = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_patient_id
    RETURNING * INTO v_patient;

    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        previous_data,
        new_data
    ) VALUES (
        p_actor_id,
        'PATIENT_DECEASED',
        'patients',
        p_patient_id::text,
        v_prev_data,
        jsonb_build_object('patient', to_jsonb(v_patient), 'clinical_notes', p_notes)
    );

    RETURN to_jsonb(v_patient);
END;
$$;

-- 15. Stored Procedure: Recalculate Discharge Eligibility for Active Patients
CREATE OR REPLACE FUNCTION public.sp_recalculate_eligibility()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_patient RECORD;
    v_fever_thresh NUMERIC(4, 1);
    v_consecutive_days INTEGER;
    v_current_day DATE := CURRENT_DATE;
    v_reading RECORD;
    v_new_status TEXT;
BEGIN
    SELECT fever_threshold_celsius INTO v_fever_thresh
    FROM public.facility_settings
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_fever_thresh IS NULL THEN
        v_fever_thresh := 37.5;
    END IF;

    FOR v_patient IN 
        SELECT * FROM public.patients 
        WHERE status IN ('active', 'discharge_eligible')
    LOOP
        v_consecutive_days := 0;

        FOR i IN 0..2 LOOP
            SELECT * INTO v_reading
            FROM public.temperature_readings
            WHERE patient_id = v_patient.id
            AND reading_date = (v_current_day - i)
            ORDER BY created_at DESC
            LIMIT 1;

            IF v_reading IS NULL OR v_reading.temperature_celsius >= v_fever_thresh THEN
                EXIT;
            END IF;

            v_consecutive_days := v_consecutive_days + 1;
        END LOOP;

        IF v_consecutive_days >= 3 THEN
            v_new_status := 'discharge_eligible';
        ELSE
            v_new_status := 'active';
        END IF;

        IF v_patient.status <> v_new_status THEN
            UPDATE public.patients
            SET status = v_new_status, updated_at = timezone('utc'::text, now())
            WHERE id = v_patient.id;
        END IF;
    END LOOP;
END;
$$;

