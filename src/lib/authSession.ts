import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type SessionUser = { session: Session | null; user: User | null };

let inFlight: Promise<SessionUser> | null = null;
let last: SessionUser | null = null;
let lastAt = 0;
const CACHE_MS = 750;

/**
 * Simple session getter - no complex retry logic
 */
export async function getSessionUserSafe(): Promise<SessionUser> {
  // Prevent concurrent calls that can trigger auth-client lock AbortError
  if (inFlight) return inFlight;

  // Tiny cache to collapse bursty mounts
  if (last && Date.now() - lastAt < CACHE_MS) return last;

  inFlight = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const result = { session, user: session?.user ?? null };
      last = result;
      lastAt = Date.now();
      return result;
    } catch (error) {
      console.error("[authSession] Error getting session:", error);
      const result = { session: null, user: null };
      last = result;
      lastAt = Date.now();
      return result;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

