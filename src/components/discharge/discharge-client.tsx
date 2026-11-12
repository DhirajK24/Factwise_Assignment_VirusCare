"use client";

import React, { useState } from "react";
import { Patient, DischargeEligibilityResult } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCelsius } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { dischargePatientAction } from "@/app/actions/discharge";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Bed,
  Calendar,
  Sparkles,
  ArrowRight,
  Flame,
  Check,
  X,
} from "lucide-react";

interface DischargeCandidate {
  patient: Patient;
  eligibility: DischargeEligibilityResult;
}

interface DischargeClientProps {
  candidates: DischargeCandidate[];
  feverThreshold: number;
}

export function DischargeClient({
  candidates,
  feverThreshold,
}: DischargeClientProps) {
  const { isAdmin } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"eligible" | "progress" | "discharged">("eligible");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const eligibleList = candidates.filter((c) => c.eligibility.isEligible);
  const inProgressList = candidates.filter((c) => !c.eligibility.isEligible && c.patient.status !== "discharged");

  const handleExecuteDischarge = async (candidate: DischargeCandidate) => {
    if (
      !confirm(
        `Confirm clinical discharge for ${candidate.patient.full_name} (${candidate.patient.patient_code})?\n\nVerification: 3 consecutive calendar days without fever (<${feverThreshold}°C). Bed #${candidate.patient.bed_number} will be freed immediately.`
      )
    ) {
      return;
    }

    setIsProcessing(candidate.patient.id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const res = await dischargePatientAction(candidate.patient.id);
      if (!res.success) {
        setActionError(res.error || "Discharge rejected by server validation.");
      } else {
        setSuccessMessage(
          `Patient ${candidate.patient.full_name} successfully discharged. Bed #${candidate.patient.bed_number} is now available in quarantine isolation pool.`
        );
        router.refresh();
      }
    } catch (err: any) {
      setActionError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <span>Discharge Eligibility Engine & Discharge Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical Cure Standard: Patient is certified cured and eligible for discharge after <strong>three full consecutive calendar days without fever</strong> (&lt;{feverThreshold}°C).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-slate-600 bg-white border-slate-300">
            Fever Threshold: {feverThreshold}°C
          </Badge>
          <Badge className="bg-emerald-600 text-white font-bold">
            {eligibleList.length} Ready for Discharge
          </Badge>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Server Discharge Guard:</span> {actionError}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Clinical Action Verified:</span> {successMessage}
          </div>
        </div>
      )}

      {/* Rule Protocol Explanation Box */}
      <div className="p-4 rounded-xl border border-teal-200/80 bg-teal-50/40 text-xs text-slate-700 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-teal shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-navy text-sm">Automated Discharge Engine Rule Specifications</div>
          <p className="leading-relaxed">
            Every candidate must demonstrate valid daily temperature entries on three unbroken consecutive calendar days (Day 0, Day -1, Day -2). Any missing reading immediately breaks the sequence and prevents eligibility. Any fever reading (≥{feverThreshold}°C) resets the counter to 0. When Admin executes discharge, the server independently re-validates the database records before changing patient status to <code>discharged</code>, outcome to <code>recovered</code>, and freeing the bed.
          </p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("eligible")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "eligible"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Eligible Candidates ({eligibleList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("progress")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "progress"
              ? "bg-navy text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>In Progress Monitoring ({inProgressList.length})</span>
        </button>
      </div>

      {/* Candidates Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Bed</TableHead>
              <TableHead>Patient Code</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Admission Date</TableHead>
              <TableHead>3-Day Thermal Sequence</TableHead>
              <TableHead>Consecutive Days</TableHead>
              <TableHead>Eligibility State</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(activeTab === "eligible" ? eligibleList : inProgressList).length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500 text-sm">
                  {activeTab === "eligible"
                    ? "No patients currently meet the full 3-day consecutive fever-free requirement."
                    : "No in-progress candidates found."}
                </TableCell>
              </TableRow>
            ) : (
              (activeTab === "eligible" ? eligibleList : inProgressList).map(
                ({ patient, eligibility }) => {
                  const isEligible = eligibility.isEligible;
                  const isCurrentProcessing = isProcessing === patient.id;

                  return (
                    <TableRow key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell className="font-bold text-navy">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-teal/10 text-teal font-bold text-xs">
                          #{patient.bed_number}
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-semibold text-slate-700">
                        {patient.patient_code}
                      </TableCell>

                      <TableCell className="font-medium text-navy text-sm">
                        {patient.full_name}
                        <span className="text-[11px] text-slate-400 block">Age {patient.age}</span>
                      </TableCell>

                      <TableCell className="text-xs text-slate-600 tabular-nums">
                        {formatDate(patient.admission_date)}
                      </TableCell>

                      {/* 3-Day Breakdown Pill Visualizer */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {eligibility.consecutiveDates.map((item, idx) => (
                            <div
                              key={idx}
                              title={`${item.date}: ${
                                item.isMissing ? "No reading" : `${item.temperature}°C`
                              }`}
                              className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border ${
                                item.isMissing
                                  ? "bg-slate-100 border-slate-300 text-slate-400"
                                  : item.isFeverFree
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                  : "bg-rose-50 border-rose-300 text-rose-800"
                              }`}
                            >
                              {item.isMissing ? (
                                <X className="h-3 w-3 text-slate-400" />
                              ) : item.isFeverFree ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Flame className="h-3 w-3 text-rose-500" />
                              )}
                              <span>{item.isMissing ? "--" : `${item.temperature}°`}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="font-bold font-mono text-xs">
                        <span
                          className={`tabular-nums ${
                            isEligible ? "text-emerald-700 text-sm" : "text-slate-600"
                          }`}
                        >
                          {eligibility.consecutiveFeverFreeDays} / 3 Days
                        </span>
                      </TableCell>

                      <TableCell>
                        {isEligible ? (
                          <Badge variant="success" className="gap-1 animate-in zoom-in-95">
                            <CheckCircle2 className="h-3 w-3" /> Cured • Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            Monitoring ({eligibility.consecutiveFeverFreeDays} d)
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {isEligible ? (
                          isAdmin ? (
                            <Button
                              size="sm"
                              onClick={() => handleExecuteDischarge({ patient, eligibility })}
                              disabled={isCurrentProcessing}
                              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{isCurrentProcessing ? "Discharging..." : "Confirm Discharge"}</span>
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Admin Authorization Required
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">Ineligible</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                }
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

