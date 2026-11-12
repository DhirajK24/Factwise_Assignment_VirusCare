"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordTemperatureAction } from "@/app/actions/temperature";
import { Patient } from "@/types";
import { Thermometer, Flame, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface RecordTemperatureModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  readingDate?: string;
  feverThreshold?: number;
}

export function RecordTemperatureModal({
  patient,
  isOpen,
  onClose,
  onSuccess,
  readingDate,
  feverThreshold = 37.5,
}: RecordTemperatureModalProps) {
  const [temperature, setTemperature] = useState<string>("37.0");
  const [targetDate, setTargetDate] = useState<string>(
    readingDate || format(new Date(), "yyyy-MM-dd")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!patient) return null;

  const tempNum = parseFloat(temperature);
  const isFever = !isNaN(tempNum) && tempNum >= feverThreshold;

  const quickTemps = [36.5, 36.8, 37.2, 37.5, 38.2, 38.8];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(tempNum) || tempNum < 30.0 || tempNum > 45.0) {
      setError("Please enter a realistic clinical temperature between 30.0°C and 45.0°C.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordTemperatureAction({
        patient_id: patient.id,
        temperature_celsius: tempNum,
        reading_date: targetDate,
      });

      if (!res.success) {
        setError(res.error || "Failed to record reading.");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected error recording temperature.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-teal" />
            <span>Record Daily Temperature</span>
          </DialogTitle>
          <DialogDescription>
            Shift routine thermal reading for isolation bed #{patient.bed_number}
          </DialogDescription>
        </DialogHeader>

        {/* Patient header card */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-navy text-sm">{patient.full_name}</div>
            <div className="text-slate-500 font-mono">{patient.patient_code}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-teal text-sm">Bed #{patient.bed_number}</div>
            <div className="text-slate-500">Age: {patient.age} yrs</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="readingDate">Reading Calendar Date</Label>
            <Input
              id="readingDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Body Temperature (°C)</Label>
              {isFever && (
                <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-rose-500" /> Fever Warning (≥{feverThreshold}°C)
                </span>
              )}
            </div>

            <div className="relative">
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="30.0"
                max="45.0"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className={`text-xl font-bold font-mono h-12 pr-10 ${
                  isFever
                    ? "border-rose-400 bg-rose-50 text-rose-950 focus-visible:ring-rose-500"
                    : "border-slate-300 text-navy"
                }`}
                required
              />
              <span className="absolute right-3 top-3.5 font-bold text-slate-400 text-sm">°C</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-500">Quick Clinical Presets:</span>
            <div className="grid grid-cols-6 gap-1.5">
              {quickTemps.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTemperature(val.toFixed(1))}
                  className={`py-1 rounded text-xs font-mono font-medium border transition-colors ${
                    parseFloat(temperature) === val
                      ? "bg-navy text-white border-navy"
                      : val >= feverThreshold
                      ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {val.toFixed(1)}°
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`text-white ${
                isFever ? "bg-rose-600 hover:bg-rose-700" : "bg-teal hover:bg-teal-700"
              }`}
            >
              {isSubmitting ? "Logging Reading..." : isFever ? "Confirm Fever Reading" : "Submit Reading"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
