import { NextResponse } from "next/server";
import { getFacilityAnalytics, getAnalyticsChartData } from "@/services/analytics.service";
import { getFacilityBedsMap } from "@/services/patient.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [metrics, charts, beds] = await Promise.all([
      getFacilityAnalytics(),
      getAnalyticsChartData(),
      getFacilityBedsMap(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        charts,
        beds,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
