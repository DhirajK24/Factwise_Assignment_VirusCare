import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createMockClient, isRealSupabaseConfigured } from "../db/query-adapter";

export async function createClient() {
  if (isRealSupabaseConfigured()) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if called from Server Component
          }
        },
      },
    }) as any;
  }

  return createMockClient() as any;
}
