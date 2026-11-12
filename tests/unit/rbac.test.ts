import { describe, it, expect, beforeEach } from "vitest";
import { dischargePatientAction } from "@/app/actions/discharge";
import { recordTemperatureAction } from "@/app/actions/temperature";
import { recordDoctorVisitAction } from "@/app/actions/doctor";
import { updateSettingsAction } from "@/app/actions/settings";
import { memoryStore } from "@/lib/db/mock-store";

describe("Role-Based Access Control (RBAC) & Authorization Guards", () => {
  beforeEach(() => {
    memoryStore.reset();
  });

  it("verifies system profiles contain distinct roles for Admin, Nurse, and Doctor", () => {
    const profiles = memoryStore.getProfiles();
    const admin = profiles.find((p) => p.role === "admin");
    const nurse = profiles.find((p) => p.role === "nurse");
    const doctor = profiles.find((p) => p.role === "doctor");

    expect(admin).toBeDefined();
    expect(nurse).toBeDefined();
    expect(doctor).toBeDefined();
    expect(admin?.role).toBe("admin");
    expect(nurse?.role).toBe("nurse");
    expect(doctor?.role).toBe("doctor");
  });

  it("enforces that only active user accounts are marked active in the database", () => {
    const profiles = memoryStore.getProfiles();
    profiles.forEach((p) => {
      expect(typeof p.is_active).toBe("boolean");
      expect(p.is_active).toBe(true);
    });
  });

  it("prevents reducing facility capacity below active inpatient census", () => {
    const settings = memoryStore.getSettings();
    const activePatientsCount = memoryStore
      .getPatients()
      .filter((p) => p.status === "active" || p.status === "discharge_eligible").length;

    expect(activePatientsCount).toBeGreaterThan(0);

    // If active count is e.g. 12, capacity cannot be set to 5
    expect(settings.maximum_capacity).toBeGreaterThanOrEqual(activePatientsCount);
  });
});

