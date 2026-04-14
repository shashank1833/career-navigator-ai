import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Briefcase, BookOpen, TrendingUp, Brain, Target,
  ArrowUpRight, Loader2, Sparkles, Rocket, Zap, Map,
  LayoutGrid, Table, Award, CheckCircle2, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import DashboardCharts from "@/components/DashboardCharts";
import MarketInsights from "@/components/MarketInsights";
import KanbanBoard from "@/components/KanbanBoard";
import AIRecommendations from "@/components/AIRecommendations";
import { useJobApplications } from "@/hooks/useJobApplications";
import { Skeleton } from "@/components/ui/skeleton";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

interface DashboardStats {
  resumeVersions: number;
  savedJobs: number;
  applications: number;
  roadmapCompleted: number;
}

interface RoadmapProgress {
  roadmap_id: string;
  step_id: string;
  completed: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const Dashboard = () => {
  const { user, loading, isEmergentAuth } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ resumeVersions: 0, savedJobs: 0, applications: 0, roadmapCompleted: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [roadmapProgress, setRoadmapProgress] = useState<RoadmapProgress[]>([]);
  const { applications, updateStatus, removeApplication } = useJobApplications();

  useEffect(() => {
    if (!user) return;

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
        setStatsLoading(false);
      }).catch(() => setStatsLoading(false));
    } else {
      setStatsLoading(false);
    }

