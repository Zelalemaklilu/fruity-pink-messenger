import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type SessionUser = { session: Session | null; user: User | null };

/**
 * Simple session getter - no complex retry logic
 */
export async function getSessionUserSafe(): Promise<SessionUser> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return { session, user: session?.user ?? null };
  } catch (error) {
    console.error("[authSession] Error getting session:", error);
    return { session: null, user: null };
  }
}
