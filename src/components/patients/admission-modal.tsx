"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BedStatus } from "@/types";
import { admitPatientAction } from "@/app/actions/patients";
import { format } from "date-fns";
import { AlertTriangle, UserPlus, CheckCircle2 } from "lucide-react";

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBeds: BedStatus[];
  onSuccess: () => void;
}

export function AdmissionModal({
  isOpen,
  onClose,
  availableBeds,
  onSuccess,
}: AdmissionModalProps) {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<"male" | "female" | "other" | "undisclosed">("male");
  const [contactInfo, setContactInfo] = useState("");
  const [admissionDate, setAdmissionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [patientCode, setPatientCode] = useState("");
  const [selectedBed, setSelectedBed] = useState<number>(
    availableBeds[0]?.bedNumber || 1
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAtCapacity = availableBeds.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isAtCapacity) {
      setError("Admission blocked: Facility is at maximum capacity (74 beds occupied).");
      return;
    }

    if (!fullName.trim()) {
      setError("Patient full name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await admitPatientAction({
        patient_code: patientCode || undefined,
        full_name: fullName,
        age: Number(age),
        gender,
        contact_information: contactInfo,
        admission_date: admissionDate,
        bed_number: Number(selectedBed),
      });

      if (!result.success) {
        setError(result.error || "Admission failed.");
      } else {
        onSuccess();
        onClose();
        // Reset form
        setFullName("");
        setContactInfo("");
        setPatientCode("");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during admission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal" />
            <span>Admit Patient to Quarantine</span>
          </DialogTitle>
          <DialogDescription>
            Register a confirmed or suspected patient into the VirusCare facility with assigned isolation bed.
          </DialogDescription>
        </DialogHeader>

        {isAtCapacity ? (
          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Maximum Capacity Reached (74/74)</span>
              <p className="text-xs text-rose-700 mt-1">
                All 74 isolation beds are currently assigned to active patients. The transactional lock prevents over-admission. An existing patient must be discharged (after meeting the 3-day fever-free requirement) before admitting another patient.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="fullName">Patient Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Eleanor Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={130}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-teal focus:outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="undisclosed">Undisclosed</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="admissionDate">Admission Date</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bedNumber">Assign Bed (Available)</Label>
                <select
                  id="bedNumber"
                  value={selectedBed}
                  onChange={(e) => setSelectedBed(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-teal focus:outline-none font-semibold text-navy"
                  required
                >
                  {availableBeds.map((bed) => (
                    <option key={bed.bedNumber} value={bed.bedNumber}>
                      Bed #{bed.bedNumber} (Available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="patientCode">Custom Patient Code (Optional)</Label>
                <Input
                  id="patientCode"
                  placeholder="Leave empty for auto-generated VC-2026-XXXX"
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value)}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="contactInfo">Contact / Emergency Contact (Optional)</Label>
                <Input
                  id="contactInfo"
                  placeholder="+1 (555) 000-0000 or Next of Kin"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isAtCapacity}
                className="bg-teal hover:bg-teal-700 text-white"
              >
                {isSubmitting ? "Assigning & Admitting..." : "Confirm Admission"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
