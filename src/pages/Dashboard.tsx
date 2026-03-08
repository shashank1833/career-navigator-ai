import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Zap, LogOut, FileText, Briefcase, BookOpen, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface DashboardStats {
  resumeVersions: number;
  savedJobs: number;
  applications: number;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ resumeVersions: 0, savedJobs: 0, applications: 0 });

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch profile
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });

    // Fetch stats using session_id from localStorage
    const sessionId = localStorage.getItem("career_platform_session_id");
    if (sessionId) {
      Promise.all([
        supabase.from("resume_versions").select("id", { count: "exact", head: true }).eq("session_id", sessionId),
        supabase.from("saved_jobs").select("id", { count: "exact", head: true }).eq("session_id", sessionId),
        supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("session_id", sessionId),
      ]).then(([rv, sj, ja]) => {
        setStats({
          resumeVersions: rv.count || 0,
          savedJobs: sj.count || 0,
          applications: ja.count || 0,
        });
      });
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow" />
      <div className="floating-orb w-80 h-80 bg-secondary top-1/3 -left-40 animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 glow-text-primary" />
            <h1 className="text-2xl font-extrabold gradient-text">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden sm:inline">{displayName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </motion.header>

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-1">Welcome back, {displayName}! 👋</h2>
          <p className="text-sm text-muted-foreground">Here's an overview of your career intelligence journey.</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Resume Versions", value: stats.resumeVersions, icon: FileText, color: "text-primary" },
            { label: "Saved Jobs", value: stats.savedJobs, icon: Briefcase, color: "text-secondary" },
            { label: "Applications", value: stats.applications, icon: BookOpen, color: "text-accent" },
          ].map((s) => (
            <div key={s.label} className="p-5 rounded-xl bg-card/80 backdrop-blur border border-border">
              <div className="flex items-center gap-3 mb-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/analyze")}
              className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">New Analysis</h4>
              </div>
              <p className="text-xs text-muted-foreground">Upload a resume and get AI-powered career insights</p>
            </button>

            <button
              onClick={() => navigate("/analyze")}
              className="p-6 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 hover:border-secondary/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Briefcase className="w-5 h-5 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground group-hover:text-secondary transition-colors">Find Jobs</h4>
              </div>
              <p className="text-xs text-muted-foreground">Search and match jobs based on your profile</p>
            </button>

            <button
              onClick={() => navigate("/analyze")}
              className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 hover:border-accent/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground group-hover:text-accent transition-colors">Career Growth</h4>
              </div>
              <p className="text-xs text-muted-foreground">Analyze your career path and get a learning roadmap</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
