import { createAdminClient } from "@/lib/supabase/admin";
import { AnalyticsMetrics } from "@/types";
import { format, subDays } from "date-fns";

interface PatientRecord {
  id: string;
  status: string;
  outcome?: string | null;
  admission_date: string;
  outcome_date?: string | null;
  bed_number?: number;
}

interface ReadingRecord {
  patient_id: string;
  temperature_celsius: number;
}

interface VisitRecord {
  patient_id: string;
}

export async function getFacilityAnalytics(): Promise<AnalyticsMetrics> {
  const supabase = createAdminClient();

  // 1. Fetch facility settings for capacity and thresholds
  const { data: settings } = await supabase
    .from("facility_settings")
    .select("maximum_capacity, fever_threshold_celsius")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const maximumCapacity = settings?.maximum_capacity ?? 74;

  // 2. Query patients counts
  const { data: rawPatients, error: pError } = await supabase
    .from("patients")
    .select("id, status, outcome, admission_date, bed_number");

  if (pError || !rawPatients) {
    throw new Error(`Failed to query patient analytics: ${pError?.message}`);
  }

  const patients: PatientRecord[] = rawPatients as PatientRecord[];

  const totalAdmitted = patients.length;
  const activePatientsList: PatientRecord[] = patients.filter(
    (p: PatientRecord) => p.status === "active" || p.status === "discharge_eligible"
  );
  const activePatients = activePatientsList.length;
  const dischargeEligibleCount = patients.filter((p: PatientRecord) => p.status === "discharge_eligible").length;

  const totalDischarged = patients.filter(
    (p: PatientRecord) => p.status === "discharged" && p.outcome === "recovered"
  ).length;

  const totalDeaths = patients.filter(
    (p: PatientRecord) => p.status === "deceased" && p.outcome === "deceased"
  ).length;

  const completedOutcomes = totalDischarged + totalDeaths;

  let mortalityRate: number | null = null;
  let treatmentSuccessRate: number | null = null;
  let mortalityDiff = 0;
  let successDiff = 0;
  let isMortalityAlert = false;
  let isSuccessWarning = false;

  const BENCHMARK_MORTALITY = 15.0; // 15%
  const BENCHMARK_SUCCESS = 85.0; // 85%

  if (completedOutcomes > 0) {
    mortalityRate = Number(((totalDeaths / completedOutcomes) * 100).toFixed(1));
    treatmentSuccessRate = Number(((totalDischarged / completedOutcomes) * 100).toFixed(1));

    mortalityDiff = Number((mortalityRate - BENCHMARK_MORTALITY).toFixed(1));
    successDiff = Number((treatmentSuccessRate - BENCHMARK_SUCCESS).toFixed(1));

    isMortalityAlert = mortalityRate > BENCHMARK_MORTALITY;
    isSuccessWarning = treatmentSuccessRate < BENCHMARK_SUCCESS;
  }

  const occupiedBeds = activePatients;
  const availableBeds = Math.max(0, maximumCapacity - occupiedBeds);
  const bedOccupancyRate = maximumCapacity > 0 ? Number(((occupiedBeds / maximumCapacity) * 100).toFixed(1)) : 0;

  // 3. Today's Nurse checks pending
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const { data: todaysReadings } = await supabase
    .from("temperature_readings")
    .select("patient_id")
    .eq("reading_date", todayStr);

  const activeIds = new Set<string>(activePatientsList.map((p: PatientRecord) => p.id));
  const rawReadingsList: ReadingRecord[] = (todaysReadings || []) as ReadingRecord[];

  const checkedActiveIds = new Set<string>(
    rawReadingsList.map((r: ReadingRecord) => r.patient_id).filter((id: string) => activeIds.has(id))
  );

  const pendingNurseChecksToday = Math.max(0, activePatients - checkedActiveIds.size);

  // 4. Today's Doctor visits pending
  const { data: todaysVisits } = await supabase
    .from("doctor_visits")
    .select("patient_id")
    .eq("visit_date", todayStr);

  const rawVisitsList: VisitRecord[] = (todaysVisits || []) as VisitRecord[];

  const visitedActiveIds = new Set<string>(
    rawVisitsList.map((v: VisitRecord) => v.patient_id).filter((id: string) => activeIds.has(id))
  );

  const pendingDoctorVisitsToday = Math.max(0, activePatients - visitedActiveIds.size);

  return {
    totalAdmitted,
    activePatients,
    totalDischarged,
    totalDeaths,
    completedOutcomes,
    mortalityRate,
    treatmentSuccessRate,
    isMortalityAlert,
    isSuccessWarning,
    mortalityDiff,
    successDiff,
    occupiedBeds,
    availableBeds,
    bedOccupancyRate,
    maximumCapacity,
    pendingNurseChecksToday,
    pendingDoctorVisitsToday,
    dischargeEligibleCount,
  };
}

