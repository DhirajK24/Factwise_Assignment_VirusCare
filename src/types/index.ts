export type UserRole = "admin" | "nurse" | "doctor";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PatientStatus = "active" | "discharge_eligible" | "discharged" | "deceased";
export type PatientOutcome = "recovered" | "deceased" | null;
export type Gender = "male" | "female" | "other" | "undisclosed";

export interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  age: number;
  gender?: Gender | null;
  contact_information?: string | null;
  admission_date: string;
  bed_number: number;
  status: PatientStatus;
  outcome?: PatientOutcome;
  outcome_date?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemperatureReading {
  id: string;
  patient_id: string;
  temperature_celsius: number;
  reading_date: string;
  recorded_at: string;
  recorded_by: string;
  corrected_at?: string | null;
  correction_reason?: string | null;
  created_at: string;
  // Joined fields
  recorder_name?: string;
  patient_code?: string;
  patient_name?: string;
  bed_number?: number;
}

export interface DoctorVisit {
  id: string;
  patient_id: string;
  visit_date: string;
  visited_at: string;
  doctor_id: string;
  clinical_notes: string;
  exception_reason?: string | null;
  created_at: string;
  // Joined fields
  doctor_name?: string;
  patient_code?: string;
  patient_name?: string;
  bed_number?: number;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  created_at: string;
  // Joined field
  actor_name?: string;
  actor_role?: UserRole | null;
}

export interface FacilitySettings {
  id: string;
  facility_name: string;
  facility_timezone: string;
  maximum_capacity: number;
  fever_threshold_celsius: number;
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
}

export interface DischargeEligibilityResult {
  patientId: string;
  isEligible: boolean;
  consecutiveFeverFreeDays: number;
  feverThreshold: number;
  missingToday: boolean;
  hasFeverToday: boolean;
  lastReading?: TemperatureReading | null;
  consecutiveDates: {
    date: string;
    temperature: number | null;
    isFeverFree: boolean;
    isMissing: boolean;
  }[];
  reason?: string;
}

export interface AnalyticsMetrics {
  totalAdmitted: number;
  activePatients: number;
  totalDischarged: number;
  totalDeaths: number;
  completedOutcomes: number;
  mortalityRate: number | null; // null if completedOutcomes === 0
  treatmentSuccessRate: number | null; // null if completedOutcomes === 0
  isMortalityAlert: boolean; // true if mortalityRate > 15
  isSuccessWarning: boolean; // true if treatmentSuccessRate < 85
  mortalityDiff: number; // actual - benchmark (15)
  successDiff: number; // actual - benchmark (85)
  occupiedBeds: number;
  availableBeds: number;
  bedOccupancyRate: number;
  maximumCapacity: number;
  pendingNurseChecksToday: number;
  pendingDoctorVisitsToday: number;
  dischargeEligibleCount: number;
}

export interface BedStatus {
  bedNumber: number;
  isOccupied: boolean;
  patient?: Patient | null;
  currentTemp?: number | null;
  isFever?: boolean;
}
