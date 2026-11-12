import { createAdminClient } from "@/lib/supabase/admin";
import { BedStatus, Patient, PatientStatus } from "@/types";
import { logAuditEvent } from "./audit.service";
import { evaluatePatientEligibility } from "./discharge.service";

export async function admitPatient(params: {
  patient_code?: string;
  full_name: string;
  age: number;
  gender?: "male" | "female" | "other" | "undisclosed";
  contact_information?: string;
  admission_date: string;
  bed_number: number;
  created_by?: string;
}): Promise<Patient> {
  const supabase = createAdminClient();

  // 1. Fetch current facility settings & lock check
  const { data: settings } = await supabase
    .from("facility_settings")
    .select("maximum_capacity")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const maxCapacity = settings?.maximum_capacity ?? 74;

  // 2. Count active patients
  const { count: activeCount, error: countError } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .in("status", ["active", "discharge_eligible"]);

  if (countError) {
    throw new Error(`Failed to check facility occupancy: ${countError.message}`);
  }

  const currentOccupancy = activeCount || 0;

  if (currentOccupancy >= maxCapacity) {
    throw new Error(
      `FACILITY_CAPACITY_REACHED: Facility is at maximum capacity (${currentOccupancy} of ${maxCapacity} beds occupied). Admission is strictly blocked until a bed is vacated via discharge.`
    );
  }

  // 3. Bed Number Validation
  if (params.bed_number < 1 || params.bed_number > maxCapacity) {
    throw new Error(
      `INVALID_BED_NUMBER: Bed ${params.bed_number} is out of valid range (1 - ${maxCapacity}).`
    );
  }

  // 4. Check if bed is already occupied by an active patient
  const { data: bedOccupant } = await supabase
    .from("patients")
    .select("id, patient_code, full_name")
    .eq("bed_number", params.bed_number)
    .in("status", ["active", "discharge_eligible"])
    .maybeSingle();

  if (bedOccupant) {
    throw new Error(
      `BED_ALREADY_OCCUPIED: Bed ${params.bed_number} is currently occupied by active patient ${bedOccupant.patient_code} (${bedOccupant.full_name}). Please assign an available bed.`
    );
  }

  // 5. Generate unique patient code if not provided
  let patientCode = params.patient_code?.trim();
  if (!patientCode) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    patientCode = `VC-${year}-${randomSuffix}`;
  }

  // Check unique code
  const { data: existingCode } = await supabase
    .from("patients")
    .select("id")
    .eq("patient_code", patientCode)
    .maybeSingle();

  if (existingCode) {
    throw new Error(`DUPLICATE_CODE: Patient code '${patientCode}' is already assigned.`);
  }

  // 6. Insert new patient record
  const { data: newPatient, error: insertError } = await supabase
    .from("patients")
    .insert({
      patient_code: patientCode,
      full_name: params.full_name.trim(),
      age: params.age,
      gender: params.gender || "undisclosed",
      contact_information: params.contact_information || null,
      admission_date: params.admission_date,
      bed_number: params.bed_number,
      status: "active",
      created_by: params.created_by || null,
    })
    .select()
    .single();

  if (insertError || !newPatient) {
    if (insertError?.code === "23505") {
      throw new Error(`Conflict: Patient code or bed assignment conflict.`);
    }
    throw new Error(`Failed to admit patient: ${insertError?.message}`);
  }

  // 7. Append audit log
  await logAuditEvent({
    actor_id: params.created_by,
    action: "PATIENT_ADMITTED",
    entity_type: "patients",
    entity_id: newPatient.id,
    new_data: newPatient,
  });

  return newPatient as Patient;
}

