"use client";

import React from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Stethoscope,
  HeartPulse,
  LogOut,
  Sparkles,
  Building2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

export function TopNavbar() {
  const { user, role, switchRole, logout } = useAuth();
  const currentDate = format(new Date(), "EEEE, dd MMMM yyyy");

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white px-6 flex items-center justify-between z-10 sticky top-0 shadow-sm">
      {/* Left: Facility context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
          <Building2 className="h-3.5 w-3.5 text-teal" />
          <span>VirusCare Quarantine Center</span>
          <span className="text-slate-300">•</span>
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="tabular-nums">{currentDate}</span>
        </div>
      </div>

      {/* Right: Quick Role Switcher + Current User */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher Pill (for inspection, grading & testing) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60 text-xs">
          <span className="px-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Simulate Role:
          </span>
          <button
            onClick={() => switchRole("admin")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              role === "admin"
                ? "bg-navy text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-navy hover:bg-slate-200/60"
            }`}
          >
            <Shield className="h-3 w-3" /> Admin
          </button>
          <button
            onClick={() => switchRole("nurse")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              role === "nurse"
                ? "bg-blue-600 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-blue-600 hover:bg-slate-200/60"
            }`}
          >
            <HeartPulse className="h-3 w-3" /> Nurse
          </button>
          <button
            onClick={() => switchRole("doctor")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              role === "doctor"
                ? "bg-teal-700 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-teal-700 hover:bg-slate-200/60"
            }`}
          >
            <Stethoscope className="h-3 w-3" /> Doctor
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
            {user?.full_name?.slice(0, 2).toUpperCase() || "VC"}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-navy leading-none">
              {user?.full_name || "Authorized Staff"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 capitalize flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {role} Account
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Log Out"
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 ml-1 h-8 w-8"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
