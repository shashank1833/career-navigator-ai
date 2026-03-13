import { useState, useEffect, useCallback } from "react";
import DashboardCard from "./DashboardCard";
import { TrendingUp, Search, Loader2, CheckCircle2, Circle, ExternalLink, Clock, Lightbulb, Target, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSessionId } from "@/lib/session";
import type { AnalysisProfile } from "@/types/analysis";

const PERIOD_OPTIONS = [
  { value: "3-months", label: "3 Months" },
  { value: "6-months", label: "6 Months" },
  { value: "1-year", label: "1 Year" },
  { value: "2-years", label: "2 Years" },
];
import type { AnalysisProfile } from "@/types/analysis";

interface RoadmapStep {
  title: string;
  desc: string;
  done: boolean;
  skills?: string[];
  links?: { label: string; url: string }[];
}

interface CareerRoleResult {
  targetRole: string;
  matchPercentage: number;
  matchBreakdown: {
    skillMatch: number;
    experienceMatch: number;
    educationMatch: number;
  };
  matchingSkills: string[];
  missingSkills: string[];
  roadmap: {
    goal: string;
    steps: RoadmapStep[];
  };
  timeEstimate: string;
  tips: string[];
}

const CareerRoleAnalyzer = ({ profile }: { profile: AnalysisProfile }) => {
  const [targetRole, setTargetRole] = useState("");
  const [period, setPeriod] = useState("6-months");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CareerRoleResult | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const sessionId = getSessionId();

  // Load saved progress when result changes
  const loadProgress = useCallback(async (role: string) => {
    const { data } = await supabase
      .from("roadmap_progress")
      .select("step_index")
      .eq("session_id", sessionId)
      .eq("target_role", role)
      .eq("completed", true);
    if (data) {
      setCompletedSteps(new Set(data.map((r: any) => r.step_index)));
    }
  }, [sessionId]);

  useEffect(() => {
    if (result?.targetRole) {
      loadProgress(result.targetRole);
    }
  }, [result?.targetRole, loadProgress]);

  const toggleStep = async (stepIndex: number) => {
    if (!result) return;
    const isCompleted = completedSteps.has(stepIndex);
    const newSet = new Set(completedSteps);
    
    if (isCompleted) {
      newSet.delete(stepIndex);
      await supabase
        .from("roadmap_progress")
        .delete()
        .eq("session_id", sessionId)
        .eq("target_role", result.targetRole)
        .eq("step_index", stepIndex);
    } else {
      newSet.add(stepIndex);
      await supabase
        .from("roadmap_progress")
        .upsert({
          session_id: sessionId,
          target_role: result.targetRole,
          step_index: stepIndex,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: "session_id,target_role,step_index" });
    }
    setCompletedSteps(newSet);
  };

  const completionPct = result ? Math.round((completedSteps.size / result.roadmap.steps.length) * 100) : 0;

  const handleAnalyze = async () => {
    if (!targetRole.trim()) {
      toast.error("Please enter a target role");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-career-role", {
        body: {
          targetRole: targetRole.trim(),
          period,
          currentSkills: profile.skills,
          currentTechnologies: profile.technologies,
          experience: profile.experience,
          education: profile.education,
        },
      });

      if (error) throw error;
      setResult(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to analyze career role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-400";
  };

  return (
    <div className="space-y-5">
      {/* Input Section */}
      <DashboardCard title="Career Role Analyzer" icon={Target} delay={0.1} accentColor="secondary">
        <p className="text-sm text-muted-foreground mb-4">
          Enter your desired role, select a timeline, and we'll analyze your match percentage and create a personalized learning roadmap.
        </p>
        <div className="flex gap-3">
          <Input
            placeholder="e.g. Senior Frontend Engineer, ML Engineer, DevOps Lead..."
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
            className="flex-1"
          />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] shrink-0">
              <Calendar className="w-4 h-4 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAnalyze} disabled={loading || !targetRole.trim()} className="shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            Analyze
          </Button>
        </div>
      </DashboardCard>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing your fit for {targetRole}...</p>
            </div>
          </motion.div>
        )}

        {!loading && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Match Score */}
            <DashboardCard title={`Match: ${result.targetRole}`} icon={TrendingUp} delay={0.1} accentColor="primary">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Overall Score */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-muted" />
                      <motion.circle
                        cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                        strokeLinecap="round"
                        className={`${getScoreColor(result.matchPercentage).replace("text-", "stroke-")}`}
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - result.matchPercentage / 100) }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(result.matchPercentage)}`}>
                        {result.matchPercentage}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Overall Match</p>
                </div>

                {/* Breakdown */}
                <div className="md:col-span-3 space-y-3">
                  {[
                    { label: "Skill Match", value: result.matchBreakdown.skillMatch },
                    { label: "Experience Match", value: result.matchBreakdown.experienceMatch },
                    { label: "Education Match", value: result.matchBreakdown.educationMatch },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={`font-semibold ${getScoreColor(item.value)}`}>{item.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${getProgressColor(item.value)}`}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Estimated time to be job-ready:</span>
                    <span className="text-sm font-semibold text-foreground">{result.timeEstimate}</span>
                  </div>
                </div>
              </div>
            </DashboardCard>

            {/* Skills Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <DashboardCard title="Matching Skills" icon={CheckCircle2} delay={0.2} accentColor="accent">
                <div className="flex flex-wrap gap-2">
                  {result.matchingSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {skill}
                    </Badge>
                  ))}
                  {result.matchingSkills.length === 0 && (
                    <p className="text-sm text-muted-foreground">No directly matching skills found.</p>
                  )}
                </div>
              </DashboardCard>

              <DashboardCard title="Missing Skills" icon={Target} delay={0.3} accentColor="primary">
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
                      {skill}
                    </Badge>
                  ))}
                  {result.missingSkills.length === 0 && (
                    <p className="text-sm text-muted-foreground">You have all the required skills!</p>
                  )}
                </div>
              </DashboardCard>
            </div>

            {/* Tips */}
            {result.tips && result.tips.length > 0 && (
              <DashboardCard title="Transition Tips" icon={Lightbulb} delay={0.35} accentColor="secondary">
                <div className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="text-xs font-bold text-primary mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            )}

            {/* Learning Roadmap */}
            <DashboardCard title="Learning Roadmap" icon={TrendingUp} delay={0.4} accentColor="accent" className="col-span-full">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Goal:</span>
                  <span className="ml-2 text-sm font-semibold gradient-text-secondary">{result.roadmap.goal}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32">
                    <Progress value={completionPct} className="h-2" />
                  </div>
                  <span className="text-xs font-semibold text-primary">{completionPct}%</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-4">
                  {result.roadmap.steps.map((step, i) => {
                    const isDone = completedSteps.has(i);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-start gap-4 relative"
                      >
                        <button
                          onClick={() => toggleStep(i)}
                          className="z-10 shrink-0 mt-0.5 cursor-pointer hover:scale-110 transition-transform"
                          title={isDone ? "Mark as incomplete" : "Mark as complete"}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-6 h-6 glow-text-accent" />
                          ) : (
                            <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>
                        <div className={`p-3 rounded-lg border flex-1 transition-colors ${isDone ? "bg-accent/10 border-accent/30" : "bg-muted/20 border-border/50"}`}>
                          <p className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>Step {i + 1} — {step.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                          {step.skills && step.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {step.skills.map((s) => (
                                <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/5 border-primary/20 text-primary">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {step.links && step.links.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {step.links.map((link, li) => (
                                <a
                                  key={li}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {link.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </DashboardCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerRoleAnalyzer;
