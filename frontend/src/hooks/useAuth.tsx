import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

// Combined user type that works with both Supabase and Emergent auth
interface AppUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface AuthContext {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isEmergentAuth: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  isEmergentAuth: false,
  refreshAuth: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmergentAuth, setIsEmergentAuth] = useState(false);
  const isEmergentAuthRef = useRef(false);
  const authInitialized = useRef(false);

  const checkEmergentAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.user_id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
        });
        setIsEmergentAuth(true);
        isEmergentAuthRef.current = true;
        return true;
      }
    } catch (error) {
      // Emergent auth not available
    }
    return false;
  };

  const refreshAuth = async () => {
    const hasEmergent = await checkEmergentAuth();
    if (!hasEmergent) {
      const { data: { session: supaSession } } = await supabase.auth.getSession();
      if (supaSession?.user) {
        setSession(supaSession);
        setUser({
          id: supaSession.user.id,
          email: supaSession.user.email || "",
          name: supaSession.user.user_metadata?.full_name,
          picture: supaSession.user.user_metadata?.avatar_url,
        });
      }
    }
  };

  useEffect(() => {
    // Prevent multiple initializations
    if (authInitialized.current) return;
    authInitialized.current = true;
    
    let isMounted = true;
    
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      // First, check Emergent auth (cookie-based)
      const hasEmergent = await checkEmergentAuth();
      
      if (hasEmergent) {
        if (isMounted) setLoading(false);
        return;
      }

      // Fall back to Supabase auth
      try {
        const { data: { session: supaSession } } = await supabase.auth.getSession();
        if (isMounted) {
          if (supaSession?.user) {
            setSession(supaSession);
            setUser({
              id: supaSession.user.id,
              email: supaSession.user.email || "",
              name: supaSession.user.user_metadata?.full_name,
              picture: supaSession.user.user_metadata?.avatar_url,
            });
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Supabase auth check failed:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for Supabase auth changes - but ONLY if not using Emergent auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      
      // CRITICAL: Skip if using Emergent auth
      if (isEmergentAuthRef.current) return;
      
      // Only update on meaningful events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession?.user) {
          setSession(newSession);
          setUser({
            id: newSession.user.id,
            email: newSession.user.email || "",
            name: newSession.user.user_metadata?.full_name,
            picture: newSession.user.user_metadata?.avatar_url,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
      // Ignore other events like INITIAL_SESSION to prevent unnecessary updates
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isEmergentAuth) {
      // Logout from Emergent auth
      try {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Emergent logout error:", error);
      }
      setUser(null);
      setIsEmergentAuth(false);
      isEmergentAuthRef.current = false;
    } else {
      // Logout from Supabase
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthCtx.Provider value={{ user, session, loading, signOut, isEmergentAuth, refreshAuth }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
