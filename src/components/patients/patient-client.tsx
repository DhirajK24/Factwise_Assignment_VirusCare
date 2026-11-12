"use client";

import React, { useState } from "react";
import { Patient, BedStatus } from "@/types";
import { PatientTable } from "./patient-table";
import { PatientDetailModal } from "./patient-detail-modal";
import { AdmissionModal } from "./admission-modal";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";

interface PatientClientProps {
  initialPatients: Patient[];
  beds: BedStatus[];
  maxCapacity: number;
}

export function PatientClient({
  initialPatients,
  beds,
  maxCapacity,
}: PatientClientProps) {
  const { isAdmin, isDoctor } = useAuth();
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);

  const availableBeds = beds.filter((b) => !b.isOccupied);
  const occupiedBedsCount = beds.filter((b) => b.isOccupied).length;
  const canAdmit = isAdmin || isDoctor;

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Patient Registry & Bed Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive inpatient census, bed allocation, and quarantine disposition tracking.
          </p>
        </div>
      </div>

      <PatientTable
        patients={patients}
        onSelectPatient={handleSelectPatient}
        onOpenAdmission={() => setIsAdmissionOpen(true)}
        occupiedBedsCount={occupiedBedsCount}
        maxCapacity={maxCapacity}
        canAdmit={canAdmit}
      />

      {/* Patient Detail Modal */}
      <PatientDetailModal
        patient={selectedPatient}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRefresh={handleRefresh}
      />

      {/* Admission Modal */}
      <AdmissionModal
        isOpen={isAdmissionOpen}
        onClose={() => setIsAdmissionOpen(false)}
        availableBeds={availableBeds}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

