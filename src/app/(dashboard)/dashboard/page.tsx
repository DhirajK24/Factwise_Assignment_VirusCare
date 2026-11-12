import React from "react";
import { getFacilityAnalytics, getAnalyticsChartData } from "@/services/analytics.service";
import { getFacilityBedsMap } from "@/services/patient.service";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { BedMap } from "@/components/dashboard/bed-map";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Bed,
  Thermometer,
  Stethoscope,
  CheckCircle2,
  Users,
  ShieldCheck,
  Building2,
  ArrowRight,
} from "lucide-react";

export const revalidate = 0;

export default async function DashboardPage() {
  const [metrics, charts, bedsData] = await Promise.all([
    getFacilityAnalytics(),
    getAnalyticsChartData(),
    getFacilityBedsMap(),
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Facility Command Center
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
              <ShieldCheck className="h-3 w-3" /> Real-Time RLS Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            VirusCare Regional Quarantine & Treatment Center • Capacity Limit: 74 Inpatient Beds
          </p>
        </div>

        {/* Quick Workflow Action Shortcuts */}
        <div className="flex items-center gap-2">
          <Link href="/patients">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5 text-slate-600" />
              <span>Patient Registry</span>
            </Button>
          </Link>
          <Link href="/temperature-monitoring">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-blue-700 bg-blue-50/50 border-blue-200 hover:bg-blue-100">
              <Thermometer className="h-3.5 w-3.5" />
              <span>Nurse Monitoring ({metrics.pendingNurseChecksToday} Pending)</span>
            </Button>
          </Link>
          <Link href="/discharge">
            <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Discharge Center ({metrics.dischargeEligibleCount} Ready)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <MetricsCards metrics={metrics} />

      {/* Isolation Bed Status Matrix (74 Beds) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-teal" />
                <span>Quarantine Isolation Unit Bed Status (74 Beds)</span>
              </CardTitle>
              <CardDescription>
                Live operational visualization of inpatient beds. Color-coded by thermal stability and eligibility.
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-navy tabular-nums">
                {bedsData.occupiedCount} / {bedsData.maxCapacity} Occupied
              </span>
              <span className="text-[11px] text-slate-500 block">
                {bedsData.availableCount} beds immediately available
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BedMap beds={bedsData.beds} />
        </CardContent>
      </Card>

      {/* Analytics Visualizations (Recharts) */}
      <AnalyticsCharts
        trendData={charts.trendData}
        tempDistribution={charts.tempDistribution}
        outcomeDistribution={charts.outcomeDistribution}
      />
    </div>
  );
}
