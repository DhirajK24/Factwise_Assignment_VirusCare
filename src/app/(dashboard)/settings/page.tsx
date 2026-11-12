import React from "react";
import { getFacilitySettings, listSystemUsers } from "@/services/facility.service";
import { getFacilityAnalytics } from "@/services/analytics.service";
import { SettingsClient } from "@/components/settings/settings-client";

export const revalidate = 0;

export default async function SettingsPage() {
  const [settings, users, analytics] = await Promise.all([
    getFacilitySettings(),
    listSystemUsers(),
    getFacilityAnalytics(),
  ]);

  return (
    <SettingsClient
      initialSettings={settings}
      users={users}
      currentOccupancy={analytics.occupiedBeds}
    />
  );
}