export async function updatePatientDetails(
  patientId: string,
  params: {
    full_name: string;
    age: number;
    gender?: "male" | "female" | "other" | "undisclosed";
    contact_information?: string;
    bed_number: number;
  },
  actorId?: string
): Promise<Patient> {
  const supabase = createAdminClient();

  const { data: currentPatient, error: fetchError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (fetchError || !currentPatient) {
    throw new Error("Patient not found.");
  }

  // If bed number is changed and patient is active, verify new bed is free
  if (
    params.bed_number !== currentPatient.bed_number &&
    (currentPatient.status === "active" || currentPatient.status === "discharge_eligible")
  ) {
    const { data: occupant } = await supabase
      .from("patients")
      .select("id, patient_code")
      .eq("bed_number", params.bed_number)
      .in("status", ["active", "discharge_eligible"])
      .neq("id", patientId)
      .maybeSingle();

    if (occupant) {
      throw new Error(`Bed ${params.bed_number} is already occupied.`);
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("patients")
    .update({
      full_name: params.full_name.trim(),
      age: params.age,
      gender: params.gender || currentPatient.gender,
      contact_information: params.contact_information || null,
      bed_number: params.bed_number,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId)
    .select()
    .single();

  if (updateError || !updated) {
    throw new Error(`Failed to update patient: ${updateError?.message}`);
  }

  await logAuditEvent({
    actor_id: actorId,
    action: "PATIENT_UPDATED",
    entity_type: "patients",
    entity_id: patientId,
    previous_data: currentPatient,
    new_data: updated,
  });

  return updated as Patient;
}

export async function getPatientById(patientId: string) {
  const supabase = createAdminClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select(`
      *,
      creator:profiles!patients_created_by_fkey(full_name, role)
    `)
    .eq("id", patientId)
    .single();

  if (error || !patient) {
    throw new Error(`Patient not found: ${error?.message || patientId}`);
  }

  // Get fever threshold
  const { data: settings } = await supabase
    .from("facility_settings")
    .select("fever_threshold_celsius")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const threshold = settings?.fever_threshold_celsius ?? 37.5;

  let eligibility = null;
  if (patient.status === "active" || patient.status === "discharge_eligible") {
    try {
      eligibility = await evaluatePatientEligibility(patientId, threshold);
    } catch {
      // Non-blocking
    }
  }

  return {
    patient: patient as Patient,
    eligibility,
    feverThreshold: threshold,
  };
}

export async function listPatients(options?: {
  status?: PatientStatus | "all";
  search?: string;
  sortBy?: "admission_date" | "bed_number" | "full_name" | "patient_code";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}) {
  const supabase = createAdminClient();
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase.from("patients").select("*", { count: "exact" });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.search) {
    const s = options.search.trim();
    query = query.or(`full_name.ilike.%${s}%,patient_code.ilike.%${s}%`);
  }

  const sortBy = options?.sortBy || "bed_number";
  const ascending = options?.sortOrder === "desc" ? false : true;

  query = query.order(sortBy, { ascending }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to list patients: ${error.message}`);
  }

  return {
    patients: (data || []) as Patient[],
    totalCount: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getFacilityBedsMap(): Promise<{
  beds: BedStatus[];
  occupiedCount: number;
  availableCount: number;
  maxCapacity: number;
}> {
  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from("facility_settings")
    .select("maximum_capacity, fever_threshold_celsius")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const maxCapacity = settings?.maximum_capacity ?? 74;
  const feverThreshold = settings?.fever_threshold_celsius ?? 37.5;

  // Fetch all active or discharge_eligible patients
  const { data: activePatients } = await supabase
    .from("patients")
    .select("*")
    .in("status", ["active", "discharge_eligible"]);

  // Fetch today's readings to highlight beds with fever
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: todaysReadings } = await supabase
    .from("temperature_readings")
    .select("patient_id, temperature_celsius")
    .eq("reading_date", todayStr);

  const readingMap = new Map<string, number>();
  (todaysReadings || []).forEach((r) => {
    readingMap.set(r.patient_id, Number(r.temperature_celsius));
  });

  const patientMap = new Map<number, Patient>();
  (activePatients || []).forEach((p) => {
    patientMap.set(p.bed_number, p as Patient);
  });

  const beds: BedStatus[] = [];
  let occupiedCount = 0;

  for (let bedNum = 1; bedNum <= maxCapacity; bedNum++) {
    const patient = patientMap.get(bedNum);
    const isOccupied = !!patient;
    if (isOccupied) occupiedCount += 1;

    const currentTemp = patient ? readingMap.get(patient.id) ?? null : null;
    const isFever = currentTemp !== null && currentTemp >= feverThreshold;

    beds.push({
      bedNumber: bedNum,
      isOccupied,
      patient: patient || null,
      currentTemp,
      isFever,
    });
  }

  return {
    beds,
    occupiedCount,
    availableCount: maxCapacity - occupiedCount,
    maxCapacity,
  };
}

