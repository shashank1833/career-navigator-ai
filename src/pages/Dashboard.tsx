import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, LogOut, FileText, Briefcase, BookOpen, Plus, User, Settings, LayoutGrid, Table } from "lucide-react";
import careerLogo from "@/assets/career-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardCharts from "@/components/DashboardCharts";
import KanbanBoard from "@/components/KanbanBoard";
import { useJobApplications } from "@/hooks/useJobApplications";
import type { ApplicationStatus } from "@/hooks/useJobApplications";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface DashboardStats {
  resumeVersions: number;
  savedJobs: number;
  applications: number;
  roadmapCompleted: number;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ resumeVersions: 0, savedJobs: 0, applications: 0, roadmapCompleted: 0 });
  const { applications, updateStatus, removeApplication } = useJobApplications();

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
        supabase.from("roadmap_progress").select("id", { count: "exact", head: true }).eq("session_id", sessionId).eq("completed", true),
      ]).then(([rv, sj, ja, rp]) => {
        setStats({
          resumeVersions: rv.count || 0,
          savedJobs: sj.count || 0,
          applications: ja.count || 0,
          roadmapCompleted: rp.count || 0,
        });
      });
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const quickAccessProfile = {
    name: displayName,
    education: "Not provided",
    experience: "Not provided",
    tagline: "Career profile",
    skills: [],
    technologies: [],
  };

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
            <img src={careerLogo} alt="Career Intelligence" className="w-8 h-8" />
            <h1 className="text-2xl font-extrabold gradient-text">Career Intelligence</h1>
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} title="Settings">
              <Settings className="w-4 h-4" />
            </Button>
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
            { label: "Saved Jobs", value: stats.savedJobs, icon: Briefcase, color: "text-secondary", route: "/analyze", desc: "View saved job listings" },
            { label: "Applications", value: stats.applications, icon: BookOpen, color: "text-accent", route: "/analyze", desc: "Track your applications" },
            { label: "Roadmap Done", value: stats.roadmapCompleted, icon: Zap, color: "text-green-500", route: "/analyze", desc: "Continue learning roadmap" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.route)}
              className="p-5 rounded-xl bg-card/80 backdrop-blur border border-border hover:border-primary/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{s.desc}</p>
            </button>
          ))}
        </motion.div>

        {/* Charts */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Insights</h3>
          <DashboardCharts applications={applications} />
        </motion.div>

        {/* Application Tracker */}
        {applications.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
            <Tabs defaultValue="kanban">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Applications</h3>
                <TabsList className="bg-card/80">
                  <TabsTrigger value="kanban" className="text-xs gap-1"><LayoutGrid className="w-3 h-3" /> Kanban</TabsTrigger>
                  <TabsTrigger value="table" className="text-xs gap-1"><Table className="w-3 h-3" /> Table</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="kanban">
                <KanbanBoard applications={applications} onUpdateStatus={updateStatus} onRemove={removeApplication} />
              </TabsContent>
              <TabsContent value="table">
                <div className="rounded-xl bg-card/80 backdrop-blur border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left p-3 font-medium">Company</th>
                        <th className="text-left p-3 font-medium">Role</th>
                        <th className="text-left p-3 font-medium">Score</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.slice(0, 10).map((app) => (
                        <tr key={app.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-3 text-foreground">{app.company}</td>
                          <td className="p-3 text-foreground">{app.job_title}</td>
                          <td className="p-3 text-primary font-medium">{app.match_score}%</td>
                          <td className="p-3"><span className="capitalize text-muted-foreground">{app.status}</span></td>
                          <td className="p-3 text-muted-foreground">{app.applied_date || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/analyze")}
              className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all text-left group shadow-[0_6px_0_0_hsl(var(--primary)/0.3)] hover:shadow-[0_3px_0_0_hsl(var(--primary)/0.3)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px]"
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
              onClick={() => navigate("/resumes")}
              className="p-6 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 hover:border-secondary/40 transition-all text-left group shadow-[0_6px_0_0_hsl(var(--secondary)/0.3)] hover:shadow-[0_3px_0_0_hsl(var(--secondary)/0.3)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <FileText className="w-5 h-5 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground group-hover:text-secondary transition-colors">My Resumes</h4>
              </div>
              <p className="text-xs text-muted-foreground">View and manage your previously analyzed resumes</p>
            </button>

            <button
              onClick={() => navigate("/analyze")}
              className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 hover:border-accent/40 transition-all text-left group shadow-[0_6px_0_0_hsl(var(--accent)/0.3)] hover:shadow-[0_3px_0_0_hsl(var(--accent)/0.3)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Briefcase className="w-5 h-5 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground group-hover:text-accent transition-colors">Find Jobs</h4>
              </div>
              <p className="text-xs text-muted-foreground">Search and match jobs based on your profile</p>
            </button>

            <button
              onClick={() => navigate("/analyze")}
              className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-all text-left group shadow-[0_6px_0_0_rgba(34,197,94,0.3)] hover:shadow-[0_3px_0_0_rgba(34,197,94,0.3)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Zap className="w-5 h-5 text-green-500" />
                </div>
                <h4 className="font-semibold text-foreground group-hover:text-green-500 transition-colors">Career Path</h4>
              </div>
              <p className="text-xs text-muted-foreground">Analyze your career trajectory and get a learning roadmap</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
