import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const authInitialized = useRef(false);

  const refreshAuth = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) {
      setSession(s);
      setUser(s.user);
    }
  };

  useEffect(() => {
    if (authInitialized.current) return;
    authInitialized.current = true;

    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
      }
    });

    // Then check existing session
    const initAuth = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (isMounted) {
          if (s?.user) {
            setSession(s);
            setUser(s.user);
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider value={{ user, session, loading, signOut, refreshAuth }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
