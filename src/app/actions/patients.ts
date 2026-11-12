"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserServer } from "@/lib/auth/session";
import { patientAdmissionSchema, patientUpdateSchema } from "@/lib/validation/schemas";
import { admitPatient, updatePatientDetails } from "@/services/patient.service";

export async function admitPatientAction(data: unknown) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    if (user.role !== "admin" && user.role !== "doctor") {
      return { success: false, error: "Unauthorized: Only Admins or Doctors can admit patients." };
    }

    const validated = patientAdmissionSchema.parse(data);

    const patient = await admitPatient({
      ...validated,
      created_by: user.id,
    });

    revalidatePath("/patients");
    revalidatePath("/dashboard");
    revalidatePath("/temperature-monitoring");
    revalidatePath("/doctor-visits");

    return { success: true, patient };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to admit patient.",
    };
  }
}

export async function updatePatientAction(patientId: string, data: unknown) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    if (user.role !== "admin" && user.role !== "doctor") {
      return { success: false, error: "Unauthorized: Insufficient permissions." };
    }

    const validated = patientUpdateSchema.parse(data);
    const updated = await updatePatientDetails(patientId, validated, user.id);

    revalidatePath("/patients");
    revalidatePath(`/patients/${patientId}`);
    revalidatePath("/dashboard");

    return { success: true, patient: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to update patient.",
    };
  }
}

