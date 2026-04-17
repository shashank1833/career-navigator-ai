import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Briefcase, BookOpen, TrendingUp, Brain, Target,
  Loader2, Sparkles, Rocket, Map, LayoutGrid, Table,
  Award, CheckCircle2, Compass, MessageSquare, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardCharts from "@/components/DashboardCharts";
import MarketInsights from "@/components/MarketInsights";
import KanbanBoard from "@/components/KanbanBoard";
import AIRecommendations from "@/components/AIRecommendations";
import SkillGapChart from "@/components/SkillGapChart";
import { useJobApplications } from "@/hooks/useJobApplications";
import { Skeleton } from "@/components/ui/skeleton";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

interface DashboardStats {
  applications: number;
  roadmapCompleted: number;
  resumeVersions: number;
}

interface RoadmapProgress {
  roadmap_id: string;
  step_id: string;
  completed: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ applications: 0, roadmapCompleted: 0, resumeVersions: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [roadmapProgress, setRoadmapProgress] = useState<RoadmapProgress[]>([]);
  const { applications, updateStatus, removeApplication } = useJobApplications();

  useEffect(() => {
    if (!user?.user_id) return;
    setStatsLoading(true);

    const userId = user.user_id;

    Promise.all([
      fetch(`${API}/user-progress/${userId}`, { credentials: "include" }).then(r => r.json()).catch(() => []),
      fetch(`${API}/resume-versions/${userId}`, { credentials: "include" }).then(r => r.json()).catch(() => []),
      fetch(`${API}/job-applications/${userId}`, { credentials: "include" }).then(r => r.json()).catch(() => []),
    ]).then(([progress, versions, apps]) => {
      const completedProgress = Array.isArray(progress) ? progress.filter((p: any) => p.completed) : [];
      setRoadmapProgress(completedProgress);
      setStats({
        roadmapCompleted: completedProgress.length,
        resumeVersions: Array.isArray(versions) ? versions.length : 0,
        applications: Array.isArray(apps) ? apps.length : 0,
      });
      setStatsLoading(false);
    });
  }, [user?.user_id]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const firstName = displayName.split(" ")[0];

  const statCards = [
    { label: "Applications", subtitle: "Tracked submissions", value: stats.applications, icon: Briefcase, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { label: "Milestones", subtitle: "Roadmap progress", value: stats.roadmapCompleted, icon: Target, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
    { label: "Resume Versions", subtitle: "Saved versions", value: stats.resumeVersions, icon: FileText, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
    { label: "Skills Completed", subtitle: "Steps done", value: roadmapProgress.length, icon: Award, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  ];

  const quickActions = [
    { title: "Resume Analysis", desc: "AI-powered resume feedback", icon: Sparkles, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20 hover:border-primary/40", route: "/analyze" },
    { title: "Career Coach", desc: "Chat with your AI career advisor", icon: MessageSquare, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20 hover:border-secondary/40", route: "/coach" },
    { title: "Trajectory Sim", desc: "Plan your career transition", icon: Zap, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20 hover:border-accent/40", route: "/simulate" },
    { title: "Explore Careers", desc: "Discover career paths", icon: Compass, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20 hover:border-emerald-400/40", route: "/explore" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto px-6 py-8 space-y-8"
    >
      {/* Welcome */}
      <motion.div variants={item} className="flat-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {getGreeting()}, <span className="gradient-text">{firstName}</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg">
              {stats.roadmapCompleted > 0
                ? "Pick up where you left off — review your applications, refine your resume, or explore new opportunities."
                : "Start by uploading your resume or exploring career paths to unlock personalized insights."
              }
            </p>
            {stats.roadmapCompleted === 0 && (
              <div className="flex gap-3 mt-4">
                <Button onClick={() => navigate("/analyze")} size="sm" className="gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Analyze Resume
                </Button>
                <Button onClick={() => navigate("/coach")} variant="outline" size="sm" className="gap-2">
                  <MessageSquare className="w-3.5 h-3.5" /> Talk to Coach
                </Button>
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 hidden sm:block">
            <Brain className="w-8 h-8 text-primary" />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <motion.div
            key={s.label}
            whileHover={{ y: -3 }}
            className={`flat-card p-5 border ${s.border}`}
          >
            <div className={`p-2 rounded-lg ${s.bg} ${s.color} w-fit mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            {statsLoading ? (
              <Skeleton className="h-9 w-16 mb-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mb-0.5">{s.value}</p>
            )}
            <p className="text-xs font-medium text-foreground mb-0.5">{s.label}</p>
            <p className="text-[10px] text-muted-foreground">{s.subtitle}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Tabs */}
      <motion.div variants={item}>
        <Tabs defaultValue="overview">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Insights & Tools</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Analytics, AI, and market intelligence</p>
            </div>
            <TabsList className="bg-muted/50 border border-border rounded-lg p-1">
              <TabsTrigger value="overview" className="text-xs gap-1.5 rounded-md px-3 py-1.5">
                <LayoutGrid className="w-3.5 h-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="skill-gap" className="text-xs gap-1.5 rounded-md px-3 py-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Skill Gap
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs gap-1.5 rounded-md px-3 py-1.5">
                <Brain className="w-3.5 h-3.5" /> AI Recs
              </TabsTrigger>
              <TabsTrigger value="market" className="text-xs gap-1.5 rounded-md px-3 py-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Market
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="flat-card p-5">
            <DashboardCharts applications={applications} />
          </TabsContent>
          <TabsContent value="skill-gap" className="flat-card p-5">
            <SkillGapChart userId={user.user_id} />
          </TabsContent>
          <TabsContent value="ai" className="flat-card p-5">
            <AIRecommendations />
          </TabsContent>
          <TabsContent value="market" className="flat-card p-5">
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
              <TabsList className="bg-muted/50 border border-border rounded-lg p-1">
                <TabsTrigger value="kanban" className="text-xs gap-1.5 rounded-md px-3 py-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" /> Kanban
                </TabsTrigger>
                <TabsTrigger value="table" className="text-xs gap-1.5 rounded-md px-3 py-1.5">
                  <Table className="w-3.5 h-3.5" /> Table
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="kanban">
              <KanbanBoard applications={applications} onUpdateStatus={updateStatus} onRemove={removeApplication} />
            </TabsContent>
            <TabsContent value="table" className="flat-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3 text-xs font-medium">Company</th>
                    <th className="text-left p-3 text-xs font-medium">Role</th>
                    <th className="text-left p-3 text-xs font-medium">Status</th>
                    <th className="text-left p-3 text-xs font-medium">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 10).map((app) => (
                    <tr key={app.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                      <td className="p-3 text-foreground text-sm font-medium">{app.company}</td>
                      <td className="p-3 text-foreground text-sm">{app.job_title}</td>
                      <td className="p-3"><span className="capitalize text-muted-foreground text-xs px-2 py-1 rounded-full bg-muted/30">{app.status}</span></td>
                      <td className="p-3 text-muted-foreground text-sm">{app.applied_date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(action.route)}
              className={`flat-card p-5 border ${action.border} transition-all text-left group`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${action.bg}`}>
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <h4 className="font-medium text-foreground text-sm">{action.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{action.desc}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
