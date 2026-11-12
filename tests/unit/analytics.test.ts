import { describe, it, expect, beforeEach } from "vitest";
import { getFacilityAnalytics } from "@/services/analytics.service";
import { memoryStore } from "@/lib/db/mock-store";

describe("Mortality and Treatment Analytics Service", () => {
  beforeEach(() => {
    memoryStore.reset();
  });

  it("calculates mortality and treatment success rate correctly using only completed outcomes", async () => {
    const analytics = await getFacilityAnalytics();

    // From initial seed:
    // Total Discharged (recovered): 2 (Grace Hopper, Alan Turing)
    // Total Deaths: 1 (Arthur Pendelton)
    // Completed outcomes: 2 + 1 = 3
    expect(analytics.completedOutcomes).toBe(3);
    expect(analytics.totalDeaths).toBe(1);
    expect(analytics.totalDischarged).toBe(2);

    // Mortality Rate: 1 / 3 * 100 = 33.3%
    expect(analytics.mortalityRate).toBe(33.3);

    // Treatment Success Rate: 2 / 3 * 100 = 66.7%
    expect(analytics.treatmentSuccessRate).toBe(66.7);

    // Active inpatients must be excluded from completed outcomes
    expect(analytics.activePatients).toBeGreaterThan(0);
    expect(analytics.completedOutcomes).not.toContain(analytics.activePatients);
  });

  it("triggers prominent mortality alert when mortality exceeds 15% benchmark", async () => {
    const analytics = await getFacilityAnalytics();

    // 33.3% > 15.0%
    expect(analytics.isMortalityAlert).toBe(true);
    expect(analytics.mortalityDiff).toBe(18.3); // 33.3 - 15.0
  });

  it("triggers warning when treatment success rate is below 85% benchmark", async () => {
    const analytics = await getFacilityAnalytics();

    // 66.7% < 85.0%
    expect(analytics.isSuccessWarning).toBe(true);
    expect(analytics.successDiff).toBe(-18.3);
  });

  it("correctly tracks bed occupancy against maximum capacity 74", async () => {
    const analytics = await getFacilityAnalytics();

    expect(analytics.maximumCapacity).toBe(74);
    expect(analytics.occupiedBeds).toBe(analytics.activePatients);
    expect(analytics.availableBeds).toBe(74 - analytics.occupiedBeds);
    expect(analytics.occupiedBeds + analytics.availableBeds).toBe(74);
  });
});

