import {
  initialFacilitySettings,
  initialProfiles,
  initialPatients,
  initialTemperatureReadings,
  initialDoctorVisits,
  initialAuditLogs,
} from "./seed-data";
import {
  FacilitySettings,
  UserProfile,
  Patient,
  TemperatureReading,
  DoctorVisit,
  AuditLog,
} from "@/types";

class VirusCareDataStore {
  private facilitySettings: FacilitySettings;
  private profiles: UserProfile[];
  private patients: Patient[];
  private temperatureReadings: TemperatureReading[];
  private doctorVisits: DoctorVisit[];
  private auditLogs: AuditLog[];

  constructor() {
    this.facilitySettings = { ...initialFacilitySettings };
    this.profiles = [...initialProfiles];
    this.patients = [...initialPatients];
    this.temperatureReadings = [...initialTemperatureReadings];
    this.doctorVisits = [...initialDoctorVisits];
    this.auditLogs = [...initialAuditLogs];
  }

  // Settings
  getSettings(): FacilitySettings {
    return { ...this.facilitySettings };
  }

  updateSettings(data: Partial<FacilitySettings>): FacilitySettings {
    this.facilitySettings = {
      ...this.facilitySettings,
      ...data,
      updated_at: new Date().toISOString(),
    };
    return { ...this.facilitySettings };
  }

  // Profiles
  getProfiles(): UserProfile[] {
    return [...this.profiles];
  }

  getProfileById(id: string): UserProfile | undefined {
    return this.profiles.find((p) => p.id === id);
  }

  getProfileByEmail(email: string): UserProfile | undefined {
    return this.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }

  addProfile(profile: UserProfile): UserProfile {
    this.profiles.push(profile);
    return profile;
  }

  updateProfile(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const idx = this.profiles.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.profiles[idx] = {
      ...this.profiles[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { ...this.profiles[idx] };
  }

  // Patients
  getPatients(): Patient[] {
    return [...this.patients];
  }

  getPatientById(id: string): Patient | undefined {
    return this.patients.find((p) => p.id === id);
  }

  getPatientByCode(code: string): Patient | undefined {
    return this.patients.find((p) => p.patient_code === code);
  }

  addPatient(patient: Patient): Patient {
    this.patients.push(patient);
    return patient;
  }

  updatePatient(id: string, updates: Partial<Patient>): Patient | undefined {
    const idx = this.patients.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.patients[idx] = {
      ...this.patients[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { ...this.patients[idx] };
  }

  // Temperature Readings
  getTemperatureReadings(): TemperatureReading[] {
    return [...this.temperatureReadings];
  }

  getReadingsByPatientId(patientId: string): TemperatureReading[] {
    return this.temperatureReadings.filter((r) => r.patient_id === patientId);
  }

  addTemperatureReading(reading: TemperatureReading): TemperatureReading {
    this.temperatureReadings.push(reading);
    return reading;
  }

  updateTemperatureReading(
    id: string,
    updates: Partial<TemperatureReading>
  ): TemperatureReading | undefined {
    const idx = this.temperatureReadings.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.temperatureReadings[idx] = {
      ...this.temperatureReadings[idx],
      ...updates,
    };
    return { ...this.temperatureReadings[idx] };
  }

  // Doctor Visits
  getDoctorVisits(): DoctorVisit[] {
    return [...this.doctorVisits];
  }

  getVisitsByPatientId(patientId: string): DoctorVisit[] {
    return this.doctorVisits.filter((v) => v.patient_id === patientId);
  }

  addDoctorVisit(visit: DoctorVisit): DoctorVisit {
    this.doctorVisits.push(visit);
    return visit;
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  addAuditLog(log: AuditLog): AuditLog {
    this.auditLogs.unshift(log);
    return log;
  }

  // Reset to initial demo state
  reset(): void {
    this.facilitySettings = { ...initialFacilitySettings };
    this.profiles = [...initialProfiles];
    this.patients = [...initialPatients];
    this.temperatureReadings = [...initialTemperatureReadings];
    this.doctorVisits = [...initialDoctorVisits];
    this.auditLogs = [...initialAuditLogs];
  }
}

// Global singleton across hot reloads in dev
const globalForStore = globalThis as unknown as {
  virusCareStore?: VirusCareDataStore;
};

export const memoryStore = globalForStore.virusCareStore ?? new VirusCareDataStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.virusCareStore = memoryStore;
}

