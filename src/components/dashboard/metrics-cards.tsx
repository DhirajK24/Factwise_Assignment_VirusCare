"use client";

import React from "react";
import { AnalyticsMetrics } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Bed,
  Thermometer,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface MetricsCardsProps {
  metrics: AnalyticsMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total Admitted",
      value: metrics.totalAdmitted.toString(),
      subtext: `${metrics.completedOutcomes} completed outcomes`,
      icon: Users,
      color: "text-navy",
      bg: "bg-navy-50",
    },
    {
      title: "Facility Occupancy",
      value: `${metrics.occupiedBeds} / ${metrics.maximumCapacity}`,
      subtext: `${metrics.availableBeds} beds currently free`,
      icon: Bed,
      color: "text-teal",
      bg: "bg-teal-50",
    },
    {
      title: "Pending Nurse Checks",
      value: metrics.pendingNurseChecksToday.toString(),
      subtext: "Required before doctor visits",
      icon: Thermometer,
      color: metrics.pendingNurseChecksToday > 0 ? "text-amber-600" : "text-emerald-600",
      bg: metrics.pendingNurseChecksToday > 0 ? "bg-amber-50" : "bg-emerald-50",
    },
    {
      title: "Pending Doctor Visits",
      value: metrics.pendingDoctorVisitsToday.toString(),
      subtext: "Active inpatient rounds",
      icon: Stethoscope,
      color: metrics.pendingDoctorVisitsToday > 0 ? "text-blue-600" : "text-emerald-600",
      bg: metrics.pendingDoctorVisitsToday > 0 ? "bg-blue-50" : "bg-emerald-50",
    },
    {
      title: "Discharge Eligible",
      value: metrics.dischargeEligibleCount.toString(),
      subtext: "≥ 3 consecutive fever-free days",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      highlight: true,
    },
    {
      title: "Mortality Rate",
      value: metrics.mortalityRate !== null ? `${metrics.mortalityRate}%` : "N/A",
      subtext:
        metrics.mortalityRate !== null
          ? `Benchmark 15.0% (${metrics.mortalityDiff > 0 ? `+${metrics.mortalityDiff}%` : `${metrics.mortalityDiff}%`})`
          : "No completed outcomes yet",
      icon: HeartPulse,
      color: metrics.isMortalityAlert ? "text-rose-600" : "text-slate-700",
      bg: metrics.isMortalityAlert ? "bg-rose-50 border-rose-200" : "bg-slate-50",
      alert: metrics.isMortalityAlert,
    },
    {
      title: "Treatment Success Rate",
      value: metrics.treatmentSuccessRate !== null ? `${metrics.treatmentSuccessRate}%` : "N/A",
      subtext:
        metrics.treatmentSuccessRate !== null
          ? `Benchmark 85.0% (${metrics.successDiff >= 0 ? `+${metrics.successDiff}%` : `${metrics.successDiff}%`})`
          : "Excludes active inpatients",
      icon: TrendingUp,
      color: metrics.isSuccessWarning ? "text-amber-600" : "text-emerald-600",
      bg: metrics.isSuccessWarning ? "bg-amber-50" : "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Prominent Benchmark Warning (Phase 11 requirement) */}
      {metrics.isMortalityAlert && (
        <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 flex items-start gap-3 shadow-xs animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-bold flex items-center gap-2">
              <span>CLINICAL BENCHMARK ALERT: Elevated Quarantine Facility Mortality</span>
              <span className="text-xs bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                {metrics.mortalityRate}% vs 15.0% Benchmark (+{metrics.mortalityDiff}%)
              </span>
            </div>
            <p className="text-rose-700 text-xs mt-1 leading-relaxed">
              Mortality among completed patient outcomes currently exceeds the epidemiological benchmark (15%). Total deaths: {metrics.totalDeaths} out of {metrics.completedOutcomes} completed patient outcomes. Medical Director and Infectious Disease specialists must review ICU transfer criteria and supportive antipyretic protocols. Active inpatients ({metrics.activePatients}) are excluded from the denominator.
            </p>
          </div>
        </div>
      )}

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((card, idx) => (
          <Card
            key={idx}
            className={`border transition-all duration-150 ${
              card.alert
                ? "border-rose-300 bg-rose-50/40"
                : card.highlight
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-200/80 bg-white"
            }`}
          >
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-md ${card.bg} ${card.color}`}>
                  <card.icon className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-navy tabular-nums">
                  {card.value}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {card.subtext}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
