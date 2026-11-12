import { describe, it, expect, beforeEach } from "vitest";
import { admitPatient, getFacilityBedsMap } from "@/services/patient.service";
import { dischargePatient } from "@/services/discharge.service";
import { memoryStore } from "@/lib/db/mock-store";
import { format } from "date-fns";

describe("Bed Allocation & Facility Capacity Enforcement", () => {
  beforeEach(() => {
    memoryStore.reset();
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");

  it("admits a patient and assigns an available bed", async () => {
    const bedMap = await getFacilityBedsMap();
    const freeBed = bedMap.beds.find((b) => !b.isOccupied);
    expect(freeBed).toBeDefined();

    const patient = await admitPatient({
      patient_code: "VC-TEST-0001",
      full_name: "Test Inpatient",
      age: 45,
      gender: "male",
      admission_date: todayStr,
      bed_number: freeBed!.bedNumber,
      created_by: "11111111-1111-1111-1111-111111111111",
    });

    expect(patient.id).toBeDefined();
    expect(patient.bed_number).toBe(freeBed!.bedNumber);
    expect(patient.status).toBe("active");
  });

  it("rejects duplicate assignment of a currently occupied bed", async () => {
    // Bed 1 is occupied by David Miller
    await expect(
      admitPatient({
        patient_code: "VC-TEST-DUP",
        full_name: "Duplicate Bed Patient",
        age: 30,
        admission_date: todayStr,
        bed_number: 1, // Already occupied!
        created_by: "11111111-1111-1111-1111-111111111111",
      })
    ).rejects.toThrow(/BED_ALREADY_OCCUPIED/);
  });

  it("rejects invalid bed numbers outside range 1..74", async () => {
    await expect(
      admitPatient({
        patient_code: "VC-TEST-OOB",
        full_name: "Invalid Bed Patient",
        age: 30,
        admission_date: todayStr,
        bed_number: 75, // Out of range!
        created_by: "11111111-1111-1111-1111-111111111111",
      })
    ).rejects.toThrow(/INVALID_BED_NUMBER/);
  });

  it("blocks admission when facility reaches maximum capacity (74 beds)", async () => {
    // Fill up all remaining beds until 74
    const bedMap = await getFacilityBedsMap();
    const availableBeds = bedMap.beds.filter((b) => !b.isOccupied);

    for (let i = 0; i < availableBeds.length; i++) {
      memoryStore.addPatient({
        id: crypto.randomUUID(),
        patient_code: `VC-CAP-${i}`,
        full_name: `Capacity Fill Patient ${i}`,
        age: 40,
        admission_date: todayStr,
        bed_number: availableBeds[i].bedNumber,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Now facility is at 74/74
    await expect(
      admitPatient({
        patient_code: "VC-OVERFLOW",
        full_name: "Overflow Patient",
        age: 50,
        admission_date: todayStr,
        bed_number: 1,
        created_by: "11111111-1111-1111-1111-111111111111",
      })
    ).rejects.toThrow(/FACILITY_CAPACITY_REACHED/);
  });
});