    // Fetch roadmap progress
    fetch(`${BACKEND_URL}/api/user-progress/${user.id}`)
      .then((r) => r.json())
      .then(setRoadmapProgress)
      .catch(() => {});
  }, [user, isEmergentAuth]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const firstName = displayName.split(" ")[0];

  const statCards = [
    { label: "Saved Jobs", subtitle: "Bookmarked opportunities", value: stats.savedJobs, icon: Briefcase, gradient: "from-primary/15 to-primary/5", borderColor: "border-primary/20 hover:border-primary/40", iconColor: "text-primary" },
    { label: "Applications", subtitle: "Tracked submissions", value: stats.applications, icon: BookOpen, gradient: "from-secondary/15 to-secondary/5", borderColor: "border-secondary/20 hover:border-secondary/40", iconColor: "text-secondary" },
    { label: "Milestones", subtitle: "Roadmap progress", value: roadmapProgress.filter(p => p.completed).length, icon: Target, gradient: "from-accent/15 to-accent/5", borderColor: "border-accent/20 hover:border-accent/40", iconColor: "text-accent" },
    { label: "Skills", subtitle: "Steps completed", value: roadmapProgress.length, icon: Award, gradient: "from-emerald-500/15 to-emerald-500/5", borderColor: "border-emerald-500/20 hover:border-emerald-500/40", iconColor: "text-emerald-500" },
  ];

  const quickActions = [
    { title: "Resume Analysis", desc: "Get AI-powered feedback on your resume", icon: Sparkles, gradient: "from-primary/12 to-primary/4", border: "border-primary/20 hover:border-primary/40", iconBg: "bg-primary/10", iconColor: "text-primary", route: "/analyze" },
    { title: "Career Roadmaps", desc: "Follow step-by-step learning paths", icon: Map, gradient: "from-secondary/12 to-secondary/4", border: "border-secondary/20 hover:border-secondary/40", iconBg: "bg-secondary/10", iconColor: "text-secondary", route: "/roadmaps" },
    { title: "Explore Careers", desc: "Discover careers across domains", icon: Compass, gradient: "from-accent/12 to-accent/4", border: "border-accent/20 hover:border-accent/40", iconBg: "bg-accent/10", iconColor: "text-accent", route: "/explore" },
    { title: "Resume Optimizer", desc: "AI-optimize your resume for jobs", icon: Rocket, gradient: "from-emerald-500/12 to-emerald-500/4", border: "border-emerald-500/20 hover:border-emerald-500/40", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", route: "/optimizer" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const hasActivity = stats.resumeVersions > 0 || stats.savedJobs > 0 || stats.applications > 0 || roadmapProgress.length > 0;

  return (
    <div className="relative">
      {/* Ambient orbs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-8"
      >
        {/* Hero Welcome */}
        <motion.div variants={item} className="glass-card p-5 sm:p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-muted-foreground mb-1"
                >
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </motion.p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {getGreeting()}, <span className="gradient-text">{firstName}</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-lg">
                  {hasActivity
                    ? "Pick up where you left off — review your applications, refine your resume, or explore new opportunities."
                    : "Start by uploading your resume or exploring career paths to unlock personalized insights."
                  }
                </p>
                {!hasActivity && (
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => navigate("/analyze")} size="sm" className="gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> Analyze Resume
                    </Button>
                    <Button onClick={() => navigate("/explore")} variant="outline" size="sm" className="gap-2">
                      <Compass className="w-3.5 h-3.5" /> Explore Careers
                    </Button>
                  </div>
                )}
              </div>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="hidden sm:block"
              >
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <motion.div
              key={s.label}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`relative p-5 rounded-xl bg-gradient-to-br ${s.gradient} border ${s.borderColor} transition-all text-left overflow-hidden`}
            >
              <div className="relative z-10">
                <div className={`p-2 rounded-lg bg-background/50 ${s.iconColor} w-fit mb-3`}>
                  <s.icon className="w-4 h-4" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-9 w-16 mb-1" />
                ) : (
                  <p className="text-3xl font-bold text-foreground mb-0.5">{s.value}</p>
                )}
                <p className="text-xs font-medium text-foreground mb-0.5">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div variants={item}>
          <Tabs defaultValue="overview">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Insights & Tools</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Analytics, AI recommendations, and market intelligence</p>
              </div>
              <TabsList className="bg-muted/50 border border-border/50 rounded-lg p-1">
                <TabsTrigger value="overview" className="text-xs gap-1.5 rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <LayoutGrid className="w-3.5 h-3.5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs gap-1.5 rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Brain className="w-3.5 h-3.5" /> AI Recs
                </TabsTrigger>
                <TabsTrigger value="market" className="text-xs gap-1.5 rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5" /> Market
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="overview">
              <DashboardCharts applications={applications} />
            </TabsContent>
            <TabsContent value="ai">
              <AIRecommendations />
            </TabsContent>
            <TabsContent value="market">
              <MarketInsights userSkills={[]} />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Applications */}
        {applications.length > 0 && (
          <motion.div variants={item}>
            <Tabs defaultValue="kanban">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Applications</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Track your job submissions</p>
                </div>
                <TabsList className="bg-muted/50 border border-border/50 rounded-lg p-1">
                  <TabsTrigger value="kanban" className="text-xs gap-1.5 rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <LayoutGrid className="w-3.5 h-3.5" /> Kanban
                  </TabsTrigger>
                  <TabsTrigger value="table" className="text-xs gap-1.5 rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Table className="w-3.5 h-3.5" /> Table
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="kanban">
                <KanbanBoard applications={applications} onUpdateStatus={updateStatus} onRemove={removeApplication} />
              </TabsContent>
              <TabsContent value="table">
                <div className="glass-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground">
                        <th className="text-left p-3 text-xs font-medium">Company</th>
                        <th className="text-left p-3 text-xs font-medium">Role</th>
                        <th className="text-left p-3 text-xs font-medium">Match</th>
                        <th className="text-left p-3 text-xs font-medium">Status</th>
                        <th className="text-left p-3 text-xs font-medium">Applied</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.slice(0, 10).map((app) => (
                        <tr key={app.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                          <td className="p-3 text-foreground text-sm font-medium">{app.company}</td>
                          <td className="p-3 text-foreground text-sm">{app.job_title}</td>
                          <td className="p-3 text-primary text-sm font-semibold">{app.match_score}%</td>
                          <td className="p-3"><span className="capitalize text-muted-foreground text-xs px-2 py-1 rounded-full bg-muted/30">{app.status}</span></td>
                          <td className="p-3 text-muted-foreground text-sm">{app.applied_date || "—"}</td>
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
        <motion.div variants={item}>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">Quick Actions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Jump into any workflow in one click</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <motion.button
                key={action.title}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.route)}
                className={`p-5 rounded-xl bg-gradient-to-br ${action.gradient} border ${action.border} transition-all text-left group`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${action.iconBg}`}>
                    <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                  </div>
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">{action.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{action.desc}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
