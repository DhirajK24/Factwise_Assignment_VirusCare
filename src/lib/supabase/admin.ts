import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createMockClient, isRealSupabaseConfigured } from "../db/query-adapter";

export function createAdminClient() {
  if (isRealSupabaseConfigured()) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }) as any;
  }

  // Fallback to internal high-performance mock client
  return createMockClient() as any;
}
