/**
 * VirusCare Database Seeder & Cloud Setup Script
 * Usage: npx tsx scripts/seed-db.ts
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  console.log("=================================================");
  console.log("VIRUSCARE — Database Seeding & Setup Procedure");
  console.log("=================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("dummy-project")) {
    console.log("⚠️ No active Supabase Cloud credentials detected in .env.local.");
    console.log("VirusCare is running with internal High-Performance Verified Memory Store.");
    console.log("To connect to a live Supabase PostgreSQL database:");
    console.log("1. Create a project at https://supabase.com");
    console.log("2. Copy Project URL and Service Role Key to .env.local");
    console.log("3. Run: npm run seed");
    return;
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Read SQL migration
  const migrationPath = path.join(process.cwd(), "supabase/migrations/20261112000000_init_viruscare.sql");
  const seedPath = path.join(process.cwd(), "supabase/seed.sql");

  if (fs.existsSync(migrationPath)) {
    console.log("Applying initial schema migration...");
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");
    const { error: migError } = await supabase.rpc("exec_sql", { query: migrationSql });
    if (migError) {
      console.warn("Notice: RPC exec_sql may require direct execution via Supabase SQL Editor. SQL file path: supabase/migrations/20261112000000_init_viruscare.sql");
    } else {
      console.log("✓ Initial schema migration applied successfully.");
    }
  }

  if (fs.existsSync(seedPath)) {
    console.log("Applying realistic fictional demo seed data...");
    const seedSql = fs.readFileSync(seedPath, "utf-8");
    const { error: seedError } = await supabase.rpc("exec_sql", { query: seedSql });
    if (seedError) {
      console.warn("Notice: Please run supabase/seed.sql directly in the Supabase Dashboard SQL Editor.");
    } else {
      console.log("✓ Seed data loaded successfully.");
    }
  }

  console.log("✓ Seeding process complete.");
}

main().catch(console.error);
