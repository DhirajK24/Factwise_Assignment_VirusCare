import { NextResponse } from "next/server";
import { isRealSupabaseConfigured } from "@/lib/db/query-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    product: "VirusCare — Patient Quarantine & Treatment Management System",
    version: "1.0.0",
    database: isRealSupabaseConfigured() ? "Supabase PostgreSQL" : "Local Verified Memory Engine",
    timestamp: new Date().toISOString(),
  });
}
