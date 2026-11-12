"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserServer } from "@/lib/auth/session";
import { dischargePatient, markPatientDeceased } from "@/services/discharge.service";

export async function dischargePatientAction(patientId: string) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    if (user.role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Only Facility Administrators have authorized clearance to discharge patients.",
      };
    }

    const dischargedPatient = await dischargePatient(patientId, user.id);

    revalidatePath("/discharge");
    revalidatePath("/patients");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidatePath(`/patients/${patientId}`);
    revalidatePath("/audit-history");

    return { success: true, patient: dischargedPatient };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to discharge patient.",
    };
  }
}

export async function markPatientDeceasedAction(patientId: string, notes: string) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    if (user.role !== "doctor" && user.role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Only Attending Physicians or Administrators can record deceased outcomes.",
      };
    }

    if (!notes || notes.trim().length < 10) {
      return {
        success: false,
        error: "Clinical notes describing circumstance and time of death are required (min 10 characters).",
      };
    }

    const patient = await markPatientDeceased(patientId, user.id, notes);

    revalidatePath("/patients");
    revalidatePath("/discharge");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidatePath(`/patients/${patientId}`);
    revalidatePath("/audit-history");

    return { success: true, patient };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to record deceased outcome.",
    };
  }
}
