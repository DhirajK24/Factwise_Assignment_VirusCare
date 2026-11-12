import React from "react";
import { listPatients, getFacilityBedsMap } from "@/services/patient.service";
import { PatientClient } from "@/components/patients/patient-client";

export const revalidate = 0;

export default async function PatientsPage() {
  const [patientsData, bedsData] = await Promise.all([
    listPatients({ limit: 100 }),
    getFacilityBedsMap(),
  ]);

  return (
    <PatientClient
      initialPatients={patientsData.patients}
      beds={bedsData.beds}
      maxCapacity={bedsData.maxCapacity}
    />
  );
}
