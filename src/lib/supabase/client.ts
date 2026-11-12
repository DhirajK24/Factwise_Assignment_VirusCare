import { createBrowserClient } from "@supabase/ssr";
import { createMockClient, isRealSupabaseConfigured } from "../db/query-adapter";

export function createClient() {
  if (isRealSupabaseConfigured()) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createBrowserClient(supabaseUrl, supabaseAnonKey) as any;
  }

  return createMockClient() as any;
}
