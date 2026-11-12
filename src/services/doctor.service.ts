import { createAdminClient } from "@/lib/supabase/admin";
import { DoctorVisit } from "@/types";
import { logAuditEvent } from "./audit.service";
import { format } from "date-fns";

export async function recordDoctorVisit(params: {
  patient_id: string;
  visit_date: string;
  doctor_id: string;
  clinical_notes: string;
  exception_reason?: string;
}): Promise<DoctorVisit> {
  const supabase = createAdminClient();

  // 1. Fetch patient
  const { data: patient, error: pError } = await supabase
    .from("patients")
    .select("id, full_name, patient_code, status")
    .eq("id", params.patient_id)
    .single();

  if (pError || !patient) {
    throw new Error("Patient not found.");
  }

  if (patient.status === "discharged" || patient.status === "deceased") {
    throw new Error(`Cannot record doctor visit for ${patient.status} patient.`);
  }

  // 2. Duplicate daily visit check
  const { data: existingVisit } = await supabase
    .from("doctor_visits")
    .select("id")
    .eq("patient_id", params.patient_id)
    .eq("visit_date", params.visit_date)
    .maybeSingle();

  if (existingVisit) {
    throw new Error(
      `DUPLICATE_VISIT: A doctor visit has already been recorded for patient ${patient.patient_code} on ${params.visit_date}.`
    );
  }

  // 3. Nurse Temperature Check Validation
  const { data: nurseReading } = await supabase
    .from("temperature_readings")
    .select("id, temperature_celsius, reading_date")
    .eq("patient_id", params.patient_id)
    .eq("reading_date", params.visit_date)
    .maybeSingle();

  const isNurseReadingMissing = !nurseReading;

  if (isNurseReadingMissing) {
    if (!params.exception_reason || params.exception_reason.trim().length < 10) {
      throw new Error(
        "NURSE_READING_REQUIRED: Today's nurse temperature check is missing for this patient. A normal doctor visit cannot be recorded. If clinically justified, you must provide an authorized exception reason (minimum 10 characters)."
      );
    }
  }

  // 4. Insert doctor visit
  const { data: newVisit, error: insertError } = await supabase
    .from("doctor_visits")
    .insert({
      patient_id: params.patient_id,
      visit_date: params.visit_date,
      doctor_id: params.doctor_id,
      clinical_notes: params.clinical_notes,
      exception_reason: isNurseReadingMissing ? params.exception_reason?.trim() : null,
      visited_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !newVisit) {
    if (insertError?.code === "23505") {
      throw new Error("A doctor visit has already been recorded for this patient today.");
    }
    throw new Error(`Failed to record doctor visit: ${insertError?.message}`);
  }

  // 5. Log audit event
  await logAuditEvent({
    actor_id: params.doctor_id,
    action: isNurseReadingMissing ? "DOCTOR_VISIT_RECORDED_WITH_EXCEPTION" : "DOCTOR_VISIT_RECORDED",
    entity_type: "doctor_visits",
    entity_id: newVisit.id,
    new_data: {
      ...newVisit,
      patient_code: patient.patient_code,
      patient_name: patient.full_name,
      was_nurse_check_missing: isNurseReadingMissing,
      nurse_temperature_recorded: nurseReading?.temperature_celsius ?? null,
    },
  });

  return newVisit as DoctorVisit;
}

export async function getPatientVisits(patientId: string): Promise<DoctorVisit[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("doctor_visits")
    .select(`
      *,
      doctor:profiles!doctor_visits_doctor_id_fkey(full_name)
    `)
    .eq("patient_id", patientId)
    .order("visit_date", { ascending: false });

  if (error) {
    const { data: raw } = await supabase
      .from("doctor_visits")
      .select("*")
      .eq("patient_id", patientId)
      .order("visit_date", { ascending: false });

    return (raw || []) as DoctorVisit[];
  }

  return (data || []).map((v: any) => {
    const doc = v.doctor as { full_name?: string } | null;
    return {
      ...v,
      doctor_name: doc?.full_name || "Doctor Staff",
    };
  }) as DoctorVisit[];
}

export async function getTodaysDoctorRoster(dateStr?: string) {
  const supabase = createAdminClient();
  const targetDate = dateStr || format(new Date(), "yyyy-MM-dd");

  // Fetch active patients
  const { data: activePatients } = await supabase
    .from("patients")
    .select("*")
    .in("status", ["active", "discharge_eligible"])
    .order("bed_number", { ascending: true });

  if (!activePatients) {
    return {
      targetDate,
      threshold: 37.5,
      totalActive: 0,
      completedVisits: 0,
      pendingVisits: 0,
      patients: [],
    };
  }

  // Fetch today's nurse readings
  const { data: todaysReadings } = await supabase
    .from("temperature_readings")
    .select("*")
    .eq("reading_date", targetDate);

  const readingsMap = new Map<string, number>();
  (todaysReadings || []).forEach((r: any) => {
    readingsMap.set(r.patient_id, Number(r.temperature_celsius));
  });

  // Fetch today's doctor visits
  const { data: todaysVisits } = await supabase
    .from("doctor_visits")
    .select(`
      *,
      doctor:profiles!doctor_visits_doctor_id_fkey(full_name)
    `)
    .eq("visit_date", targetDate);

  const visitsMap = new Map<string, DoctorVisit>();
  (todaysVisits || []).forEach((v: any) => {
    const doc = v.doctor as { full_name?: string } | null;
    visitsMap.set(v.patient_id, {
      ...v,
      doctor_name: doc?.full_name || "Physician",
    } as DoctorVisit);
  });

  // Fetch fever threshold
  const { data: settings } = await supabase
    .from("facility_settings")
    .select("fever_threshold_celsius")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const threshold = settings?.fever_threshold_celsius ?? 37.5;

  const items = activePatients.map((p: any) => {
    const todayTemp = readingsMap.get(p.id);
    const hasNurseReading = todayTemp !== undefined;
    const isFever = hasNurseReading && todayTemp >= threshold;
    const visit = visitsMap.get(p.id);
    const isVisitCompleted = !!visit;

    return {
      patient: p,
      todayTemp: todayTemp ?? null,
      hasNurseReading,
      isFever,
      visit: visit || null,
      isVisitCompleted,
      canRecordNormalVisit: hasNurseReading,
    };
  });

  const completedVisits = items.filter((i: any) => i.isVisitCompleted).length;
  const pendingVisits = items.length - completedVisits;

  return {
    targetDate,
    threshold,
    totalActive: items.length,
    completedVisits,
    pendingVisits,
    patients: items,
  };
}
