"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserServer } from "@/lib/auth/session";
import { doctorVisitSchema } from "@/lib/validation/schemas";
import { recordDoctorVisit } from "@/services/doctor.service";

export async function recordDoctorVisitAction(data: unknown) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    if (user.role !== "doctor" && user.role !== "admin") {
      return { success: false, error: "Unauthorized: Only Doctors and Admins can record clinical visits." };
    }

    const validated = doctorVisitSchema.parse(data);

    const visit = await recordDoctorVisit({
      patient_id: validated.patient_id,
      visit_date: validated.visit_date,
      doctor_id: user.id,
      clinical_notes: validated.clinical_notes,
      exception_reason: validated.exception_reason,
    });

    revalidatePath("/doctor-visits");
    revalidatePath("/dashboard");
    revalidatePath(`/patients/${validated.patient_id}`);
    revalidatePath("/audit-history");

    return { success: true, visit };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to record doctor visit.",
    };
  }
}
