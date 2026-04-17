import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BrandedLoader from "@/components/BrandedLoader";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent double processing in React StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL hash
        const hash = location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          setError("No session ID found in callback");
          setTimeout(() => navigate("/auth"), 2000);
          return;
        }

        const sessionId = sessionIdMatch[1];

        // Exchange session_id for session token via backend
        const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Authentication failed");
        }

        const user = await response.json();
        
        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);
        
        // Refresh auth state to pick up the new session
        await refreshAuth();
        
        toast.success(`Welcome, ${user.name || user.email}!`);
        
        // Small delay to ensure auth state is updated before navigation
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 100);
        
      } catch (err: any) {
        if (import.meta.env.DEV) console.warn("[AuthCallback] error:", err);
        setError(err.message || "Authentication failed");
        toast.error(err.message || "Authentication failed");
        setTimeout(() => navigate("/auth"), 3000);
      }
    };

    processAuth();
  }, [location, navigate, refreshAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-muted-foreground text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <BrandedLoader />;
};

export default AuthCallback;
