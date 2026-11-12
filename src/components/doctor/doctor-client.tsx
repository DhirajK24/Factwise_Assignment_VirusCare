"use client";

import React, { useState } from "react";
import { Patient, DoctorVisit, DoctorRosterData } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCelsius, formatDate } from "@/lib/utils";
import { RecordVisitModal } from "./record-visit-modal";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Search,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface DoctorClientProps {
  initialData: DoctorRosterData;
}

export function DoctorClient({ initialData }: DoctorClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "missing_temp">("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedPatientItem, setSelectedPatientItem] = useState<{
    patient: Patient;
    todayTemp: number | null;
    hasNurseReading: boolean;
    isFever: boolean;
  } | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const { targetDate, threshold, totalActive, completedVisits, pendingVisits, patients } =
    initialData;

  const missingTempCount = patients.filter((p) => !p.hasNurseReading).length;

  const filteredPatients = patients.filter((item) => {
    if (filter === "pending" && item.isVisitCompleted) return false;
    if (filter === "completed" && !item.isVisitCompleted) return false;
    if (filter === "missing_temp" && item.hasNurseReading) return false;

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

  const handleOpenVisit = (item: {
    patient: Patient;
    todayTemp: number | null;
    hasNurseReading: boolean;
    isFever: boolean;
  }) => {
    setSelectedPatientItem(item);
    setIsRecordModalOpen(true);
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
            <Stethoscope className="h-6 w-6 text-teal" />
            <span>Doctor Clinical Rounds & Inpatient Evaluations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical inpatient rounds ({targetDate}). A normal visit requires a prior daily nurse temperature check.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            Rounds Progress: {completedVisits} / {totalActive} ({totalActive > 0 ? Math.round((completedVisits / totalActive) * 100) : 0}%)
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilter("all")}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filter === "all" ? "bg-navy text-white border-navy" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">
            Total Inpatient Census
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1">{totalActive}</div>
        </div>

        <div
          onClick={() => setFilter("pending")}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filter === "pending"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-blue-700 border-blue-200 hover:border-blue-300"
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider opacity-80 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Awaiting Doctor Visit
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1">{pendingVisits}</div>
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
            <CheckCircle2 className="h-3.5 w-3.5" /> Rounds Completed
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1">{completedVisits}</div>
        </div>

        <div
          onClick={() => setFilter("missing_temp")}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filter === "missing_temp"
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-white text-amber-700 border-amber-200 hover:border-amber-300"
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider opacity-80 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" /> Missing Nurse Reading
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1">{missingTempCount}</div>
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
            Pending ({pendingVisits})
          </Button>
          <Button
            size="sm"
            variant={filter === "missing_temp" ? "default" : "outline"}
            onClick={() => setFilter("missing_temp")}
            className="h-8 text-xs text-amber-800 bg-amber-50/50 border-amber-300"
          >
            Missing Temp ({missingTempCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
            className="h-8 text-xs"
          >
            Completed ({completedVisits})
          </Button>
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="h-8 text-xs"
          >
            All Beds ({patients.length})
          </Button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Bed</TableHead>
              <TableHead>Patient Code</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Nurse Temp Check</TableHead>
              <TableHead>Visit Status</TableHead>
              <TableHead>Clinical Progress / Notes</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500 text-sm">
                  No inpatients match the selected clinical filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((item) => {
                const { patient, todayTemp, hasNurseReading, isFever, visit, isVisitCompleted } =
                  item;

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
                      <span className="text-[11px] text-slate-400 block">
                        Age {patient.age} • Admitted {formatDate(patient.admission_date)}
                      </span>
                    </TableCell>

                    <TableCell>
                      {hasNurseReading ? (
                        <div className="flex items-center gap-1.5 font-bold font-mono text-sm tabular-nums">
                          <span className={isFever ? "text-rose-600" : "text-emerald-700"}>
                            {formatCelsius(todayTemp)}
                          </span>
                          {isFever && (
                            <Badge variant="destructive" className="h-4 text-[10px] px-1">
                              Fever
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> Missing Nurse Check
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isVisitCompleted ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Round Recorded
                        </Badge>
                      ) : hasNurseReading ? (
                        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50/50">
                          Ready for Doctor
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-amber-100 text-amber-900 border-amber-300">
                          Blocked (Needs Exception)
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="max-w-xs text-xs text-slate-600 truncate">
                      {visit ? (
                        <div>
                          <span className="font-semibold text-navy">{visit.doctor_name}: </span>
                          <span className="italic">{visit.clinical_notes}</span>
                          {visit.exception_reason && (
                            <span className="text-amber-700 font-bold block text-[10px]">
                              [Exception: {visit.exception_reason}]
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">No round notes recorded today.</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {isVisitCompleted ? (
                        <span className="text-xs text-slate-400 font-medium">Completed</span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenVisit(item)}
                          className={`h-8 gap-1.5 text-xs text-white shadow-xs ${
                            hasNurseReading
                              ? "bg-teal hover:bg-teal-700"
                              : "bg-amber-600 hover:bg-amber-700"
                          }`}
                        >
                          <Stethoscope className="h-3.5 w-3.5" />
                          <span>{hasNurseReading ? "Record Visit" : "Record (Exception)"}</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Record Visit Modal */}
      {selectedPatientItem && (
        <RecordVisitModal
          patient={selectedPatientItem.patient}
          todayTemp={selectedPatientItem.todayTemp}
          hasNurseReading={selectedPatientItem.hasNurseReading}
          isFever={selectedPatientItem.isFever}
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSuccess={handleSuccess}
          visitDate={targetDate}
        />
      )}
    </div>
  );
}

