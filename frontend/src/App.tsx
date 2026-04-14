import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import TopNavbar from "@/components/TopNavbar";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Resumes from "./pages/Resumes";
import Optimizer from "./pages/Optimizer";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import ExploreCareers from "./pages/ExploreCareers";
import RoadmapView from "./pages/RoadmapView";
import SkillsPage from "./pages/SkillsPage";
import ResourcesPage from "./pages/ResourcesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedWithLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>
      {children}
    </AppLayout>
  </ProtectedRoute>
);

const PublicWithLayout = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>
    {children}
  </AppLayout>
);

// Wrapper to detect OAuth callback synchronously
const AppRouter = () => {
  const location = useLocation();
  
  // CRITICAL: Check URL hash for session_id synchronously during render
  // This prevents race conditions by processing OAuth callback FIRST
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public pages with navbar */}
      <Route path="/" element={<PublicWithLayout><HomePage /></PublicWithLayout>} />
      <Route path="/explore" element={<PublicWithLayout><ExploreCareers /></PublicWithLayout>} />
      <Route path="/skills" element={<PublicWithLayout><SkillsPage /></PublicWithLayout>} />
      <Route path="/roadmaps" element={<PublicWithLayout><RoadmapView /></PublicWithLayout>} />
      <Route path="/resources" element={<PublicWithLayout><ResourcesPage /></PublicWithLayout>} />
      
      {/* Auth pages */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected pages with navbar */}
      <Route path="/dashboard" element={<ProtectedWithLayout><Dashboard /></ProtectedWithLayout>} />
      <Route path="/settings" element={<ProtectedWithLayout><Settings /></ProtectedWithLayout>} />
      <Route path="/resumes" element={<ProtectedWithLayout><Resumes /></ProtectedWithLayout>} />
      <Route path="/optimizer" element={<ProtectedWithLayout><Optimizer /></ProtectedWithLayout>} />
      <Route path="/analyze" element={<ProtectedWithLayout><Index /></ProtectedWithLayout>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
