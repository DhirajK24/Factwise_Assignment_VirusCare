import React from "react";
import { getTodaysDoctorRoster } from "@/services/doctor.service";
import { DoctorClient } from "@/components/doctor/doctor-client";

export const revalidate = 0;

export default async function DoctorVisitsPage() {
  const rosterData = await getTodaysDoctorRoster();

  return <DoctorClient initialData={rosterData} />;
}

