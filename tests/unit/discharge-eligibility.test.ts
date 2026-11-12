import { describe, it, expect, beforeEach } from "vitest";
import { evaluatePatientEligibility, dischargePatient } from "@/services/discharge.service";
import { memoryStore } from "@/lib/db/mock-store";
import { format, subDays } from "date-fns";

describe("Discharge Eligibility Engine", () => {
  beforeEach(() => {
    memoryStore.reset();
  });

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
  const day2AgoStr = format(subDays(today, 2), "yyyy-MM-dd");

  it("triggers discharge eligibility after 3 complete consecutive calendar days without fever (< 37.5°C)", async () => {
    // Sophia Martinez (Patient 4) has readings:
    // Day 0: 36.4°C, Day -1: 36.5°C, Day -2: 36.6°C
    const result = await evaluatePatientEligibility(
      "a0000000-0000-0000-0000-000000000004",
      37.5,
      today
    );

    expect(result.isEligible).toBe(true);
    expect(result.consecutiveFeverFreeDays).toBe(3);
    expect(result.hasFeverToday).toBe(false);
    expect(result.missingToday).toBe(false);
  });

  it("does not count missing daily readings as fever-free days", async () => {
    // Patient 5 (Robert Kowalski) has reading yesterday (37.9°C) but NONE TODAY!
    const result = await evaluatePatientEligibility(
      "a0000000-0000-0000-0000-000000000005",
      37.5,
      today
    );

    expect(result.isEligible).toBe(false);
    expect(result.missingToday).toBe(true);
    expect(result.consecutiveFeverFreeDays).toBe(0);
  });

  it("resets consecutive fever-free count to 0 when fever is recorded", async () => {
    // Patient 1 (David Miller) has fever today (38.6°C)
    const result = await evaluatePatientEligibility(
      "a0000000-0000-0000-0000-000000000001",
      37.5,
      today
    );

    expect(result.isEligible).toBe(false);
    expect(result.hasFeverToday).toBe(true);
    expect(result.consecutiveFeverFreeDays).toBe(0);
  });

  it("allows Admin to discharge an eligible patient and frees the bed", async () => {
    const patientId = "a0000000-0000-0000-0000-000000000004"; // Sophia Martinez, Bed 4
    const adminId = "11111111-1111-1111-1111-111111111111";

    const discharged = await dischargePatient(patientId, adminId);

    expect(discharged.status).toBe("discharged");
    expect(discharged.outcome).toBe("recovered");
    expect(discharged.outcome_date).toBeDefined();

    // Verify bed is freed in store
    const patientInStore = memoryStore.getPatientById(patientId);
    expect(patientInStore?.status).toBe("discharged");
    expect(patientInStore?.outcome).toBe("recovered");
  });

  it("rejects discharge attempt if patient is ineligible", async () => {
    const patientId = "a0000000-0000-0000-0000-000000000001"; // David Miller (has fever)
    const adminId = "11111111-1111-1111-1111-111111111111";

    await expect(dischargePatient(patientId, adminId)).rejects.toThrow(/DISCHARGE_REJECTED/);
  });
});

