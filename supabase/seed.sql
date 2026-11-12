-- ====================================================================
-- VIRUSCARE SEED DATA: Realistic Healthcare Demo Data
-- ====================================================================

-- 1. Insert Initial Facility Settings
INSERT INTO public.facility_settings (
    id,
    facility_name,
    facility_timezone,
    maximum_capacity,
    fever_threshold_celsius,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'VirusCare Regional Quarantine & Treatment Facility',
    'UTC',
    74,
    37.5,
    now() - interval '30 days',
    now()
) ON CONFLICT (id) DO UPDATE SET
    facility_name = EXCLUDED.facility_name,
    maximum_capacity = EXCLUDED.maximum_capacity,
    fever_threshold_celsius = EXCLUDED.fever_threshold_celsius;

-- 2. Fixed UUIDs for Demo Profiles & Supabase Auth Users
-- Admin: 11111111-1111-1111-1111-111111111111
-- Nurse 1: 22222222-2222-2222-2222-222222222222
-- Nurse 2: 33333333-3333-3333-3333-333333333333
-- Doctor 1: 44444444-4444-4444-4444-444444444444
-- Doctor 2: 55555555-5555-5555-5555-555555555555

-- Ensure matching auth.users records exist in Supabase Auth to satisfy profiles_id_fkey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES 
            ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@viruscare.health', crypt('VirusCare2026!Secure', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Sarah Chen, MD","role":"admin"}', now() - interval '30 days', now()),
            ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nurse.marcus@viruscare.health', crypt('VirusCare2026!Secure', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Johnson, RN","role":"nurse"}', now() - interval '30 days', now()),
            ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nurse.elena@viruscare.health', crypt('VirusCare2026!Secure', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Elena Rostova, BSN","role":"nurse"}', now() - interval '30 days', now()),
            ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'doctor.arjun@viruscare.health', crypt('VirusCare2026!Secure', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Arjun Mehta, MD","role":"doctor"}', now() - interval '30 days', now()),
            ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'doctor.clara@viruscare.health', crypt('VirusCare2026!Secure', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Clara Evans, MD","role":"doctor"}', now() - interval '30 days', now())
        ON CONFLICT (id) DO UPDATE SET
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data;
    END IF;
END $$;

-- Seed profiles directly
INSERT INTO public.profiles (id, full_name, email, role, is_active, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Dr. Sarah Chen, MD', 'admin@viruscare.health', 'admin', true, now() - interval '30 days', now()),
    ('22222222-2222-2222-2222-222222222222', 'Marcus Johnson, RN', 'nurse.marcus@viruscare.health', 'nurse', true, now() - interval '30 days', now()),
    ('33333333-3333-3333-3333-333333333333', 'Elena Rostova, BSN', 'nurse.elena@viruscare.health', 'nurse', true, now() - interval '30 days', now()),
    ('44444444-4444-4444-4444-444444444444', 'Dr. Arjun Mehta, MD', 'doctor.arjun@viruscare.health', 'doctor', true, now() - interval '30 days', now()),
    ('55555555-5555-5555-5555-555555555555', 'Dr. Clara Evans, MD', 'doctor.clara@viruscare.health', 'doctor', true, now() - interval '30 days', now())
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Update updated_by on facility settings
UPDATE public.facility_settings 
SET updated_by = '11111111-1111-1111-1111-111111111111' 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Seed Patients
-- Patient 1: Active with high fever
INSERT INTO public.patients (id, patient_code, full_name, age, gender, contact_information, admission_date, bed_number, status, outcome, outcome_date, created_by, created_at)
VALUES ('a0000000-0000-0000-0000-000000000001', 'VC-2026-0001', 'David Miller', 42, 'male', '+1 (555) 234-5678', CURRENT_DATE - 4, 1, 'active', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '4 days')
ON CONFLICT (patient_code) DO NOTHING;

-- Patient 2: Active with 1 fever-free day
INSERT INTO public.patients (id, patient_code, full_name, age, gender, contact_information, admission_date, bed_number, status, outcome, outcome_date, created_by, created_at)
VALUES ('a0000000-0000-0000-0000-000000000002', 'VC-2026-0002', 'Amara Okafor', 31, 'female', '+1 (555) 345-6789', CURRENT_DATE - 5, 2, 'active', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '5 days')
ON CONFLICT (patient_code) DO NOTHING;

-- Patient 3: Active with 2 consecutive fever-free days
INSERT INTO public.patients (id, patient_code, full_name, age, gender, contact_information, admission_date, bed_number, status, outcome, outcome_date, created_by, created_at)
VALUES ('a0000000-0000-0000-0000-000000000003', 'VC-2026-0003', 'Liam Chen', 58, 'male', '+1 (555) 456-7890', CURRENT_DATE - 7, 3, 'active', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '7 days')
ON CONFLICT (patient_code) DO NOTHING;

-- Patient 4: Active with 3 consecutive fever-free days -> DISCHARGE ELIGIBLE!
INSERT INTO public.patients (id, patient_code, full_name, age, gender, contact_information, admission_date, bed_number, status, outcome, outcome_date, created_by, created_at)
VALUES ('a0000000-0000-0000-0000-000000000004', 'VC-2026-0004', 'Sophia Martinez', 27, 'female', '+1 (555) 567-8901', CURRENT_DATE - 8, 4, 'discharge_eligible', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '8 days')
ON CONFLICT (patient_code) DO NOTHING;

-- Patient 5: Active, missing today's nurse reading
INSERT INTO public.patients (id, patient_code, full_name, age, gender, contact_information, admission_date, bed_number, status, outcome, outcome_date, created_by, created_at)
VALUES ('a0000000-0000-0000-0000-000000000005', 'VC-2026-0005', 'Robert Kowalski', 65, 'male', '+1 (555) 678-9012', CURRENT_DATE - 2, 5, 'active', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '2 days')
ON CONFLICT (patient_code) DO NOTHING;

-- Patient 6: Discharged (Recovered)
INSERT INTO public.patients (id, patient_code, full_name, age, gender, contact_information, admission_date, bed_number, status, outcome, outcome_date, created_by, created_at)
VALUES ('a0000000-0000-0000-0000-000000000006', 'VC-2026-0006', 'Grace Hopper', 39, 'female', '+1 (555) 789-0123', CURRENT_DATE - 14, 6, 'discharged', 'recovered', now() - interval '2 days', '11111111-1111-1111-1111-111111111111', now() - interval '14 days')
ON CONFLICT (patient_code) DO NOTHING;

-- Patient 7: Discharged (Recovered)
INSERT INTO public.patients (id, patient_code, full_name, age, gender, contact_information, admission_date, bed_number, status, outcome, outcome_date, created_by, created_at)
VALUES ('a0000000-0000-0000-0000-000000000007', 'VC-2026-0007', 'Alan Turing', 44, 'male', '+1 (555) 890-1234', CURRENT_DATE - 16, 7, 'discharged', 'recovered', now() - interval '3 days', '11111111-1111-1111-1111-111111111111', now() - interval '16 days')
ON CONFLICT (patient_code) DO NOTHING;

-- Patient 8: Deceased (Completed Outcome)
INSERT INTO public.patients (id, patient_code, full_name, age, gender, contact_information, admission_date, bed_number, status, outcome, outcome_date, created_by, created_at)
VALUES ('a0000000-0000-0000-0000-000000000008', 'VC-2026-0008', 'Arthur Pendelton', 82, 'male', '+1 (555) 901-2345', CURRENT_DATE - 20, 8, 'deceased', 'deceased', now() - interval '5 days', '11111111-1111-1111-1111-111111111111', now() - interval '20 days')
ON CONFLICT (patient_code) DO NOTHING;

-- Additional Active Patients across Beds 9..20
INSERT INTO public.patients (id, patient_code, full_name, age, gender, contact_information, admission_date, bed_number, status, outcome, outcome_date, created_by, created_at)
VALUES 
    ('a0000000-0000-0000-0000-000000000009', 'VC-2026-0009', 'Fatima Zahra', 24, 'female', '+1 (555) 111-2233', CURRENT_DATE - 3, 9, 'active', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '3 days'),
    ('a0000000-0000-0000-0000-000000000010', 'VC-2026-0010', 'Lucas Silva', 51, 'male', '+1 (555) 222-3344', CURRENT_DATE - 6, 10, 'active', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '6 days'),
    ('a0000000-0000-0000-0000-000000000011', 'VC-2026-0011', 'Mei-Ling Wang', 36, 'female', '+1 (555) 333-4455', CURRENT_DATE - 4, 11, 'active', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '4 days'),
    ('a0000000-0000-0000-0000-000000000012', 'VC-2026-0012', 'Kenji Takahashi', 48, 'male', '+1 (555) 444-5566', CURRENT_DATE - 2, 12, 'active', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '2 days'),
    ('a0000000-0000-0000-0000-000000000013', 'VC-2026-0013', 'Nadia Al-Mansoor', 29, 'female', '+1 (555) 555-6677', CURRENT_DATE - 5, 13, 'active', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '5 days'),
    ('a0000000-0000-0000-0000-000000000014', 'VC-2026-0014', 'Gabriel Garcia', 62, 'male', '+1 (555) 666-7788', CURRENT_DATE - 9, 14, 'discharge_eligible', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '9 days'),
    ('a0000000-0000-0000-0000-000000000015', 'VC-2026-0015', 'Zara Henderson', 33, 'female', '+1 (555) 777-8899', CURRENT_DATE - 1, 15, 'active', NULL, NULL, '11111111-1111-1111-1111-111111111111', now() - interval '1 days')
ON CONFLICT (patient_code) DO NOTHING;

-- 4. Seed Temperature Readings
-- Patient 1 (David Miller - Active Fever):
INSERT INTO public.temperature_readings (patient_id, temperature_celsius, reading_date, recorded_at, recorded_by)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 38.9, CURRENT_DATE - 3, now() - interval '3 days', '22222222-2222-2222-2222-222222222222'),
    ('a0000000-0000-0000-0000-000000000001', 39.1, CURRENT_DATE - 2, now() - interval '2 days', '22222222-2222-2222-2222-222222222222'),
    ('a0000000-0000-0000-0000-000000000001', 38.7, CURRENT_DATE - 1, now() - interval '1 days', '33333333-3333-3333-3333-333333333333'),
    ('a0000000-0000-0000-0000-000000000001', 38.6, CURRENT_DATE, now() - interval '2 hours', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (patient_id, reading_date) DO NOTHING;

-- Patient 2 (Amara Okafor - 1 fever-free day):
INSERT INTO public.temperature_readings (patient_id, temperature_celsius, reading_date, recorded_at, recorded_by)
VALUES 
    ('a0000000-0000-0000-0000-000000000002', 38.4, CURRENT_DATE - 2, now() - interval '2 days', '22222222-2222-2222-2222-222222222222'),
    ('a0000000-0000-0000-0000-000000000002', 38.1, CURRENT_DATE - 1, now() - interval '1 days', '33333333-3333-3333-3333-333333333333'),
    ('a0000000-0000-0000-0000-000000000002', 36.8, CURRENT_DATE, now() - interval '3 hours', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (patient_id, reading_date) DO NOTHING;

-- Patient 3 (Liam Chen - 2 consecutive fever-free days):
INSERT INTO public.temperature_readings (patient_id, temperature_celsius, reading_date, recorded_at, recorded_by)
VALUES 
    ('a0000000-0000-0000-0000-000000000003', 38.0, CURRENT_DATE - 3, now() - interval '3 days', '22222222-2222-2222-2222-222222222222'),
    ('a0000000-0000-0000-0000-000000000003', 37.8, CURRENT_DATE - 2, now() - interval '2 days', '22222222-2222-2222-2222-222222222222'),
    ('a0000000-0000-0000-0000-000000000003', 36.7, CURRENT_DATE - 1, now() - interval '1 days', '22222222-2222-2222-2222-222222222222'),
    ('a0000000-0000-0000-0000-000000000003', 36.6, CURRENT_DATE, now() - interval '4 hours', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (patient_id, reading_date) DO NOTHING;

-- Patient 4 (Sophia Martinez - 3 CONSECUTIVE FEVER-FREE DAYS -> DISCHARGE ELIGIBLE):
INSERT INTO public.temperature_readings (patient_id, temperature_celsius, reading_date, recorded_at, recorded_by)
VALUES 
    ('a0000000-0000-0000-0000-000000000004', 38.5, CURRENT_DATE - 4, now() - interval '4 days', '22222222-2222-2222-2222-222222222222'),
    ('a0000000-0000-0000-0000-000000000004', 37.9, CURRENT_DATE - 3, now() - interval '3 days', '33333333-3333-3333-3333-333333333333'),
    ('a0000000-0000-0000-0000-000000000004', 36.6, CURRENT_DATE - 2, now() - interval '2 days', '22222222-2222-2222-2222-222222222222'),
    ('a0000000-0000-0000-0000-000000000004', 36.5, CURRENT_DATE - 1, now() - interval '1 days', '33333333-3333-3333-3333-333333333333'),
    ('a0000000-0000-0000-0000-000000000004', 36.4, CURRENT_DATE, now() - interval '5 hours', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (patient_id, reading_date) DO NOTHING;

-- Patient 5 (Robert Kowalski - Reading recorded yesterday, but NONE TODAY):
INSERT INTO public.temperature_readings (patient_id, temperature_celsius, reading_date, recorded_at, recorded_by)
VALUES 
    ('a0000000-0000-0000-0000-000000000005', 37.9, CURRENT_DATE - 1, now() - interval '1 days', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (patient_id, reading_date) DO NOTHING;

-- Patient 14 (Gabriel Garcia - 3 consecutive days fever free):
INSERT INTO public.temperature_readings (patient_id, temperature_celsius, reading_date, recorded_at, recorded_by)
VALUES 
    ('a0000000-0000-0000-0000-000000000014', 36.8, CURRENT_DATE - 2, now() - interval '2 days', '22222222-2222-2222-2222-222222222222'),
    ('a0000000-0000-0000-0000-000000000014', 36.7, CURRENT_DATE - 1, now() - interval '1 days', '33333333-3333-3333-3333-333333333333'),
    ('a0000000-0000-0000-0000-000000000014', 36.5, CURRENT_DATE, now() - interval '4 hours', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (patient_id, reading_date) DO NOTHING;

-- 5. Seed Doctor Visits
-- Visit for Patient 1 (Today, normal visit after nurse reading)
INSERT INTO public.doctor_visits (patient_id, visit_date, visited_at, doctor_id, clinical_notes)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    now() - interval '1 hours',
    '44444444-4444-4444-4444-444444444444',
    'Patient remains febrile at 38.6°C. Clear lung sounds bilaterally. Initiated supplemental hydration and supportive antipyretic protocol. Quarantine level 2 precautions maintained.'
) ON CONFLICT (patient_id, visit_date) DO NOTHING;

-- Visit for Patient 4 (Today, pre-discharge evaluation)
INSERT INTO public.doctor_visits (patient_id, visit_date, visited_at, doctor_id, clinical_notes)
VALUES (
    'a0000000-0000-0000-0000-000000000004',
    CURRENT_DATE,
    now() - interval '2 hours',
    '55555555-5555-5555-5555-555555555555',
    'Clinical examination unremarkable. 3 consecutive days normothermic (<37.5°C). Respiratory distress absent. Patient meets all clinical criteria for full discharge.'
) ON CONFLICT (patient_id, visit_date) DO NOTHING;

-- Visit for Patient 5 with EXCEPTION REASON (no nurse reading recorded today, urgent bedside visit)
INSERT INTO public.doctor_visits (patient_id, visit_date, visited_at, doctor_id, clinical_notes, exception_reason)
VALUES (
    'a0000000-0000-0000-0000-000000000005',
    CURRENT_DATE - 1,
    now() - interval '22 hours',
    '44444444-4444-4444-4444-444444444444',
    'Bedside check performed due to acute discomfort. Patient provided oral rehydration.',
    'Emergency clinical assessment requested by nursing triage prior to shift temperature collection.'
) ON CONFLICT (patient_id, visit_date) DO NOTHING;

-- 6. Initial Audit Logs
INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data, created_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'FACILITY_INITIALIZED', 'facility_settings', '00000000-0000-0000-0000-000000000001', '{"maximum_capacity": 74, "fever_threshold_celsius": 37.5}', now() - interval '30 days'),
    ('11111111-1111-1111-1111-111111111111', 'PATIENT_ADMITTED', 'patients', 'a0000000-0000-0000-0000-000000000001', '{"patient_code": "VC-2026-0001", "full_name": "David Miller", "bed_number": 1}', now() - interval '4 days'),
    ('22222222-2222-2222-2222-222222222222', 'TEMPERATURE_RECORDED', 'temperature_readings', 'a0000000-0000-0000-0000-000000000001', '{"temperature_celsius": 38.6, "reading_date": "2026-11-12"}', now() - interval '2 hours'),
    ('44444444-4444-4444-4444-444444444444', 'DOCTOR_VISIT_RECORDED', 'doctor_visits', 'a0000000-0000-0000-0000-000000000001', '{"doctor": "Dr. Arjun Mehta", "notes": "Patient remains febrile at 38.6°C"}', now() - interval '1 hours'),
    ('11111111-1111-1111-1111-111111111111', 'PATIENT_DISCHARGED', 'patients', 'a0000000-0000-0000-0000-000000000006', '{"patient_code": "VC-2026-0006", "outcome": "recovered", "bed_freed": 6}', now() - interval '2 days');

