import { NextRequest, NextResponse } from "next/server";
import { recordDoctorVisit, getTodaysDoctorRoster, getPatientVisits } from "@/services/doctor.service";
import { getCurrentUserServer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const date = searchParams.get("date") || undefined;

    if (patientId) {
      const visits = await getPatientVisits(patientId);
      return NextResponse.json({ success: true, visits });
    }

    const roster = await getTodaysDoctorRoster(date);
    return NextResponse.json({ success: true, ...roster });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch doctor visits" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user || (user.role !== "doctor" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Doctor or Admin role required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const visit = await recordDoctorVisit({
      patient_id: body.patient_id,
      visit_date: body.visit_date,
      doctor_id: user.id,
      clinical_notes: body.clinical_notes,
      exception_reason: body.exception_reason,
    });

    return NextResponse.json({ success: true, visit }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to record doctor visit" },
      { status: 400 }
    );
  }
}
