import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCelsius(temp: number | null | undefined): string {
  if (temp === null || temp === undefined || isNaN(temp)) return "--";
  return `${Number(temp).toFixed(1)}°C`;
}

export function isFever(temp: number | null | undefined, threshold: number = 37.5): boolean {
  if (temp === null || temp === undefined) return false;
  return Number(temp) >= threshold;
}

export function formatDate(dateInput: string | Date | null | undefined, formatStr = "dd MMM yyyy"): string {
  if (!dateInput) return "--";
  try {
    const d = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    return format(d, formatStr);
  } catch {
    return String(dateInput);
  }
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  return formatDate(dateInput, "dd MMM yyyy, HH:mm");
}

export function getInitials(name: string): string {
  if (!name) return "VC";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleBadgeClass(role: string): string {
  switch (role) {
    case "admin":
      return "bg-navy-100 text-navy-800 border-navy-300";
    case "doctor":
      return "bg-teal-50 text-teal-800 border-teal-200";
    case "nurse":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "discharge_eligible":
      return "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
    case "discharged":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "deceased":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Under Treatment";
    case "discharge_eligible":
      return "Discharge Eligible";
    case "discharged":
      return "Discharged (Cured)";
    case "deceased":
      return "Deceased";
    default:
      return status;
  }
}
