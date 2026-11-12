"use client";

import React, { useState } from "react";
import { Patient, PatientStatus } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusBadgeClass, getStatusLabel } from "@/lib/utils";
import { Search, Filter, ArrowUpDown, UserPlus, Eye, Bed } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PatientTableProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onOpenAdmission: () => void;
  occupiedBedsCount: number;
  maxCapacity: number;
  canAdmit: boolean;
}

export function PatientTable({
  patients,
  onSelectPatient,
  onOpenAdmission,
  occupiedBedsCount,
  maxCapacity,
  canAdmit,
}: PatientTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus | "all">("all");
  const [sortField, setSortField] = useState<"bed_number" | "admission_date" | "full_name">("bed_number");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = patients
    .filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return (
          p.full_name.toLowerCase().includes(s) ||
          p.patient_code.toLowerCase().includes(s) ||
          (p.contact_information && p.contact_information.toLowerCase().includes(s))
        );
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "bed_number") cmp = a.bed_number - b.bed_number;
      else if (sortField === "admission_date") cmp = a.admission_date.localeCompare(b.admission_date);
      else if (sortField === "full_name") cmp = a.full_name.localeCompare(b.full_name);
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (field: "bed_number" | "admission_date" | "full_name") => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const isAtCapacity = occupiedBedsCount >= maxCapacity;

  return (
    <div className="space-y-4">
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, code (VC-2026-XXXX)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === "all" ? "bg-white text-navy shadow-xs font-semibold" : "text-slate-600"
              }`}
            >
              All ({patients.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === "active" ? "bg-white text-amber-800 shadow-xs font-semibold" : "text-slate-600"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("discharge_eligible")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === "discharge_eligible" ? "bg-white text-emerald-800 shadow-xs font-semibold" : "text-slate-600"
              }`}
            >
              Eligible
            </button>
            <button
              onClick={() => setStatusFilter("discharged")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === "discharged" ? "bg-white text-blue-800 shadow-xs font-semibold" : "text-slate-600"
              }`}
            >
              Cured
            </button>
            <button
              onClick={() => setStatusFilter("deceased")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === "deceased" ? "bg-white text-rose-800 shadow-xs font-semibold" : "text-slate-600"
              }`}
            >
              Deceased
            </button>
          </div>

          {canAdmit && (
            <Button
              onClick={onOpenAdmission}
              disabled={isAtCapacity}
              className="gap-2 bg-teal hover:bg-teal-700 text-white shadow-sm"
              title={isAtCapacity ? `Facility is at maximum capacity (${maxCapacity} beds occupied)` : "Admit new inpatient"}
            >
              <UserPlus className="h-4 w-4" />
              <span>Admit Patient</span>
            </Button>
          )}
        </div>
      </div>

      {isAtCapacity && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center justify-between">
          <span>
            <strong>Facility at Maximum Capacity:</strong> All {maxCapacity} quarantine beds are currently occupied. New admissions are blocked by transactional constraint until an active patient is discharged.
          </span>
        </div>
      )}

      {/* Patient Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("bed_number")}>
                <div className="flex items-center gap-1">
                  <span>Bed #</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Patient Code</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("full_name")}>
                <div className="flex items-center gap-1">
                  <span>Patient Name</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Age / Gender</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("admission_date")}>
                <div className="flex items-center gap-1">
                  <span>Admission Date</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Clinical Status</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500 text-sm">
                  No matching patients found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((patient) => {
                const isActive = patient.status === "active" || patient.status === "discharge_eligible";

                return (
                  <TableRow
                    key={patient.id}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                    onClick={() => onSelectPatient(patient)}
                  >
                    <TableCell className="font-bold text-navy">
                      {isActive ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-teal/10 text-teal font-bold text-xs">
                            {patient.bed_number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Freed (#{patient.bed_number})</span>
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      {patient.patient_code}
                    </TableCell>

                    <TableCell className="font-semibold text-navy">
                      {patient.full_name}
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 capitalize">
                      {patient.age} yrs • {patient.gender || "unspecified"}
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 tabular-nums">
                      {formatDate(patient.admission_date)}
                    </TableCell>

                    <TableCell>
                      <Badge className={getStatusBadgeClass(patient.status)}>
                        {getStatusLabel(patient.status)}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      {patient.contact_information || "None listed"}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(patient);
                        }}
                        className="h-8 gap-1 text-teal hover:text-teal-800 hover:bg-teal-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Chart</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

