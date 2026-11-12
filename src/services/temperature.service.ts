import { createAdminClient } from "@/lib/supabase/admin";
import { TemperatureReading } from "@/types";
import { logAuditEvent } from "./audit.service";
import { evaluatePatientEligibility } from "./discharge.service";
import { format } from "date-fns";

export async function recordDailyTemperature(params: {
  patient_id: string;
  temperature_celsius: number;
  reading_date: string;
  recorded_by: string;
}): Promise<TemperatureReading> {
  const supabase = createAdminClient();

  // 1. Check patient status - must be active or discharge_eligible
  const { data: patient, error: pError } = await supabase
    .from("patients")
    .select("id, full_name, patient_code, status")
    .eq("id", params.patient_id)
    .single();

  if (pError || !patient) {
    throw new Error("Patient not found.");
  }

  if (patient.status === "discharged" || patient.status === "deceased") {
    throw new Error(`Cannot record temperature for ${patient.status} patient.`);
  }

  // 2. Duplicate prevention check
  const { data: existing } = await supabase
    .from("temperature_readings")
    .select("id, temperature_celsius")
    .eq("patient_id", params.patient_id)
    .eq("reading_date", params.reading_date)
    .maybeSingle();

  if (existing) {
    throw new Error(
      `DUPLICATE_READING: A reading of ${existing.temperature_celsius}°C has already been recorded for patient ${patient.patient_code} on ${params.reading_date}. Use the Authorized Correction workflow to make adjustments.`
    );
  }

  // 3. Insert record
  const { data: newRecord, error: insertError } = await supabase
    .from("temperature_readings")
    .insert({
      patient_id: params.patient_id,
      temperature_celsius: params.temperature_celsius,
      reading_date: params.reading_date,
      recorded_by: params.recorded_by,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !newRecord) {
    if (insertError?.code === "23505") {
      throw new Error(
        `DUPLICATE_READING: A reading has already been recorded for this patient on ${params.reading_date}.`
      );
    }
    throw new Error(`Failed to record temperature: ${insertError?.message}`);
  }

  // 4. Log audit event
  await logAuditEvent({
    actor_id: params.recorded_by,
    action: "TEMPERATURE_RECORDED",
    entity_type: "temperature_readings",
    entity_id: newRecord.id,
    new_data: {
      ...newRecord,
      patient_code: patient.patient_code,
      patient_name: patient.full_name,
    },
  });

  // 5. Trigger automatic eligibility check and status update
  try {
    const { data: settings } = await supabase
      .from("facility_settings")
      .select("fever_threshold_celsius")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    const threshold = settings?.fever_threshold_celsius ?? 37.5;
    const evalResult = await evaluatePatientEligibility(params.patient_id, threshold);
    const updatedStatus = evalResult.isEligible ? "discharge_eligible" : "active";

    if (patient.status !== updatedStatus) {
      await supabase
        .from("patients")
        .update({ status: updatedStatus, updated_at: new Date().toISOString() })
        .eq("id", params.patient_id);
    }
  } catch (err) {
    console.error("Auto eligibility update error:", err);
  }

  return newRecord as TemperatureReading;
}

export async function correctTemperatureReading(params: {
  reading_id: string;
  temperature_celsius: number;
  correction_reason: string;
  actor_id: string;
}): Promise<TemperatureReading> {
  const supabase = createAdminClient();

  // 1. Fetch previous record
  const { data: prevRecord, error: fetchError } = await supabase
    .from("temperature_readings")
    .select("*, patient:patients(patient_code, full_name, status)")
    .eq("id", params.reading_id)
    .single();

  if (fetchError || !prevRecord) {
    throw new Error("Temperature reading record not found.");
  }

  // 2. Perform update with correction audit fields
  const updatedData = {
    temperature_celsius: params.temperature_celsius,
    corrected_at: new Date().toISOString(),
    correction_reason: params.correction_reason,
  };

  const { data: updatedRecord, error: updateError } = await supabase
    .from("temperature_readings")
    .update(updatedData)
    .eq("id", params.reading_id)
    .select()
    .single();

  if (updateError || !updatedRecord) {
    throw new Error(`Failed to correct reading: ${updateError?.message}`);
  }

  // 3. Log audit event
  await logAuditEvent({
    actor_id: params.actor_id,
    action: "TEMPERATURE_CORRECTED",
    entity_type: "temperature_readings",
    entity_id: params.reading_id,
    previous_data: prevRecord,
    new_data: updatedRecord,
  });

  // 4. Recalculate eligibility for patient
  try {
    const { data: settings } = await supabase
      .from("facility_settings")
      .select("fever_threshold_celsius")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    const threshold = settings?.fever_threshold_celsius ?? 37.5;
    const evalResult = await evaluatePatientEligibility(prevRecord.patient_id, threshold);
    const updatedStatus = evalResult.isEligible ? "discharge_eligible" : "active";

    const patient = prevRecord.patient as { status?: string } | null;
    if (patient?.status && patient.status !== updatedStatus) {
      await supabase
        .from("patients")
        .update({ status: updatedStatus, updated_at: new Date().toISOString() })
        .eq("id", prevRecord.patient_id);
    }
  } catch (err) {
    console.error("Recalculation error after correction:", err);
  }

  return updatedRecord as TemperatureReading;
}

export async function getPatientTemperatureHistory(
  patientId: string
): Promise<TemperatureReading[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("temperature_readings")
    .select(`
      *,
      recorder:profiles!temperature_readings_recorded_by_fkey(full_name)
    `)
    .eq("patient_id", patientId)
    .order("reading_date", { ascending: false });

  if (error) {
    // Fallback if relation not found
    const { data: raw } = await supabase
      .from("temperature_readings")
      .select("*")
      .eq("patient_id", patientId)
      .order("reading_date", { ascending: false });

    return (raw || []) as TemperatureReading[];
  }

  return (data || []).map((r: any) => {
    const rec = r.recorder as { full_name?: string } | null;
    return {
      ...r,
      recorder_name: rec?.full_name || "Nurse Staff",
    };
  }) as TemperatureReading[];
}

export async function getTodaysNurseMonitoringList(dateStr?: string) {
  const supabase = createAdminClient();
  const targetDate = dateStr || format(new Date(), "yyyy-MM-dd");

  // Get all active / discharge_eligible patients
  const { data: activePatients, error: pError } = await supabase
    .from("patients")
    .select("*")
    .in("status", ["active", "discharge_eligible"])
    .order("bed_number", { ascending: true });

  if (pError || !activePatients) {
    throw new Error(`Failed to load patient monitoring list: ${pError?.message}`);
  }

  // Get all readings for today
  const { data: todaysReadings } = await supabase
    .from("temperature_readings")
    .select(`
      *,
      recorder:profiles!temperature_readings_recorded_by_fkey(full_name)
    `)
    .eq("reading_date", targetDate);

  const readingsMap = new Map<string, TemperatureReading>();
  (todaysReadings || []).forEach((r: any) => {
    const rec = r.recorder as { full_name?: string } | null;
    readingsMap.set(r.patient_id, {
      ...r,
      recorder_name: rec?.full_name || "Staff",
    } as TemperatureReading);
  });

  // Get fever threshold
  const { data: settings } = await supabase
    .from("facility_settings")
    .select("fever_threshold_celsius")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const threshold = settings?.fever_threshold_celsius ?? 37.5;

  const list = activePatients.map((p: any) => {
    const reading = readingsMap.get(p.id);
    const hasReading = !!reading;
    const temp = reading ? Number(reading.temperature_celsius) : null;
    const isFever = temp !== null && temp >= threshold;

    return {
      patient: p,
      todayReading: reading || null,
      isCompleted: hasReading,
      temperatureCelsius: temp,
      isFever,
      feverThreshold: threshold,
    };
  });

  const completedCount = list.filter((item: any) => item.isCompleted).length;
  const pendingCount = list.length - completedCount;
  const feverCount = list.filter((item: any) => item.isFever).length;

  return {
    targetDate,
    threshold,
    totalActive: list.length,
    completedCount,
    pendingCount,
    feverCount,
    items: list,
  };
}
