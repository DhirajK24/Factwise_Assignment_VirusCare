"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { recordDoctorVisitAction } from "@/app/actions/doctor";
import { markPatientDeceasedAction } from "@/app/actions/discharge";
import { Patient } from "@/types";
import { Stethoscope, AlertTriangle, ShieldAlert, CheckCircle2, Skull } from "lucide-react";
import { format } from "date-fns";

interface RecordVisitModalProps {
  patient: Patient | null;
  todayTemp: number | null;
  hasNurseReading: boolean;
  isFever: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  visitDate?: string;
}

export function RecordVisitModal({
  patient,
  todayTemp,
  hasNurseReading,
  isFever,
  isOpen,
  onClose,
  onSuccess,
  visitDate,
}: RecordVisitModalProps) {
  const [targetDate] = useState<string>(visitDate || format(new Date(), "yyyy-MM-dd"));
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isExceptionMode, setIsExceptionMode] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [isDeceasedMode, setIsDeceasedMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clinicalNotes.trim() || clinicalNotes.trim().length < 10) {
      setError("Clinical notes must be at least 10 characters.");
      return;
    }

    if (!hasNurseReading) {
      if (!isExceptionMode) {
        setError(
          "Nurse check is missing. You must explicitly toggle and provide a clinical exception reason to proceed."
        );
        return;
      }
      if (!exceptionReason.trim() || exceptionReason.trim().length < 10) {
        setError("Clinical exception reason must be at least 10 characters.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isDeceasedMode) {
        const decRes = await markPatientDeceasedAction(patient.id, clinicalNotes);
        if (!decRes.success) {
          setError(decRes.error || "Failed to record deceased outcome.");
          return;
        }
      } else {
        const res = await recordDoctorVisitAction({
          patient_id: patient.id,
          visit_date: targetDate,
          clinical_notes: clinicalNotes.trim(),
          exception_reason: !hasNurseReading ? exceptionReason.trim() : undefined,
        });

        if (!res.success) {
          setError(res.error || "Failed to record doctor visit.");
          return;
        }
      }

      onSuccess();
      onClose();
      setClinicalNotes("");
      setExceptionReason("");
      setIsExceptionMode(false);
      setIsDeceasedMode(false);
    } catch (err: any) {
      setError(err?.message || "Unexpected error recording visit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-teal" />
            <span>Record Doctor Clinical Round</span>
          </DialogTitle>
          <DialogDescription>
            Clinical progress assessment for Bed #{patient.bed_number} ({patient.patient_code})
          </DialogDescription>
        </DialogHeader>

        {/* Patient Status Overview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-navy text-sm">{patient.full_name}</div>
            <div className="text-slate-500 font-mono">
              Age {patient.age} • Bed #{patient.bed_number}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-500">Today's Temperature:</div>
            {hasNurseReading ? (
              <div
                className={`font-bold font-mono text-sm tabular-nums flex items-center justify-end gap-1 ${
                  isFever ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                <span>{todayTemp}°C</span>
                {isFever && <span className="text-[10px] px-1 bg-rose-100 rounded">FEVER</span>}
              </div>
            ) : (
              <span className="text-amber-600 font-bold text-xs">Missing Reading</span>
            )}
          </div>
        </div>

        {/* Missing Nurse Reading Rule Warning (Phase 9 requirement) */}
        {!hasNurseReading && (
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Protocol Gate: Nurse Temperature Check Missing</span>
                <p className="text-amber-800 leading-relaxed mt-0.5">
                  Hospital quarantine protocol mandates that a daily nurse temperature check precede the doctor's routine visit. Normal visit submission is locked. You may proceed ONLY if an emergency or justified clinical exception exists.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200 flex items-center gap-2">
              <input
                type="checkbox"
                id="exceptionToggle"
                checked={isExceptionMode}
                onChange={(e) => setIsExceptionMode(e.target.checked)}
                className="rounded border-amber-400 text-teal focus:ring-teal h-4 w-4"
              />
              <label htmlFor="exceptionToggle" className="font-semibold cursor-pointer">
                Authorize Clinical Exception with Audit Log
              </label>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs">
              {error}
            </div>
          )}

          {/* Exception reason input if reading is missing */}
          {!hasNurseReading && isExceptionMode && (
            <div className="space-y-1 p-3 rounded-lg border border-amber-200 bg-amber-50/50">
              <Label htmlFor="exceptionReason" className="text-amber-900 font-bold">
                Mandatory Exception Justification
              </Label>
              <textarea
                id="exceptionReason"
                rows={2}
                placeholder="Document why visit is performed before nursing temperature check (e.g., Acute distress evaluation requested by charge nurse)..."
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="w-full rounded-md border border-amber-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                required
              />
              <span className="text-[10px] text-amber-700">
                Minimum 10 characters required. Logged to permanent facility audit history.
              </span>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="clinicalNotes">Clinical Examination & Treatment Notes</Label>
            <textarea
              id="clinicalNotes"
              rows={4}
              placeholder="Record physical exam findings, respiratory assessment, auscultation, medications prescribed, hydration plan..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs shadow-sm focus:border-teal focus:outline-none"
              required
            />
            <span className="text-[10px] text-slate-500">
              Min 10 characters. Stored securely with your physician signature.
            </span>
          </div>

          {/* Clinical Outcome Option: Deceased */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Skull className="h-4 w-4 text-slate-400" />
              <span>Record Deceased Clinical Outcome</span>
            </div>
            <input
              type="checkbox"
              checked={isDeceasedMode}
              onChange={(e) => setIsDeceasedMode(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!hasNurseReading && !isExceptionMode)}
              className={`text-white shadow-sm ${
                isDeceasedMode
                  ? "bg-rose-700 hover:bg-rose-800"
                  : !hasNurseReading
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-teal hover:bg-teal-700"
              }`}
            >
              {isSubmitting
                ? "Recording..."
                : isDeceasedMode
                ? "Confirm Deceased Outcome"
                : !hasNurseReading
                ? "Submit Visit (with Exception)"
                : "Complete Doctor Visit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
