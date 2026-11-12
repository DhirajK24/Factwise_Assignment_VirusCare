import { describe, it, expect, beforeEach } from "vitest";
import { recordDailyTemperature, correctTemperatureReading } from "@/services/temperature.service";
import { recordDoctorVisit } from "@/services/doctor.service";
import { memoryStore } from "@/lib/db/mock-store";
import { format, subDays } from "date-fns";

describe("Clinical Workflows: Nursing Monitoring & Doctor Rounds", () => {
  beforeEach(() => {
    memoryStore.reset();
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const nurseId = "22222222-2222-2222-2222-222222222222";
  const doctorId = "44444444-4444-4444-4444-444444444444";

  it("records daily temperature and prevents duplicate daily readings", async () => {
    // Patient 5 has no reading today
    const reading = await recordDailyTemperature({
      patient_id: "a0000000-0000-0000-0000-000000000005",
      temperature_celsius: 36.9,
      reading_date: todayStr,
      recorded_by: nurseId,
    });

    expect(reading.id).toBeDefined();
    expect(Number(reading.temperature_celsius)).toBe(36.9);

    // Attempting to record duplicate reading on the same day must fail
    await expect(
      recordDailyTemperature({
        patient_id: "a0000000-0000-0000-0000-000000000005",
        temperature_celsius: 37.2,
        reading_date: todayStr,
        recorded_by: nurseId,
      })
    ).rejects.toThrow(/DUPLICATE_READING/);
  });

  it("requires a detailed reason for authorized temperature corrections", async () => {
    const readings = memoryStore.getTemperatureReadings();
    const readingToCorrect = readings[0];

    const corrected = await correctTemperatureReading({
      reading_id: readingToCorrect.id,
      temperature_celsius: 37.1,
      correction_reason: "Thermometer sensor re-calibrated; verified by charge nurse.",
      actor_id: nurseId,
    });

    expect(Number(corrected.temperature_celsius)).toBe(37.1);
    expect(corrected.correction_reason).toBe("Thermometer sensor re-calibrated; verified by charge nurse.");
    expect(corrected.corrected_at).toBeDefined();

    // Verify audit log created
    const logs = memoryStore.getAuditLogs();
    const log = logs.find((l) => l.action === "TEMPERATURE_CORRECTED");
    expect(log).toBeDefined();
  });

  it("blocks a normal doctor visit if today's nurse temperature check is missing", async () => {
    // Patient 5 has NO nurse reading today
    await expect(
      recordDoctorVisit({
        patient_id: "a0000000-0000-0000-0000-000000000005",
        visit_date: todayStr,
        doctor_id: doctorId,
        clinical_notes: "Patient resting comfortably.",
        // No exception_reason provided!
      })
    ).rejects.toThrow(/NURSE_READING_REQUIRED/);
  });

  it("allows doctor visit with authorized clinical exception when nurse reading is missing", async () => {
    const visit = await recordDoctorVisit({
      patient_id: "a0000000-0000-0000-0000-000000000005",
      visit_date: todayStr,
      doctor_id: doctorId,
      clinical_notes: "Emergency respiratory assessment conducted bedside.",
      exception_reason: "Immediate bedside evaluation required prior to scheduled nursing shift check.",
    });

    expect(visit.id).toBeDefined();
    expect(visit.exception_reason).toContain("Immediate bedside evaluation");

    // Verify audit log specifically logs DOCTOR_VISIT_RECORDED_WITH_EXCEPTION
    const logs = memoryStore.getAuditLogs();
    const log = logs.find((l) => l.action === "DOCTOR_VISIT_RECORDED_WITH_EXCEPTION");
    expect(log).toBeDefined();
  });

  it("allows normal doctor visit when nurse reading is present", async () => {
    // Patient 1 (David Miller) already has today's nurse reading
    // Let's use Patient 2 (Amara Okafor) who has today's nurse reading (36.8°C) but no doctor visit today
    const visit = await recordDoctorVisit({
      patient_id: "a0000000-0000-0000-0000-000000000002",
      visit_date: todayStr,
      doctor_id: doctorId,
      clinical_notes: "Patient afebrile and responding favorably to treatment protocol.",
    });

    expect(visit.id).toBeDefined();
    expect(visit.exception_reason).toBeNull();
  });
});

