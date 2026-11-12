import React from "react";
import { getTodaysNurseMonitoringList } from "@/services/temperature.service";
import { NurseClient } from "@/components/nurse/nurse-client";

export const revalidate = 0;

export default async function TemperatureMonitoringPage() {
  const monitoringData = await getTodaysNurseMonitoringList();

  return <NurseClient initialData={monitoringData} />;
}
