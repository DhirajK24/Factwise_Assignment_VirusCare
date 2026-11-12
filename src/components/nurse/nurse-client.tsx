"use client";

import React, { useState } from "react";
import { Patient, TemperatureReading } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCelsius, isFever, formatDate } from "@/lib/utils";
import { RecordTemperatureModal } from "./record-temperature-modal";
import { CorrectionModal } from "./correction-modal";
import { useRouter } from "next/navigation";
import {
  Thermometer,
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit3,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface NurseClientProps {
  initialData: {
    targetDate: string;
    threshold: number;
    totalActive: number;
    completedCount: number;
    pendingCount: number;
    feverCount: number;
    items: Array<{
      patient: Patient;
      todayReading: TemperatureReading | null;
      isCompleted: boolean;
      temperatureCelsius: number | null;
      isFever: boolean;
      feverThreshold: number;
    }>;
  };
}

export function NurseClient({ initialData }: NurseClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "fever">("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [selectedReading, setSelectedReading] = useState<{
    reading: TemperatureReading;
    patientName: string;
    patientCode: string;
    bedNumber: number;
  } | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  const { targetDate, threshold, totalActive, completedCount, pendingCount, feverCount, items } =
    initialData;

  const filteredItems = items.filter((item) => {
    if (filter === "pending" && item.isCompleted) return false;
    if (filter === "completed" && !item.isCompleted) return false;
    if (filter === "fever" && !item.isFever) return false;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        item.patient.full_name.toLowerCase().includes(s) ||
        item.patient.patient_code.toLowerCase().includes(s) ||
        String(item.patient.bed_number).includes(s)
      );
    }
    return true;
  });

  const handleOpenRecord = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsRecordModalOpen(true);
  };

  const handleOpenCorrection = (
    reading: TemperatureReading,
    patientName: string,
    patientCode: string,
    bedNumber: number
  ) => {
    setSelectedReading({ reading, patientName, patientCode, bedNumber });
    setIsCorrectionModalOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-teal" />
            <span>Nurse Station: Daily Temperature Monitoring</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical shift protocol: Record one validated thermal reading per calendar date ({targetDate}) for each isolation bed.
          </p>
        </div>

        {/* Progress stat pill */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            Shift Progress: {completedCount} / {totalActive} ({totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0}%)
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilter("all")}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filter === "all" ? "bg-navy text-white border-navy" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">
            Active Inpatients
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1">{totalActive}</div>
        </div>

        <div
          onClick={() => setFilter("pending")}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filter === "pending"
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-white text-amber-700 border-amber-200 hover:border-amber-300"
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider opacity-80 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Pending Checks Today
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1">{pendingCount}</div>
        </div>

        <div
          onClick={() => setFilter("completed")}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filter === "completed"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-300"
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider opacity-80 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed Today
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1">{completedCount}</div>
        </div>

        <div
          onClick={() => setFilter("fever")}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filter === "fever"
              ? "bg-rose-600 text-white border-rose-600"
              : "bg-white text-rose-700 border-rose-200 hover:border-rose-300"
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider opacity-80 flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" /> Active Fever Cases
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1">{feverCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search bed, patient code, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Filter view:</span>
          <Button
            size="sm"
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className="h-8 text-xs"
          >
            Pending ({pendingCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "fever" ? "destructive" : "outline"}
            onClick={() => setFilter("fever")}
            className="h-8 text-xs"
          >
            Fever ({feverCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
            className="h-8 text-xs"
          >
            Completed ({completedCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="h-8 text-xs"
          >
            All Beds ({items.length})
          </Button>
        </div>
      </div>

      {/* Table of Patients for Today's Monitoring */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Bed</TableHead>
              <TableHead>Patient Code</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Today's Reading</TableHead>
              <TableHead>Thermal Status</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500 text-sm">
                  No inpatients match the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map(({ patient, todayReading, isCompleted, temperatureCelsius, isFever }) => (
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
                    <span className="text-[11px] text-slate-400 block">
                      Age {patient.age} • Admitted {formatDate(patient.admission_date)}
                    </span>
                  </TableCell>

                  <TableCell>
                    {isCompleted ? (
                      <div className="flex items-center gap-1.5 font-bold font-mono text-base tabular-nums">
                        <span className={isFever ? "text-rose-600" : "text-emerald-700"}>
                          {formatCelsius(temperatureCelsius)}
                        </span>
                        {todayReading?.corrected_at && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal font-sans">
                            Corrected
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Check Pending
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {isCompleted ? (
                      isFever ? (
                        <Badge variant="destructive" className="gap-1 animate-pulse">
                          <Flame className="h-3 w-3" /> Febrile (≥{threshold}°C)
                        </Badge>
                      ) : (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Normothermic
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-slate-500">
                        Awaiting Reading
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-slate-500">
                    {todayReading ? todayReading.recorder_name || "Staff Nurse" : "--"}
                  </TableCell>

                  <TableCell className="text-right">
                    {isCompleted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleOpenCorrection(
                            todayReading!,
                            patient.full_name,
                            patient.patient_code,
                            patient.bed_number
                          )
                        }
                        className="h-8 gap-1.5 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Authorized Correction</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenRecord(patient)}
                        className="h-8 gap-1.5 text-xs bg-teal hover:bg-teal-700 text-white shadow-xs"
                      >
                        <Thermometer className="h-3.5 w-3.5" />
                        <span>Record Reading</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Record Modal */}
      <RecordTemperatureModal
        patient={selectedPatient}
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={handleSuccess}
        readingDate={targetDate}
        feverThreshold={threshold}
      />

      {/* Authorized Correction Modal */}
      {selectedReading && (
        <CorrectionModal
          reading={selectedReading.reading}
          patientName={selectedReading.patientName}
          patientCode={selectedReading.patientCode}
          bedNumber={selectedReading.bedNumber}
          isOpen={isCorrectionModalOpen}
          onClose={() => setIsCorrectionModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

