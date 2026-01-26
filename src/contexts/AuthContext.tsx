import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getSessionUserSafe } from "@/lib/authSession";

export type AuthState = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  authState: AuthState;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    // Listen first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      setAuthState(u ? "authenticated" : "unauthenticated");
    });

    // Then restore session once (deduped)
    getSessionUserSafe()
      .then(({ session, user: fallbackUser }) => {
        if (!mounted) return;
        const u = session?.user ?? fallbackUser ?? null;
        setUser(u);
        setAuthState(u ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setAuthState("unauthenticated");
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authState, user }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