export async function getAnalyticsChartData() {
  const supabase = createAdminClient();

  // 1. Last 14 days admissions vs discharges
  const past14Days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    past14Days.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
  }

  const { data: rawPatients } = await supabase
    .from("patients")
    .select("admission_date, outcome_date, status, outcome");

  const patients: PatientRecord[] = (rawPatients || []) as PatientRecord[];

  const trendData = past14Days.map((dStr: string) => {
    const admissions = patients.filter((p: PatientRecord) => p.admission_date === dStr).length;
    const discharges = patients.filter(
      (p: PatientRecord) =>
        p.status === "discharged" &&
        p.outcome_date &&
        p.outcome_date.startsWith(dStr)
    ).length;
    const deaths = patients.filter(
      (p: PatientRecord) =>
        p.status === "deceased" &&
        p.outcome_date &&
        p.outcome_date.startsWith(dStr)
    ).length;

    return {
      date: format(new Date(dStr), "dd MMM"),
      admissions,
      discharges,
      deaths,
    };
  });

  // 2. Temperature distribution today
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const { data: readings } = await supabase
    .from("temperature_readings")
    .select("temperature_celsius")
    .eq("reading_date", todayStr);

  const rawReadings: ReadingRecord[] = (readings || []) as ReadingRecord[];

  const tempDistribution = [
    { range: "< 36.5°C (Hypothermic/Low)", count: 0 },
    { range: "36.5 - 37.4°C (Normal)", count: 0 },
    { range: "37.5 - 38.4°C (Mild Fever)", count: 0 },
    { range: "38.5 - 39.4°C (Moderate Fever)", count: 0 },
    { range: "≥ 39.5°C (High Fever)", count: 0 },
  ];

  rawReadings.forEach((r: ReadingRecord) => {
    const t = Number(r.temperature_celsius);
    if (t < 36.5) tempDistribution[0].count++;
    else if (t < 37.5) tempDistribution[1].count++;
    else if (t < 38.5) tempDistribution[2].count++;
    else if (t < 39.5) tempDistribution[3].count++;
    else tempDistribution[4].count++;
  });

  // 3. Outcome proportions
  const recoveredCount = patients.filter(
    (p: PatientRecord) => p.status === "discharged" && p.outcome === "recovered"
  ).length;
  const deceasedCount = patients.filter(
    (p: PatientRecord) => p.status === "deceased" && p.outcome === "deceased"
  ).length;
  const activeCount = patients.filter(
    (p: PatientRecord) => p.status === "active" || p.status === "discharge_eligible"
  ).length;

  const outcomeDistribution = [
    { name: "Under Treatment", value: activeCount, color: "#0D9488" },
    { name: "Recovered / Discharged", value: recoveredCount, color: "#16A34A" },
    { name: "Deceased", value: deceasedCount, color: "#DC2626" },
  ];

  return {
    trendData,
    tempDistribution,
    outcomeDistribution,
  };
}
