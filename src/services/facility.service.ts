import { createAdminClient } from "@/lib/supabase/admin";
import { FacilitySettings, UserProfile, UserRole } from "@/types";
import { logAuditEvent } from "./audit.service";
import { syncAllActivePatientsEligibility } from "./discharge.service";

export async function getFacilitySettings(): Promise<FacilitySettings> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("facility_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    // Return default settings
    return {
      id: "00000000-0000-0000-0000-000000000001",
      facility_name: "VirusCare Regional Quarantine & Treatment Facility",
      facility_timezone: "UTC",
      maximum_capacity: 74,
      fever_threshold_celsius: 37.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data as FacilitySettings;
}

export async function updateFacilitySettings(
  params: {
    facility_name: string;
    facility_timezone: string;
    maximum_capacity: number;
    fever_threshold_celsius: number;
  },
  actorId?: string
): Promise<FacilitySettings> {
  const supabase = createAdminClient();

  // 1. Fetch current settings
  const current = await getFacilitySettings();

  // 2. Validate capacity reduction: Cannot reduce below current occupancy!
  const { count: activeCount } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .in("status", ["active", "discharge_eligible"]);

  const currentOccupancy = activeCount || 0;

  if (params.maximum_capacity < currentOccupancy) {
    throw new Error(
      `CAPACITY_REDUCTION_FORBIDDEN: Cannot reduce maximum capacity to ${params.maximum_capacity}. Currently ${currentOccupancy} patients are actively admitted. Maximum capacity must be at least ${currentOccupancy}.`
    );
  }

  const thresholdChanged =
    Number(current.fever_threshold_celsius) !== Number(params.fever_threshold_celsius);

  // 3. Update settings record
  const { data: updated, error: updateError } = await supabase
    .from("facility_settings")
    .update({
      facility_name: params.facility_name.trim(),
      facility_timezone: params.facility_timezone,
      maximum_capacity: params.maximum_capacity,
      fever_threshold_celsius: params.fever_threshold_celsius,
      updated_at: new Date().toISOString(),
      updated_by: actorId || null,
    })
    .eq("id", current.id)
    .select()
    .single();

  if (updateError || !updated) {
    throw new Error(`Failed to update facility settings: ${updateError?.message}`);
  }

  // 4. Log audit event
  await logAuditEvent({
    actor_id: actorId,
    action: "FACILITY_SETTINGS_UPDATED",
    entity_type: "facility_settings",
    entity_id: current.id,
    previous_data: current as unknown as Record<string, unknown>,
    new_data: updated as unknown as Record<string, unknown>,
  });

  // 5. If fever threshold changed, trigger recalculation of eligibility for all active patients
  if (thresholdChanged) {
    await syncAllActivePatientsEligibility();
  }

  return updated as FacilitySettings;
}

export async function listSystemUsers(): Promise<UserProfile[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  return (data || []) as UserProfile[];
}

export async function createSystemUser(params: {
  email: string;
  full_name: string;
  role: UserRole;
  password?: string;
  actorId?: string;
}): Promise<UserProfile> {
  const supabase = createAdminClient();

  // Create user in Supabase auth
  const tempPassword = params.password || "VirusCare2026!Secure";
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: params.email.trim().toLowerCase(),
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: params.full_name.trim(),
      role: params.role,
    },
  });

  if (authError || !authData.user) {
    // If user already exists in auth, check if profile exists
    if (authError?.message?.includes("already registered") || authError?.status === 422) {
      throw new Error(`User with email ${params.email} is already registered.`);
    }
    throw new Error(`Failed to create auth user: ${authError?.message}`);
  }

  // Upsert into profiles
  const { data: profile, error: pError } = await supabase
    .from("profiles")
    .upsert({
      id: authData.user.id,
      email: params.email.trim().toLowerCase(),
      full_name: params.full_name.trim(),
      role: params.role,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (pError || !profile) {
    throw new Error(`Failed to create user profile: ${pError?.message}`);
  }

  await logAuditEvent({
    actor_id: params.actorId,
    action: "USER_CREATED",
    entity_type: "profiles",
    entity_id: profile.id,
    new_data: profile,
  });

  return profile as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  params: {
    full_name?: string;
    role?: UserRole;
    is_active?: boolean;
  },
  actorId?: string
): Promise<UserProfile> {
  const supabase = createAdminClient();

  const { data: current, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (fetchError || !current) {
    throw new Error("User not found.");
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (updateError || !updated) {
    throw new Error(`Failed to update user profile: ${updateError?.message}`);
  }

  await logAuditEvent({
    actor_id: actorId,
    action: "USER_UPDATED",
    entity_type: "profiles",
    entity_id: userId,
    previous_data: current,
    new_data: updated,
  });

  return updated as UserProfile;
}

