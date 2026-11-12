import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const patientAdmissionSchema = z.object({
  patient_code: z
    .string()
    .min(3, "Patient code must be at least 3 characters")
    .max(20, "Patient code must not exceed 20 characters")
    .regex(/^[A-Za-z0-9-_]+$/, "Patient code must be alphanumeric with optional dashes"),
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  age: z.coerce.number().int().min(0, "Age must be 0 or older").max(130, "Age must be valid"),
  gender: z.enum(["male", "female", "other", "undisclosed"]).optional(),
  contact_information: z.string().max(255).optional().or(z.literal("")),
  admission_date: z.string().min(10, "Please select an admission date"),
  bed_number: z.coerce.number().int().min(1, "Bed number must be between 1 and 74").max(74, "Bed number must not exceed maximum capacity (74)"),
});

export type PatientAdmissionInput = z.infer<typeof patientAdmissionSchema>;

export const patientUpdateSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  age: z.coerce.number().int().min(0).max(130),
  gender: z.enum(["male", "female", "other", "undisclosed"]).optional(),
  contact_information: z.string().max(255).optional().or(z.literal("")),
  bed_number: z.coerce.number().int().min(1).max(74),
});

export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

export const temperatureReadingSchema = z.object({
  patient_id: z.string().uuid("Invalid patient ID"),
  temperature_celsius: z.coerce
    .number()
    .min(30.0, "Temperature cannot be below 30.0°C")
    .max(45.0, "Temperature cannot exceed 45.0°C"),
  reading_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
});

export type TemperatureReadingInput = z.infer<typeof temperatureReadingSchema>;

export const temperatureCorrectionSchema = z.object({
  reading_id: z.string().uuid("Invalid reading ID"),
  temperature_celsius: z.coerce
    .number()
    .min(30.0, "Temperature cannot be below 30.0°C")
    .max(45.0, "Temperature cannot exceed 45.0°C"),
  correction_reason: z
    .string()
    .min(10, "Correction reason must be detailed (at least 10 characters)")
    .max(500),
});

export type TemperatureCorrectionInput = z.infer<typeof temperatureCorrectionSchema>;

export const doctorVisitSchema = z.object({
  patient_id: z.string().uuid("Invalid patient ID"),
  visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  clinical_notes: z.string().min(10, "Clinical notes must be at least 10 characters"),
  exception_reason: z.string().max(500).optional(),
});

export type DoctorVisitInput = z.infer<typeof doctorVisitSchema>;

export const facilitySettingsSchema = z.object({
  facility_name: z.string().min(3).max(100),
  facility_timezone: z.string().min(1).max(50),
  maximum_capacity: z.coerce.number().int().min(1).max(200),
  fever_threshold_celsius: z.coerce.number().min(35.0).max(42.0),
});

export type FacilitySettingsInput = z.infer<typeof facilitySettingsSchema>;

export const userManagementSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "nurse", "doctor"]),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export type UserManagementInput = z.infer<typeof userManagementSchema>;

