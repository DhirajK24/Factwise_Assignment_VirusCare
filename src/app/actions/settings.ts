"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserServer } from "@/lib/auth/session";
import { facilitySettingsSchema, userManagementSchema } from "@/lib/validation/schemas";
import {
  updateFacilitySettings,
  createSystemUser,
  updateUserProfile,
} from "@/services/facility.service";
import { memoryStore } from "@/lib/db/mock-store";
import { UserRole } from "@/types";

export async function updateSettingsAction(data: unknown) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    if (user.role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Only Administrators can configure facility settings.",
      };
    }

    const validated = facilitySettingsSchema.parse(data);
    const updated = await updateFacilitySettings(validated, user.id);

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/discharge");
    revalidatePath("/patients");

    return { success: true, settings: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to update facility settings.",
    };
  }
}

export async function createUserAction(data: unknown) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    if (user.role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Only Administrators can create new accounts.",
      };
    }

    const validated = userManagementSchema.parse(data);
    const created = await createSystemUser({
      ...validated,
      actorId: user.id,
    });

    revalidatePath("/settings");

    return { success: true, user: created };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to create user.",
    };
  }
}

export async function updateUserStatusAction(
  targetUserId: string,
  role: UserRole,
  isActive: boolean
) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    if (user.role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Only Administrators can modify user access.",
      };
    }

    if (user.id === targetUserId && !isActive) {
      return {
        success: false,
        error: "Forbidden: You cannot deactivate your own administrative account.",
      };
    }

    const updated = await updateUserProfile(
      targetUserId,
      { role, is_active: isActive },
      user.id
    );

    revalidatePath("/settings");

    return { success: true, user: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to update user status.",
    };
  }
}

export async function resetDemoDataAction() {
  try {
    const user = await getCurrentUserServer();
    if (!user || user.role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Only Administrators can reset demo data.",
      };
    }

    memoryStore.reset();

    revalidatePath("/", "layout");

    return { success: true, message: "Demo data successfully reset to initial clinical baseline." };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to reset demo data.",
    };
  }
}
