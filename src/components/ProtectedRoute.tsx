import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BrandedLoader from "@/components/BrandedLoader";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If user was passed from AuthCallback, we're authenticated
  if (location.state?.user) {
    return <>{children}</>;
  }

  if (loading) return <BrandedLoader />;

  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
