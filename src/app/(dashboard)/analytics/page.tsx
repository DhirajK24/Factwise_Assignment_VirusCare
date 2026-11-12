import React from "react";
import { getFacilityAnalytics, getAnalyticsChartData } from "@/services/analytics.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import {
  BarChart3,
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Users,
  Activity,
  Bed,
} from "lucide-react";

export const revalidate = 0;

export default async function AnalyticsPage() {
  const [metrics, charts] = await Promise.all([
    getFacilityAnalytics(),
    getAnalyticsChartData(),
  ]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-teal" />
            <span>Mortality & Treatment Efficacy Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Epidemiological surveillance metrics computed directly from immutable database outcome records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
            Database Aggregation Engine
          </span>
        </div>
      </div>

      {/* Prominent Benchmark Alert if Mortality > 15% */}
      {metrics.isMortalityAlert && (
        <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm flex items-center gap-2">
              <span>STATISTICAL SURVEILLANCE WARNING: Elevated Mortality Rate</span>
              <span className="bg-rose-200 text-rose-900 text-xs px-2 py-0.5 rounded-full font-bold">
                {metrics.mortalityRate}% vs 15.0% Benchmark
              </span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              The facility's recorded mortality rate of <strong>{metrics.mortalityRate}%</strong> exceeds the standard expected epidemiological threshold of <strong>15.0%</strong> by <strong>+{metrics.mortalityDiff}%</strong>.
              Formula: Deaths ({metrics.totalDeaths}) / Completed Outcomes ({metrics.completedOutcomes}) × 100.
              Active patients ({metrics.activePatients}) are excluded from the denominator.
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Mortality Rate Card */}
        <Card className={`border ${metrics.isMortalityAlert ? "border-rose-300 bg-rose-50/40" : ""}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Facility Mortality Rate
              </span>
              <HeartPulse className={`h-4 w-4 ${metrics.isMortalityAlert ? "text-rose-600" : "text-slate-500"}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-navy tabular-nums">
              {metrics.mortalityRate !== null ? `${metrics.mortalityRate}%` : "N/A"}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Benchmark: 15.0%</span>
              {metrics.mortalityRate !== null && (
                <span className={metrics.isMortalityAlert ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                  ({metrics.mortalityDiff > 0 ? `+${metrics.mortalityDiff}%` : `${metrics.mortalityDiff}%`})
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Numerator: {metrics.totalDeaths} Deaths • Denominator: {metrics.completedOutcomes} Completed
            </div>
          </CardContent>
        </Card>

        {/* Treatment Success Rate Card */}
        <Card className={`border ${metrics.isSuccessWarning ? "border-amber-300 bg-amber-50/40" : ""}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Treatment Success Rate
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-navy tabular-nums">
              {metrics.treatmentSuccessRate !== null ? `${metrics.treatmentSuccessRate}%` : "N/A"}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Benchmark: 85.0%</span>
              {metrics.treatmentSuccessRate !== null && (
                <span className={metrics.treatmentSuccessRate >= 85 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                  ({metrics.successDiff >= 0 ? `+${metrics.successDiff}%` : `${metrics.successDiff}%`})
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Numerator: {metrics.totalDischarged} Cured • Denominator: {metrics.completedOutcomes} Completed
            </div>
          </CardContent>
        </Card>

        {/* Inpatient Census */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Quarantine Census
              </span>
              <Bed className="h-4 w-4 text-teal" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-navy tabular-nums">
              {metrics.activePatients}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {metrics.occupiedBeds} of {metrics.maximumCapacity} Isolation Beds ({metrics.bedOccupancyRate}% Occupancy)
            </div>
            <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
              {metrics.availableBeds} beds available for new admissions
            </div>
          </CardContent>
        </Card>

        {/* Total Admitted */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cumulative Admitted
              </span>
              <Users className="h-4 w-4 text-navy" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-navy tabular-nums">
              {metrics.totalAdmitted}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Total historical intake registered
            </div>
            <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
              {metrics.dischargeEligibleCount} currently discharge eligible
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Analytics Charts */}
      <AnalyticsCharts
        trendData={charts.trendData}
        tempDistribution={charts.tempDistribution}
        outcomeDistribution={charts.outcomeDistribution}
      />
    </div>
  );
}

