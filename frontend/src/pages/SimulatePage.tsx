import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, ChevronDown, ChevronUp, Clock, BookOpen, Briefcase, Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

interface Milestone {
  milestone: number;
  month_range: string;
  title: string;
  skills_to_learn: string[];
  actions: string[];
  job_tier: string;
  estimated_hours: number;
}

interface TrajectoryPlan {
  milestones: Milestone[];
  current_role: string;
  target_role: string;
  user_skills: string[];
  target_skills: string[];
}

const TIMELINE_OPTIONS = [
  { label: "6 months", value: 6, description: "Accelerated sprint" },
  { label: "12 months", value: 12, description: "Balanced pace" },
  { label: "24 months", value: 24, description: "Thorough transition" },
];

const MILESTONE_COLORS = [
  "bg-primary/10 border-primary/30 text-primary",
  "bg-secondary/10 border-secondary/30 text-secondary",
  "bg-accent/10 border-accent/30 text-accent",
  "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
  "bg-amber-500/10 border-amber-500/30 text-amber-500",
  "bg-rose-500/10 border-rose-500/30 text-rose-500",
];

const SimulatePage = () => {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [timeline, setTimeline] = useState(12);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TrajectoryPlan | null>(null);
  const [error, setError] = useState("");
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(0);

  const simulate = async () => {
    if (!currentRole || !targetRole || !user?.user_id) return;
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const res = await fetch(`${API}/simulate-trajectory`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          current_role: currentRole,
          target_role: targetRole,
          timeline_months: timeline,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate plan");
      const data = await res.json();
      setPlan(data);
    } catch (e: any) {
      setError(e.message || "Failed to generate simulation");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Career Trajectory Simulator</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Get a personalized month-by-month action plan for your career transition, powered by AI.
        </p>
      </motion.div>

      {/* Configuration */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flat-card p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <Input
              placeholder="e.g., Frontend Developer"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Target Role</Label>
            <Input
              placeholder="e.g., Machine Learning Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <Label className="mb-3 block">Timeline</Label>
          <div className="grid grid-cols-3 gap-3">
            {TIMELINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeline(opt.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  timeline === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-border/80 text-foreground"
                }`}
              >
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={simulate}
          disabled={!currentRole || !targetRole || loading}
          className="w-full sm:w-auto gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating Plan...</>
          ) : (
            <><Zap className="w-4 h-4" /> Simulate Trajectory</>
          )}
        </Button>

        {error && <p className="text-destructive text-sm mt-3">{error}</p>}
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Summary */}
            <div className="flat-card p-5 mb-6">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-foreground">{plan.current_role}</span>
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">{plan.target_role}</span>
                <span className="text-muted-foreground">in {timeline} months</span>
              </div>
              {plan.user_skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">Your skills:</span>
                  {plan.user_skills.slice(0, 8).map((s) => (
                    <span key={s} className="skill-tag">{s}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="mb-3">
              <h2 className="text-base font-semibold text-foreground mb-4">Your Action Plan</h2>

              {/* Horizontal progress bar */}
              <div className="hidden sm:flex items-center gap-0 mb-6 overflow-x-auto pb-2">
                {plan.milestones.map((m, i) => (
                  <div key={i} className="flex items-center flex-shrink-0">
                    <button
                      onClick={() => setExpandedMilestone(expandedMilestone === i ? null : i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        expandedMilestone === i
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/40 text-muted-foreground"
                      }`}
                    >
                      {m.month_range}
                    </button>
                    {i < plan.milestones.length - 1 && (
                      <div className="w-8 h-px bg-border mx-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Milestone Cards */}
              <div className="space-y-3">
                {plan.milestones.map((m, i) => {
                  const colorClass = MILESTONE_COLORS[i % MILESTONE_COLORS.length];
                  const isExpanded = expandedMilestone === i;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flat-card overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedMilestone(isExpanded ? null : i)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorClass}`}>
                            {m.milestone}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground text-sm">{m.title}</p>
                            <p className="text-xs text-muted-foreground">{m.month_range}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            <Briefcase className="w-3 h-3 inline mr-1" />
                            {m.job_tier}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border px-4 pb-4"
                          >
                            <div className="grid sm:grid-cols-3 gap-4 pt-4">
                              {/* Skills */}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" /> Skills to Learn
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {m.skills_to_learn.map((s) => (
                                    <span key={s} className="skill-tag">{s}</span>
                                  ))}
                                </div>
                              </div>

                              {/* Actions */}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                  <Target className="w-3 h-3" /> Actions
                                </p>
                                <ul className="space-y-1">
                                  {m.actions.map((a, ai) => (
                                    <li key={ai} className="text-xs text-foreground flex items-start gap-1.5">
                                      <span className="text-primary mt-0.5">•</span>
                                      {a}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Outcome */}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Outcome
                                </p>
                                <p className="text-xs text-foreground">
                                  Access to: <span className="text-primary font-medium">{m.job_tier}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  ~{m.estimated_hours}h total investment
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimulatePage;
