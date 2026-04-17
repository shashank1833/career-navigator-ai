import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Loader2, Calendar, ExternalLink, CheckCircle2, Target, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardCard from "./DashboardCard";
import { toast } from "sonner";

const BACKEND_URL_STRATEGY = import.meta.env.REACT_APP_BACKEND_URL || "";

interface MonthlyStep {
  month: number;
  title: string;
  objective: string;
  tasks: string[];
  resources: { title: string; url: string; type: string }[];
  milestone: string;
}

interface CareerStrategy {
  targetRole: string;
  summary: string;
  currentStrengths: string[];
  criticalGaps: string[];
  monthlyPlan: MonthlyStep[];
  totalMonths: number;
  weeklyHours: number;
}

interface Props {
  targetRole: string;
  currentSkills: string[];
  missingSkills: string[];
  experience: string;
  education: string;
}

const CareerStrategyEngine = ({ targetRole, currentSkills, missingSkills, experience, education }: Props) => {
  const [strategy, setStrategy] = useState<CareerStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedMonths, setCompletedMonths] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Use our backend simulate-trajectory endpoint as a proxy
      const res = await fetch(`${BACKEND_URL_STRATEGY}/api/simulate-trajectory`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "anon",
          current_role: experience || "Current Role",
          target_role: targetRole,
          timeline_months: 12,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate strategy");
      const data = await res.json();
      // Convert to CareerStrategy format
      const converted: CareerStrategy = {
        overview: `Transition to ${targetRole} in 12 months`,
        targetRole,
        timelineMonths: 12,
        monthlyPlan: (data.milestones || []).map((m: any) => ({
          month: m.milestone,
          title: m.title,
          objective: m.month_range,
          tasks: m.actions || [],
          resources: [],
          milestone: m.job_tier,
        })),
        successMetrics: data.target_skills?.slice(0, 3) || [],
      };
      setStrategy(converted);
      toast.success("Career strategy generated!");
    } catch (err: any) {
      if (import.meta.env.DEV) console.warn(err);
      toast.error(err.message || "Failed to generate strategy");
    } finally {
      setLoading(false);
    }
  };

  const toggleMonth = (month: number) => {
    const newSet = new Set(completedMonths);
    if (newSet.has(month)) newSet.delete(month);
    else newSet.add(month);
    setCompletedMonths(newSet);
  };

  const completionPct = strategy
    ? Math.round((completedMonths.size / strategy.monthlyPlan.length) * 100)
    : 0;

  const resourceTypeIcon: Record<string, string> = {
    course: "📚",
    doc: "📄",
    tutorial: "🎥",
    project: "🔧",
  };

  return (
    <div className="space-y-4 mt-4">
      <DashboardCard title="Career Strategy Engine" icon={Rocket} delay={0.1} accentColor="primary">
        <p className="text-sm text-muted-foreground mb-3">
          Generate a structured month-by-month plan to transition into <span className="font-semibold text-foreground">{targetRole}</span>.
        </p>
        <Button onClick={handleGenerate} disabled={loading} size="sm" className="gap-2">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating Strategy...</>
          ) : (
            <><Rocket className="w-4 h-4" /> Generate Career Strategy</>
          )}
        </Button>
      </DashboardCard>

      <AnimatePresence>
        {strategy && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary */}
            <DashboardCard title="Strategy Overview" icon={Target} delay={0} accentColor="accent">
              <p className="text-sm text-foreground mb-4">{strategy.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold text-foreground">{strategy.totalMonths}</p>
                  <p className="text-xs text-muted-foreground">Months</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-secondary" />
                  <p className="text-lg font-bold text-foreground">{strategy.weeklyHours}h</p>
                  <p className="text-xs text-muted-foreground">Per Week</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-center">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <p className="text-lg font-bold text-foreground">{completionPct}%</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>

              <Progress value={completionPct} className="h-2 mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Current Strengths
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {strategy.currentStrengths.map((s) => (
                      <Badge key={s} variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3 text-red-400" /> Critical Gaps
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {strategy.criticalGaps.map((s) => (
                      <Badge key={s} variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </DashboardCard>

            {/* Monthly Plan */}
            {strategy.monthlyPlan.map((step, i) => {
              const isDone = completedMonths.has(step.month);
              return (
                <motion.div
                  key={step.month}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  <DashboardCard
                    title={`Month ${step.month}: ${step.title}`}
                    icon={Calendar}
                    delay={0}
                    accentColor={isDone ? "accent" : "secondary"}
                  >
                    <div className="space-y-3">
                      <p className="text-sm text-foreground">{step.objective}</p>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Tasks</p>
                        <div className="space-y-1.5">
                          {step.tasks.map((task, ti) => (
                            <div key={ti} className="flex items-start gap-2 text-xs text-foreground/80">
                              <span className="text-primary font-bold mt-0.5">•</span>
                              {task}
                            </div>
                          ))}
                        </div>
                      </div>

                      {step.resources?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Resources
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {step.resources.map((r, ri) => (
                              <a
                                key={ri}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                              >
                                <span>{resourceTypeIcon[r.type] || "📎"}</span>
                                <ExternalLink className="w-3 h-3" />
                                {r.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <Target className="w-3 h-3 text-accent" />
                          <span className="text-xs text-muted-foreground">Milestone: <span className="text-foreground">{step.milestone}</span></span>
                        </div>
                        <Button
                          variant={isDone ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleMonth(step.month)}
                          className="text-xs h-7"
                        >
                          {isDone ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</> : "Mark Complete"}
                        </Button>
                      </div>
                    </div>
                  </DashboardCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerStrategyEngine;
