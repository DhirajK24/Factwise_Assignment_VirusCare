import { NextRequest, NextResponse } from "next/server";
import {
  recordDailyTemperature,
  correctTemperatureReading,
  getTodaysNurseMonitoringList,
  getPatientTemperatureHistory,
} from "@/services/temperature.service";
import { getCurrentUserServer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const date = searchParams.get("date") || undefined;

    if (patientId) {
      const history = await getPatientTemperatureHistory(patientId);
      return NextResponse.json({ success: true, history });
    }

    const monitoringList = await getTodaysNurseMonitoringList(date);
    return NextResponse.json({ success: true, ...monitoringList });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch temperatures" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user || (user.role !== "nurse" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Nurse or Admin role required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const isCorrection = !!body.reading_id;

    if (isCorrection) {
      const result = await correctTemperatureReading({
        reading_id: body.reading_id,
        temperature_celsius: body.temperature_celsius,
        correction_reason: body.correction_reason,
        actor_id: user.id,
      });
      return NextResponse.json({ success: true, reading: result });
    }

    const record = await recordDailyTemperature({
      patient_id: body.patient_id,
      temperature_celsius: body.temperature_celsius,
      reading_date: body.reading_date,
      recorded_by: user.id,
    });

    return NextResponse.json({ success: true, reading: record }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to record temperature" },
      { status: 400 }
    );
  }
}
