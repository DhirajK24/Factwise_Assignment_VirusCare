import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createMockClient, isRealSupabaseConfigured } from "../db/query-adapter";

export async function createClient() {
  if (isRealSupabaseConfigured()) {
    try {
      const cookieStore = await cookies();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const client = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options as any)
              );
            } catch {
              // Ignored if called from Server Component
            }
          },
        },
      });

      return client as any;
    } catch {
      return createMockClient() as any;
    }
  }

  return createMockClient() as any;
}
