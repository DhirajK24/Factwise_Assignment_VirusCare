"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { correctTemperatureAction } from "@/app/actions/temperature";
import { TemperatureReading } from "@/types";
import { Edit3, AlertTriangle, ShieldCheck } from "lucide-react";

interface CorrectionModalProps {
  reading: TemperatureReading | null;
  patientName: string;
  patientCode: string;
  bedNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CorrectionModal({
  reading,
  patientName,
  patientCode,
  bedNumber,
  isOpen,
  onClose,
  onSuccess,
}: CorrectionModalProps) {
  const [newTemp, setNewTemp] = useState<string>(
    reading ? String(reading.temperature_celsius) : "37.0"
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedTemp = parseFloat(newTemp);
    if (isNaN(parsedTemp) || parsedTemp < 30.0 || parsedTemp > 45.0) {
      setError("Please enter a valid clinical temperature (30.0 - 45.0°C).");
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      setError("Correction reason must be detailed and documented (minimum 10 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await correctTemperatureAction({
        reading_id: reading.id,
        temperature_celsius: parsedTemp,
        correction_reason: reason.trim(),
      });

      if (!res.success) {
        setError(res.error || "Failed to submit correction.");
      } else {
        onSuccess();
        onClose();
        setReason("");
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected error during correction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-amber-600" />
            <span>Authorized Clinical Temperature Correction</span>
          </DialogTitle>
          <DialogDescription>
            Audit-logged correction of an existing temperature entry for Bed #{bedNumber} ({patientCode})
          </DialogDescription>
        </DialogHeader>

        {/* Audit banner */}
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-amber-700" />
            <span>Operational Integrity Protocol</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Temperature values cannot be silently overwritten. The original entry ({reading.temperature_celsius}°C on {reading.reading_date}) and your reason will be indelibly recorded in the facility audit logs. Discharge eligibility will be automatically recalculated.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Original Reading</Label>
              <div className="h-9 px-3 py-2 rounded-md bg-slate-100 border border-slate-200 text-sm font-bold font-mono text-slate-500">
                {reading.temperature_celsius}°C
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="newTemp">Corrected Reading (°C)</Label>
              <Input
                id="newTemp"
                type="number"
                step="0.1"
                min="30.0"
                max="45.0"
                value={newTemp}
                onChange={(e) => setNewTemp(e.target.value)}
                className="font-bold font-mono text-navy"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reason">Clinical Justification / Reason for Correction</Label>
            <textarea
              id="reason"
              rows={3}
              placeholder="e.g. Typographical error during shift transcription; tympanic thermometer re-verified."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs shadow-sm focus:border-teal focus:outline-none"
              required
            />
            <span className="text-[10px] text-slate-500">
              Minimum 10 characters required for clinical audit compliance.
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? "Committing Correction..." : "Save Authorized Correction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
