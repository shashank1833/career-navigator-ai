import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BrandedLoader from "@/components/BrandedLoader";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <BrandedLoader />;

  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
