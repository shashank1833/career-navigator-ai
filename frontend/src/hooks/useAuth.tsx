import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

export interface AppUser {
  user_id: string;
  email: string;
  name?: string;
  picture?: string;
  // Compat aliases
  id?: string;
}

interface AuthContext {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const authInitialized = useRef(false);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const userData = await response.json();
        const appUser: AppUser = {
          user_id: userData.user_id,
          id: userData.user_id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
        };
        setUser(appUser);
        return true;
      }
      // Non-2xx response means the user is not authenticated – not an error
    } catch (error) {
      // Network error or server unreachable – treat as unauthenticated
      if (import.meta.env.DEV) {
        console.warn("[useAuth] checkAuth network error:", error);
      }
    }
    return false;
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  useEffect(() => {
    if (authInitialized.current) return;
    authInitialized.current = true;

    // Skip if returning from OAuth callback
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }

    checkAuth().finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      // Logout errors are non-fatal — clear local state regardless
      if (import.meta.env.DEV) {
        console.warn("[useAuth] logout network error:", error);
      }
    }
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, signOut, refreshAuth }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
