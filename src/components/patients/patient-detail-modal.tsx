"use client";

import React, { useEffect, useState } from "react";
import { Patient, TemperatureReading, DoctorVisit, DischargeEligibilityResult } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, formatCelsius, getStatusBadgeClass, getStatusLabel } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { dischargePatientAction, markPatientDeceasedAction } from "@/app/actions/discharge";
import {
  Thermometer,
  Stethoscope,
  Calendar,
  Bed,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Flame,
  AlertTriangle,
} from "lucide-react";

interface PatientDetailModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function PatientDetailModal({
  patient,
  isOpen,
  onClose,
  onRefresh,
}: PatientDetailModalProps) {
  const { isAdmin, isDoctor } = useAuth();
  const [temperatures, setTemperatures] = useState<TemperatureReading[]>([]);
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [eligibility, setEligibility] = useState<DischargeEligibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDischarging, setIsDischarging] = useState(false);

  useEffect(() => {
    if (!patient || !isOpen) return;

    setIsLoading(true);
    setActionError(null);

    Promise.all([
      fetch(`/api/temperatures?patientId=${patient.id}`).then((res) => res.json()),
      fetch(`/api/doctor-visits?patientId=${patient.id}`).then((res) => res.json()),
      fetch(`/api/discharge?patientId=${patient.id}`).then((res) => res.json()),
    ])
      .then(([tempData, visitData, eligData]) => {
        if (tempData.success) setTemperatures(tempData.history || []);
        if (visitData.success) setVisits(visitData.visits || []);
        if (eligData.success) setEligibility(eligData.evaluation || null);
      })
      .catch((err) => console.error("Error loading patient chart:", err))
      .finally(() => setIsLoading(false));
  }, [patient, isOpen]);

  if (!patient) return null;

  const handleDischarge = async () => {
    if (!confirm(`Are you sure you want to discharge ${patient.full_name} (${patient.patient_code})? This will free Bed #${patient.bed_number} and record clinical cure.`)) {
      return;
    }

    setIsDischarging(true);
    setActionError(null);
    try {
      const res = await dischargePatientAction(patient.id);
      if (res.success) {
        onRefresh();
        onClose();
      } else {
        setActionError(res.error || "Discharge failed.");
      }
    } catch (err: any) {
      setActionError(err?.message || "Error executing discharge.");
    } finally {
      setIsDischarging(false);
    }
  };

  const isEligible = eligibility?.isEligible || patient.status === "discharge_eligible";
  const isActive = patient.status === "active" || patient.status === "discharge_eligible";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal/10 text-teal flex items-center justify-center font-bold text-sm">
                #{patient.bed_number}
              </div>
              <div>
                <DialogTitle className="text-xl text-navy flex items-center gap-2">
                  <span>{patient.full_name}</span>
                  <Badge className={getStatusBadgeClass(patient.status)}>
                    {getStatusLabel(patient.status)}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="font-mono text-xs text-slate-500">
                  {patient.patient_code} • Admitted {formatDate(patient.admission_date)}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs">
            {actionError}
          </div>
        )}

        {/* 3-Consecutive-Day Fever-Free Status Banner */}
        {isActive && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-start justify-between gap-4 ${
              isEligible
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {isEligible ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold flex items-center gap-2">
                  <span>Discharge Eligibility Assessment:</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isEligible
                        ? "bg-emerald-200 text-emerald-900"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {eligibility?.consecutiveFeverFreeDays ?? 0} of 3 Days Normothermic
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {eligibility?.reason || "Patient undergoing daily thermal monitoring routine."}
                </p>

                {/* 3 Day Sequence Indicator */}
                {eligibility?.consecutiveDates && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] font-semibold text-slate-500">3-Day Window:</span>
                    {eligibility.consecutiveDates.map((item, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 border ${
                          item.isMissing
                            ? "bg-slate-100 border-slate-200 text-slate-400"
                            : item.isFeverFree
                            ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                            : "bg-rose-100 border-rose-300 text-rose-800"
                        }`}
                      >
                        <span>{item.date.slice(5)}:</span>
                        <span className="font-bold">
                          {item.isMissing ? "Missing" : `${item.temperature}°C`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isAdmin && isEligible && (
              <Button
                onClick={handleDischarge}
                disabled={isDischarging}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm"
              >
                {isDischarging ? "Discharging..." : "Execute Discharge"}
              </Button>
            )}
          </div>
        )}

        {/* Content Tabs: History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Temperature History */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-xs text-navy uppercase tracking-wider flex items-center gap-1.5">
                <Thermometer className="h-4 w-4 text-teal" /> Temperature Monitoring History
              </span>
              <span className="text-[10px] text-slate-500">{temperatures.length} readings</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {temperatures.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No temperatures recorded yet.</p>
              ) : (
                temperatures.map((t) => {
                  const fever = Number(t.temperature_celsius) >= 37.5;
                  return (
                    <div
                      key={t.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        fever
                          ? "bg-rose-50/60 border-rose-200 text-rose-900"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold tabular-nums text-sm">
                            {formatCelsius(t.temperature_celsius)}
                          </span>
                          {fever && (
                            <Badge variant="destructive" className="h-4 text-[10px] px-1.5">
                              Fever
                            </Badge>
                          )}
                          {t.corrected_at && (
                            <Badge variant="outline" className="h-4 text-[10px] px-1 text-slate-600">
                              Corrected
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {formatDate(t.reading_date)} • {t.recorder_name || "Nurse Staff"}
                        </div>
                        {t.correction_reason && (
                          <div className="text-[10px] text-slate-600 mt-1 italic">
                            Reason: {t.correction_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Doctor Clinical Visits History */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-xs text-navy uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-teal" /> Doctor Clinical Rounds
              </span>
              <span className="text-[10px] text-slate-500">{visits.length} rounds</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {visits.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No doctor rounds recorded yet.</p>
              ) : (
                visits.map((v) => (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy">
                        {v.doctor_name || "Physician"}
                      </span>
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {formatDate(v.visit_date)}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{v.clinical_notes}</p>
                    {v.exception_reason && (
                      <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px]">
                        <strong>Clinical Exception:</strong> {v.exception_reason}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Close Chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

