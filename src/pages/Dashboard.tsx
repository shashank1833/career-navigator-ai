import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Briefcase, BookOpen, TrendingUp, LayoutGrid, Table, Brain, Target, ArrowUpRight, Loader2, Sparkles, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardCharts from "@/components/DashboardCharts";
import KanbanBoard from "@/components/KanbanBoard";
import MarketInsights from "@/components/MarketInsights";
import { useJobApplications } from "@/hooks/useJobApplications";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ resumeVersions: 0, savedJobs: 0, applications: 0, roadmapCompleted: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const { applications, updateStatus, removeApplication } = useJobApplications();

  useEffect(() => {
    if (!user) return;

    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); })
      .then(() => {}, () => {});

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
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const firstName = displayName.split(" ")[0];
  const quickAccessProfile = {
    name: displayName,
    education: "Not provided",
    experience: "Not provided",
    tagline: "Career profile",
    skills: [],
    technologies: [],
  };

  const statCards = [
    { label: "SAVED JOBS", value: stats.savedJobs, icon: Briefcase, initialTab: "jobs", initialJobsTab: "saved" },
    { label: "APPLICATIONS", value: stats.applications, icon: BookOpen, initialTab: "jobs", initialJobsTab: "tracker" },
    { label: "MILESTONES", value: stats.roadmapCompleted, icon: Target, initialTab: "career" },
  ];

  const quickActions = [
    { title: "Resume Analysis", desc: "Get AI-powered feedback on your resume", icon: Sparkles, route: "/analyze" },
    { title: "Resume History", desc: "Compare versions and track progress", icon: FileText, route: "/resumes" },
    { title: "Job Matching", desc: "Discover roles that align with your skills", icon: Briefcase, route: "/analyze" },
    { title: "Career Roadmap", desc: "Build a personalized learning path", icon: Rocket, route: "/analyze" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const hasActivity = stats.resumeVersions > 0 || stats.savedJobs > 0 || stats.applications > 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
      {/* Hero Welcome */}
      <div className="ed-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="ed-label mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h2 className="text-[22px] font-semibold text-foreground mb-2 tracking-tight">
              {getGreeting()}, <span className="text-primary">{firstName}</span>
            </h2>
            <p className="text-[13px] text-muted-foreground max-w-lg">
              {hasActivity
                ? "Pick up where you left off — review your applications, refine your resume, or explore new opportunities."
                : "Start by uploading your resume to unlock personalized insights, job matches, and a tailored career roadmap."
              }
            </p>
            {!hasActivity && (
              <button
                onClick={() => navigate("/analyze")}
                className="ed-btn mt-4"
              >
                <Sparkles className="w-3.5 h-3.5" /> Analyze Your Resume
              </button>
            )}
          </div>
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-[10px] bg-teal-light">
            <Brain className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((s) => (
          <button
            key={s.label}
            onClick={() =>
              navigate("/analyze", {
                state: { profileData: quickAccessProfile, initialTab: s.initialTab, initialJobsTab: s.initialJobsTab },
              })
            }
            className="ed-card text-left group flex items-start justify-between"
          >
            <div>
              <p className="ed-label mb-2">{s.label}</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-12 mb-1" />
              ) : (
                <p className="ed-metric">{s.value}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <s.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </div>
          </button>
        ))}
      </div>

      {/* Insights */}
      <div>
        <Tabs defaultValue="overview">
          <div className="flex items-center justify-between mb-4">
            <h3 className="ed-section-title">Insights</h3>
            <TabsList className="bg-muted border border-border rounded-lg p-1 h-auto">
              <TabsTrigger value="overview" className="text-[11px] gap-1.5 rounded-md px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><LayoutGrid className="w-3.5 h-3.5" /> Overview</TabsTrigger>
              <TabsTrigger value="market" className="text-[11px] gap-1.5 rounded-md px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><TrendingUp className="w-3.5 h-3.5" /> Market</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview">
            <DashboardCharts applications={applications} />
          </TabsContent>
          <TabsContent value="market">
            <MarketInsights userSkills={[]} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Applications */}
      {applications.length > 0 && (
        <div>
          <Tabs defaultValue="kanban">
            <div className="flex items-center justify-between mb-4">
              <h3 className="ed-section-title">Applications</h3>
              <TabsList className="bg-muted border border-border rounded-lg p-1 h-auto">
                <TabsTrigger value="kanban" className="text-[11px] gap-1.5 rounded-md px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><LayoutGrid className="w-3.5 h-3.5" /> Kanban</TabsTrigger>
                <TabsTrigger value="table" className="text-[11px] gap-1.5 rounded-md px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><Table className="w-3.5 h-3.5" /> Table</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="kanban">
              <KanbanBoard applications={applications} onUpdateStatus={updateStatus} onRemove={removeApplication} />
            </TabsContent>
            <TabsContent value="table">
              <div className="ed-card overflow-hidden p-0">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-3 ed-label font-medium">Company</th>
                      <th className="text-left p-3 ed-label font-medium">Role</th>
                      <th className="text-left p-3 ed-label font-medium">Match</th>
                      <th className="text-left p-3 ed-label font-medium">Status</th>
                      <th className="text-left p-3 ed-label font-medium">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 10).map((app) => (
                      <tr key={app.id} className="border-b border-border hover:bg-muted/50 transition-colors duration-150">
                        <td className="p-3 text-foreground font-medium">{app.company}</td>
                        <td className="p-3 text-foreground">{app.job_title}</td>
                        <td className="p-3"><span className="ed-match-badge">{app.match_score}%</span></td>
                        <td className="p-3"><span className="capitalize text-muted-foreground text-[11px] px-2 py-1 rounded bg-muted">{app.status}</span></td>
                        <td className="p-3 text-muted-foreground">{app.applied_date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="ed-section-title mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.route)}
              className="ed-card text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-muted">
                  <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-150" strokeWidth={1.5} />
                </div>
                <h4 className="font-medium text-foreground text-[13px]">{action.title}</h4>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
