import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const isAbortError = (err: unknown): boolean => {
  const e = err as any;
  const msg = String(e?.message ?? "");
  return e?.name === "AbortError" || msg.includes("aborted") || msg.includes("signal is aborted");
};

type SessionUser = { session: Session | null; user: User | null };

// Deduplicate concurrent session/user reads to avoid GoTrueClient lock contention.
let inFlight: Promise<SessionUser> | null = null;
let cache: SessionUser = { session: null, user: null };
let cacheAt = 0;

/**
 * Returns the current session/user while avoiding concurrent auth-client lock contention.
 * This is intentionally frontend-only and does not touch backend settings.
 */
export async function getSessionUserSafe(options?: {
  maxAgeMs?: number;
  maxAbortRetries?: number;
}): Promise<SessionUser> {
  const maxAgeMs = options?.maxAgeMs ?? 750;
  const maxAbortRetries = options?.maxAbortRetries ?? 4;

  if (Date.now() - cacheAt < maxAgeMs) return cache;
  if (inFlight) return inFlight;

  inFlight = (async (): Promise<SessionUser> => {
    for (let attempt = 1; attempt <= maxAbortRetries; attempt++) {
      try {
        // Prefer session first (fast path)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) return { session, user: session.user };

        // Fallback to direct user fetch
        const { data: { user } } = await supabase.auth.getUser();
        return { session, user: user ?? null };
      } catch (err) {
        if (isAbortError(err) && attempt < maxAbortRetries) {
          await sleep(200 * attempt);
          continue;
        }
        // On persistent aborts, treat as unauthenticated to unblock UI.
        if (isAbortError(err)) return { session: null, user: null };
        throw err;
      }
    }

    return { session: null, user: null };
  })()
    .then((result) => {
      cache = result;
      cacheAt = Date.now();
      return result;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
