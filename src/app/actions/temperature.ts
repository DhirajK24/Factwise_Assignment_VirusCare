"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserServer } from "@/lib/auth/session";
import { temperatureReadingSchema, temperatureCorrectionSchema } from "@/lib/validation/schemas";
import { recordDailyTemperature, correctTemperatureReading } from "@/services/temperature.service";

export async function recordTemperatureAction(data: unknown) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    if (user.role !== "nurse" && user.role !== "admin") {
      return { success: false, error: "Unauthorized: Only Nurses and Admins can record daily temperatures." };
    }

    const validated = temperatureReadingSchema.parse(data);

    const record = await recordDailyTemperature({
      patient_id: validated.patient_id,
      temperature_celsius: validated.temperature_celsius,
      reading_date: validated.reading_date,
      recorded_by: user.id,
    });

    revalidatePath("/temperature-monitoring");
    revalidatePath("/doctor-visits");
    revalidatePath("/discharge");
    revalidatePath("/dashboard");
    revalidatePath(`/patients/${validated.patient_id}`);

    return { success: true, record };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to record temperature reading.",
    };
  }
}

export async function correctTemperatureAction(data: unknown) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    if (user.role !== "nurse" && user.role !== "admin") {
      return { success: false, error: "Unauthorized: Only Nurses and Admins can perform authorized corrections." };
    }

    const validated = temperatureCorrectionSchema.parse(data);

    const record = await correctTemperatureReading({
      reading_id: validated.reading_id,
      temperature_celsius: validated.temperature_celsius,
      correction_reason: validated.correction_reason,
      actor_id: user.id,
    });

    revalidatePath("/temperature-monitoring");
    revalidatePath("/doctor-visits");
    revalidatePath("/discharge");
    revalidatePath("/dashboard");
    revalidatePath("/audit-history");

    return { success: true, record };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to correct temperature reading.",
    };
  }
}

