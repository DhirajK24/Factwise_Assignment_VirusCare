"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import {
  Activity,
  Users,
  Thermometer,
  Stethoscope,
  CheckCircle2,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  Bed,
  Sparkles,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { role, isAdmin } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Activity,
      roles: ["admin", "nurse", "doctor"],
    },
    {
      name: "Patient Registry",
      href: "/patients",
      icon: Users,
      roles: ["admin", "nurse", "doctor"],
    },
    {
      name: "Nurse Monitoring",
      href: "/temperature-monitoring",
      icon: Thermometer,
      roles: ["admin", "nurse"],
      badge: "Shift Routine",
    },
    {
      name: "Doctor Visits",
      href: "/doctor-visits",
      icon: Stethoscope,
      roles: ["admin", "doctor"],
      badge: "Clinical",
    },
    {
      name: "Discharge Center",
      href: "/discharge",
      icon: CheckCircle2,
      roles: ["admin", "doctor"],
      highlight: true,
    },
    {
      name: "Analytics & Outcomes",
      href: "/analytics",
      icon: BarChart3,
      roles: ["admin", "doctor"],
    },
    {
      name: "Audit Trail",
      href: "/audit-history",
      icon: History,
      roles: ["admin"],
    },
    {
      name: "Facility Settings",
      href: "/settings",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-navy text-white flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-navy-700/60 gap-3">
        <div className="h-9 w-9 rounded-xl bg-teal flex items-center justify-center text-white shadow-sm ring-2 ring-teal-400/30">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-white text-base">VirusCare</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[10px] text-slate-400 tracking-tight leading-none mt-0.5">
            Quarantine & Treatment SaaS
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Healthcare Navigation
        </div>

        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const hasAccess = item.roles.includes(role);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-teal text-white shadow-sm"
                  : hasAccess
                  ? "text-slate-300 hover:bg-navy-700 hover:text-white"
                  : "text-slate-500 hover:text-slate-400 hover:bg-navy-800/40 opacity-70"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-teal-300"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </div>

              {item.highlight && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                  3-Day Rule
                </span>
              )}

              {item.badge && !item.highlight && (
                <span className="text-[10px] bg-navy-700 text-slate-300 px-1.5 py-0.5 rounded text-xs">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Facility Operational Badge */}
      <div className="p-3 mx-3 mb-4 rounded-xl bg-navy-900 border border-navy-700/80">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Bed className="h-3.5 w-3.5 text-teal" /> Bed Occupancy
          </span>
          <span className="font-bold text-white tabular-nums">74 Max</span>
        </div>
        <div className="w-full bg-navy-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-teal h-1.5 rounded-full w-[22%]" />
        </div>
        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-emerald-400" /> PostgreSQL RLS Active
        </p>
      </div>
    </aside>
  );
}
