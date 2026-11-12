"use client";

import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

interface AnalyticsChartsProps {
  trendData: Array<{
    date: string;
    admissions: number;
    discharges: number;
    deaths: number;
  }>;
  tempDistribution: Array<{
    range: string;
    count: number;
  }>;
  outcomeDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export function AnalyticsCharts({
  trendData,
  tempDistribution,
  outcomeDistribution,
}: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart 1: Admissions & Discharges Trend (14 Days) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inpatient Flow: Admissions & Discharges (14 Days)</CardTitle>
              <CardDescription>
                Chronological timeline of daily admissions, successful discharges, and clinical mortality
              </CardDescription>
            </div>
            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
              Rolling 14-Day Window
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="admissionsColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dischargesColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#14243A",
                    borderColor: "#1E293B",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Area
                  type="monotone"
                  dataKey="admissions"
                  name="Admissions"
                  stroke="#0D9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#admissionsColor)"
                />
                <Area
                  type="monotone"
                  dataKey="discharges"
                  name="Recovered Discharges"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dischargesColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart 2: Cumulative Outcome Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Outcome Distribution</CardTitle>
          <CardDescription>
            Patient clinical disposition breakdown
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {outcomeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#14243A",
                    borderColor: "#1E293B",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full space-y-2 mt-2 pt-2 border-t border-slate-100 text-xs">
            {outcomeDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-navy tabular-nums">{item.value} patients</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart 3: Temperature Severity Distribution Today */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Inpatient Thermal Distribution</CardTitle>
              <CardDescription>
                Recorded body temperature stratification for active inpatients today
              </CardDescription>
            </div>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
              Fever Threshold: 37.5°C
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tempDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#14243A",
                    borderColor: "#1E293B",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Patient Count" fill="#0D9488" radius={[4, 4, 0, 0]}>
                  {tempDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index >= 2 ? (index >= 3 ? "#DC2626" : "#D97706") : "#0D9488"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
