import React from "react";
import { getAuditLogs } from "@/services/audit.service";
import { AuditClient } from "@/components/audit/audit-client";

export const revalidate = 0;

export default async function AuditHistoryPage() {
  const { logs, totalCount } = await getAuditLogs({ limit: 100 });

  return <AuditClient logs={logs} totalCount={totalCount} />;
}

