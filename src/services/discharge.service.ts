import { createAdminClient } from "@/lib/supabase/admin";
import { DischargeEligibilityResult, Patient, TemperatureReading } from "@/types";
import { logAuditEvent } from "./audit.service";
import { format, subDays } from "date-fns";

export async function evaluatePatientEligibility(
  patientId: string,
  feverThreshold: number = 37.5,
  referenceDate: Date = new Date()
): Promise<DischargeEligibilityResult> {
  const supabase = createAdminClient();

  // 1. Fetch patient
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (patientError || !patient) {
    throw new Error(`Patient not found: ${patientError?.message || patientId}`);
  }

  // 2. We need 3 full consecutive calendar days
  // Let's check Day 0 (today), Day -1 (yesterday), and Day -2 (2 days ago)
  const targetDates: string[] = [
    format(referenceDate, "yyyy-MM-dd"),
    format(subDays(referenceDate, 1), "yyyy-MM-dd"),
    format(subDays(referenceDate, 2), "yyyy-MM-dd"),
  ];

  // Fetch readings for these dates
  const { data: readings, error: readingsError } = await supabase
    .from("temperature_readings")
    .select("*")
    .eq("patient_id", patientId)
    .in("reading_date", targetDates)
    .order("reading_date", { ascending: false });

  if (readingsError) {
    throw new Error(`Failed to fetch temperature readings: ${readingsError.message}`);
  }

  const readingsMap = new Map<string, TemperatureReading>();
  ((readings || []) as TemperatureReading[]).forEach((r: TemperatureReading) => {
    readingsMap.set(r.reading_date, r);
  });

  let consecutiveFeverFreeDays = 0;
  let missingToday = false;
  let hasFeverToday = false;
  const consecutiveDates: DischargeEligibilityResult["consecutiveDates"] = [];

  // Check from today backwards: Day 0, Day -1, Day -2
  for (let i = 0; i < targetDates.length; i++) {
    const dStr = targetDates[i];
    const reading = readingsMap.get(dStr);

    if (!reading) {
      if (i === 0) missingToday = true;
      consecutiveDates.push({
        date: dStr,
        temperature: null,
        isFeverFree: false,
        isMissing: true,
      });
      // Missing reading breaks consecutive sequence
      break;
    }

    const temp = Number(reading.temperature_celsius);
    const isFeverFree = temp < feverThreshold;

    if (i === 0 && !isFeverFree) {
      hasFeverToday = true;
    }

    consecutiveDates.push({
      date: dStr,
      temperature: temp,
      isFeverFree,
      isMissing: false,
    });

    if (isFeverFree) {
      consecutiveFeverFreeDays += 1;
    } else {
      // Fever breaks consecutive sequence
      break;
    }
  }

  const isEligible = consecutiveFeverFreeDays >= 3;
  let reason = "";

  if (isEligible) {
    reason = "Patient has achieved 3 consecutive calendar days without fever (<" + feverThreshold + "°C). Cured and eligible for discharge.";
  } else if (missingToday) {
    reason = "Today's daily nurse temperature reading has not been recorded yet.";
  } else if (hasFeverToday) {
    reason = "Patient had a fever reading today. Consecutive fever-free sequence reset to 0.";
  } else {
    reason = `Patient has ${consecutiveFeverFreeDays} of 3 required consecutive fever-free days.`;
  }

  // Get most recent reading
  const { data: latest } = await supabase
    .from("temperature_readings")
    .select("*")
    .eq("patient_id", patientId)
    .order("reading_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    patientId,
    isEligible,
    consecutiveFeverFreeDays,
    feverThreshold,
    missingToday,
    hasFeverToday,
    lastReading: latest as TemperatureReading | null,
    consecutiveDates,
    reason,
  };
}

export async function dischargePatient(
  patientId: string,
  adminId: string
): Promise<Patient> {
  const supabase = createAdminClient();

  // 1. Fetch facility fever threshold
  const { data: settings } = await supabase
    .from("facility_settings")
    .select("fever_threshold_celsius")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const threshold = settings?.fever_threshold_celsius ?? 37.5;

  // 2. Independently revalidate eligibility on server
  const evaluation = await evaluatePatientEligibility(patientId, threshold);
  if (!evaluation.isEligible) {
    throw new Error(
      `DISCHARGE_REJECTED: Patient is not eligible for discharge. ${evaluation.reason}`
    );
  }

  // 3. Fetch current patient state
  const { data: patient, error: pError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (pError || !patient) {
    throw new Error("Patient not found");
  }

  if (patient.status !== "active" && patient.status !== "discharge_eligible") {
    throw new Error(`Patient is already in status '${patient.status}'`);
  }

  // 4. Execute atomic discharge
  const updatedData = {
    status: "discharged",
    outcome: "recovered",
    outcome_date: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: updatedPatient, error: updateError } = await supabase
    .from("patients")
    .update(updatedData)
    .eq("id", patientId)
    .select()
    .single();

  if (updateError || !updatedPatient) {
    throw new Error(`Failed to discharge patient: ${updateError?.message}`);
  }

  // 5. Append audit log
  await logAuditEvent({
    actor_id: adminId,
    action: "PATIENT_DISCHARGED",
    entity_type: "patients",
    entity_id: patientId,
    previous_data: patient,
    new_data: updatedPatient,
  });

  return updatedPatient as Patient;
}

export async function markPatientDeceased(
  patientId: string,
  actorId: string,
  clinicalNotes: string
): Promise<Patient> {
  const supabase = createAdminClient();

  const { data: patient, error: pError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (pError || !patient) {
    throw new Error("Patient not found");
  }

  if (patient.status !== "active" && patient.status !== "discharge_eligible") {
    throw new Error(`Patient is already in status '${patient.status}'`);
  }

  const updatedData = {
    status: "deceased",
    outcome: "deceased",
    outcome_date: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: updatedPatient, error: updateError } = await supabase
    .from("patients")
    .update(updatedData)
    .eq("id", patientId)
    .select()
    .single();

  if (updateError || !updatedPatient) {
    throw new Error(`Failed to record deceased outcome: ${updateError?.message}`);
  }

  await logAuditEvent({
    actor_id: actorId,
    action: "PATIENT_DECEASED",
    entity_type: "patients",
    entity_id: patientId,
    previous_data: patient,
    new_data: { ...updatedPatient, clinicalNotes },
  });

  return updatedPatient as Patient;
}

export async function syncAllActivePatientsEligibility(): Promise<void> {
  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from("facility_settings")
    .select("fever_threshold_celsius")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const threshold = settings?.fever_threshold_celsius ?? 37.5;

  const { data: activePatients } = await supabase
    .from("patients")
    .select("id, status")
    .in("status", ["active", "discharge_eligible"]);

  if (!activePatients) return;

  for (const p of activePatients) {
    try {
      const result = await evaluatePatientEligibility(p.id, threshold);
      const newStatus = result.isEligible ? "discharge_eligible" : "active";
      if (p.status !== newStatus) {
        await supabase
          .from("patients")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", p.id);
      }
    } catch {
      // Continue sync for other patients
    }
  }
}

