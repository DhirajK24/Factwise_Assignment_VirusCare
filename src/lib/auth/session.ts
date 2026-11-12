import { cookies } from "next/headers";
import { UserProfile, UserRole } from "@/types";
import { initialProfiles } from "../db/seed-data";
import { memoryStore } from "../db/mock-store";
import { createClient } from "../supabase/server";
import { isRealSupabaseConfigured } from "../db/query-adapter";

const SESSION_COOKIE_NAME = "viruscare_user_id";

export async function getCurrentUserServer(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // 1. If real Supabase configured, check auth session first
  if (isRealSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) return profile as UserProfile;
      }
    } catch {
      // Fallback to cookie
    }
  }

  // 2. Fallback to session cookie
  if (userIdCookie) {
    const profile =
      memoryStore.getProfileById(userIdCookie) ||
      initialProfiles.find((p) => p.id === userIdCookie);
    if (profile) return profile;
  }

  // 3. Default to Admin for demonstration if not set
  return initialProfiles[0];
}

export async function setCurrentUserSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearCurrentUserSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

