import { NextRequest, NextResponse } from "next/server";
import { dischargePatient, evaluatePatientEligibility } from "@/services/discharge.service";
import { getCurrentUserServer } from "@/lib/auth/session";
import { getFacilitySettings } from "@/services/facility.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "patientId parameter is required" },
        { status: 400 }
      );
    }

    const settings = await getFacilitySettings();
    const evaluation = await evaluatePatientEligibility(
      patientId,
      settings.fever_threshold_celsius
    );

    return NextResponse.json({ success: true, evaluation });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to evaluate eligibility" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authorization required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.patient_id) {
      return NextResponse.json(
        { success: false, error: "patient_id is required" },
        { status: 400 }
      );
    }

    const patient = await dischargePatient(body.patient_id, user.id);
    return NextResponse.json({ success: true, patient });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to execute discharge" },
      { status: 400 }
    );
  }
}
