"use client";

import React, { useState } from "react";
import { BedStatus } from "@/types";
import { formatCelsius, isFever } from "@/lib/utils";
import { Bed, User, Flame, CheckCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BedMapProps {
  beds: BedStatus[];
  onSelectBed?: (bedNumber: number) => void;
}

export function BedMap({ beds, onSelectBed }: BedMapProps) {
  const [filter, setFilter] = useState<"all" | "occupied" | "available" | "fever">("all");

  const filteredBeds = beds.filter((b) => {
    if (filter === "occupied") return b.isOccupied;
    if (filter === "available") return !b.isOccupied;
    if (filter === "fever") return b.isFever;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters and legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
              filter === "all"
                ? "bg-navy text-white border-navy"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Beds (74)
          </button>
          <button
            onClick={() => setFilter("occupied")}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
              filter === "occupied"
                ? "bg-navy text-white border-navy"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Occupied ({beds.filter((b) => b.isOccupied).length})
          </button>
          <button
            onClick={() => setFilter("available")}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
              filter === "available"
                ? "bg-navy text-white border-navy"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Available ({beds.filter((b) => !b.isOccupied).length})
          </button>
          <button
            onClick={() => setFilter("fever")}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
              filter === "fever"
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
            }`}
          >
            Fever Active ({beds.filter((b) => b.isFever).length})
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-300" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-teal" />
            <span>Stable / Under Treatment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 animate-pulse" />
            <span>Fever (≥37.5°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Discharge Eligible</span>
          </div>
        </div>
      </div>

      {/* Grid of 74 Beds */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
        {filteredBeds.map((bed) => {
          const isEligible = bed.patient?.status === "discharge_eligible";

          return (
            <button
              key={bed.bedNumber}
              onClick={() => onSelectBed?.(bed.bedNumber)}
              title={
                bed.isOccupied
                  ? `Bed ${bed.bedNumber}: ${bed.patient?.full_name} (${bed.patient?.patient_code}) - ${
                      bed.currentTemp ? bed.currentTemp + "°C" : "No temp today"
                    }`
                  : `Bed ${bed.bedNumber}: Available for Admission`
              }
              className={`relative p-2 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between h-16 ${
                bed.isOccupied
                  ? bed.isFever
                    ? "bg-rose-50 border-rose-300 hover:border-rose-400 text-rose-900 shadow-xs"
                    : isEligible
                    ? "bg-emerald-50 border-emerald-300 hover:border-emerald-400 text-emerald-950 shadow-xs"
                    : "bg-white border-teal-200 hover:border-teal-400 text-navy shadow-xs"
                  : "bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs tabular-nums">#{bed.bedNumber}</span>
                {bed.isFever ? (
                  <Flame className="h-3 w-3 text-rose-500 animate-bounce" />
                ) : isEligible ? (
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                ) : bed.isOccupied ? (
                  <User className="h-3 w-3 text-teal" />
                ) : (
                  <Bed className="h-3 w-3 text-slate-300" />
                )}
              </div>

              {bed.isOccupied ? (
                <div>
                  <div className="text-[10px] font-semibold truncate leading-tight">
                    {bed.patient?.patient_code}
                  </div>
                  <div className="text-[9px] font-mono tabular-nums leading-none mt-0.5 text-slate-500">
                    {bed.currentTemp ? `${bed.currentTemp}°C` : "Pending"}
                  </div>
                </div>
              ) : (
                <div className="text-[9px] text-slate-400 leading-none">Free</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
