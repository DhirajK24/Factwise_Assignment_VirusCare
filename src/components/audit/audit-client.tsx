"use client";

import React, { useState } from "react";
import { AuditLog } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDateTime, getRoleBadgeClass } from "@/lib/utils";
import { History, ShieldCheck, Search, Filter, Code } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface AuditClientProps {
  logs: AuditLog[];
  totalCount: number;
}

export function AuditClient({ logs, totalCount }: AuditClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && !log.action.includes(actionFilter)) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(s) ||
        (log.actor_name && log.actor_name.toLowerCase().includes(s)) ||
        log.entity_type.toLowerCase().includes(s) ||
        log.entity_id.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const getActionColor = (action: string) => {
    if (action.includes("ADMITTED")) return "bg-teal-50 text-teal-800 border-teal-200";
    if (action.includes("DISCHARGED")) return "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
    if (action.includes("DECEASED")) return "bg-rose-50 text-rose-800 border-rose-300 font-bold";
    if (action.includes("CORRECTED")) return "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
    if (action.includes("EXCEPTION")) return "bg-amber-100 text-amber-900 border-amber-300 font-bold";
    if (action.includes("SETTINGS")) return "bg-purple-50 text-purple-800 border-purple-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy flex items-center gap-2">
            <History className="h-6 w-6 text-teal" />
            <span>Facility Operational Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, append-only log verifying admissions, temperature records, clinical exceptions, and discharges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
            <ShieldCheck className="h-3 w-3 mr-1" /> Append-Only Log Guaranteed
          </Badge>
          <span className="text-xs text-slate-500 font-semibold tabular-nums">
            {totalCount} Total Events
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search action, actor, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Filter by category:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm focus:border-teal focus:outline-none"
          >
            <option value="all">All Audit Actions</option>
            <option value="ADMITTED">Admissions</option>
            <option value="TEMPERATURE">Temperature Readings</option>
            <option value="CORRECTED">Corrections</option>
            <option value="DOCTOR_VISIT">Doctor Visits</option>
            <option value="EXCEPTION">Clinical Exceptions</option>
            <option value="DISCHARGED">Discharges</option>
            <option value="DECEASED">Deceased Records</option>
            <option value="SETTINGS">Settings Changes</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp (UTC)</TableHead>
              <TableHead>Actor / Role</TableHead>
              <TableHead>Operational Action</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>Event Details</TableHead>
              <TableHead className="text-right">Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500 text-sm">
                  No matching audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-slate-50/70 transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="text-xs font-mono text-slate-600 whitespace-nowrap tabular-nums">
                    {formatDateTime(log.created_at)}
                  </TableCell>

                  <TableCell className="text-xs">
                    <div className="font-semibold text-navy">{log.actor_name || "System"}</div>
                    {log.actor_role && (
                      <Badge className={`text-[10px] px-1.5 py-0 mt-0.5 ${getRoleBadgeClass(log.actor_role)}`}>
                        {log.actor_role}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-slate-600 font-mono">
                    <span className="font-semibold">{log.entity_type}</span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                      {log.entity_id}
                    </span>
                  </TableCell>

                  <TableCell className="max-w-xs text-xs text-slate-600 truncate">
                    {log.new_data ? JSON.stringify(log.new_data) : "--"}
                  </TableCell>

                  <TableCell className="text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-teal hover:bg-slate-100"
                    >
                      <Code className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-navy text-lg">
                <History className="h-5 w-5 text-teal" />
                <span>Audit Event Record: {selectedLog.action}</span>
              </DialogTitle>
              <DialogDescription>
                Event ID: {selectedLog.id} • Recorded at {formatDateTime(selectedLog.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="font-bold text-slate-500">Actor:</span>{" "}
                  <span className="text-navy font-semibold">{selectedLog.actor_name || "System"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Entity:</span>{" "}
                  <span className="text-navy font-semibold">{selectedLog.entity_type}</span>
                </div>
              </div>

              {selectedLog.previous_data && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Previous State:</span>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto text-[11px] font-mono">
                    {JSON.stringify(selectedLog.previous_data, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-700 block mb-1">Committed Payload State:</span>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg overflow-x-auto text-[11px] font-mono">
                  {JSON.stringify(selectedLog.new_data, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

