import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect } from "react";

const ResetPassword = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.info("Password reset is not available in this version. Please sign in with your email and password.");
    navigate("/auth");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default ResetPassword;
