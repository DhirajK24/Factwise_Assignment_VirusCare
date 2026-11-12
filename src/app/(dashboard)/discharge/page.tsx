import React from "react";
import { listPatients } from "@/services/patient.service";
import { evaluatePatientEligibility } from "@/services/discharge.service";
import { getFacilitySettings } from "@/services/facility.service";
import { DischargeClient } from "@/components/discharge/discharge-client";

export const revalidate = 0;

export default async function DischargePage() {
  const settings = await getFacilitySettings();
  const threshold = settings.fever_threshold_celsius;

  const { patients } = await listPatients({ status: "all", limit: 100 });

  const activePatients = patients.filter(
    (p) => p.status === "active" || p.status === "discharge_eligible"
  );

  const candidates = await Promise.all(
    activePatients.map(async (patient) => {
      const eligibility = await evaluatePatientEligibility(patient.id, threshold);
      return { patient, eligibility };
    })
  );

  return <DischargeClient candidates={candidates} feverThreshold={threshold} />;
}

