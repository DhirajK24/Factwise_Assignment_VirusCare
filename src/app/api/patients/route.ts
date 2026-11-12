import { NextRequest, NextResponse } from "next/server";
import { listPatients, admitPatient } from "@/services/patient.service";
import { getCurrentUserServer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "all") as any;
    const search = searchParams.get("search") || undefined;
    const sortBy = (searchParams.get("sortBy") || "bed_number") as any;
    const sortOrder = (searchParams.get("sortOrder") || "asc") as any;

    const result = await listPatients({ status, search, sortBy, sortOrder });
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to list patients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user || (user.role !== "admin" && user.role !== "doctor")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Doctor required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const patient = await admitPatient({ ...body, created_by: user.id });

    return NextResponse.json({ success: true, patient }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to admit patient" },
      { status: 400 }
    );
  }
}
