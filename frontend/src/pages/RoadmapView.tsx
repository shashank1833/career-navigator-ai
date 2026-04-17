import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, ChevronRight, Clock, Award, BookOpen, CheckCircle2, Circle,
  Loader2, ArrowLeft, Sparkles, ExternalLink, ChevronDown, Star, Wifi, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useRoadmapProgress } from "@/hooks/useRoadmapProgress";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

interface RoadmapStep {
  id: string;
  order: number;
  title: string;
  description: string;
  skills: string[];
  duration: string;
  resources: string[];
}

interface Roadmap {
  id: string;
  title: string;
  description: string;
  career: string;
  domain: string;
  duration: string;
  difficulty: string;
  steps: RoadmapStep[];
}

interface UserProgress {
  roadmap_id: string;
  step_id: string;
  completed: boolean;
}

const DIFF_COLORS: Record<string, string> = {
  "Beginner": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Intermediate": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Advanced": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const RoadmapView = () => {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [restProgress, setRestProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Real-time WebSocket progress for the selected roadmap
  const {
    completedSteps: wsCompletedSteps,
    connected: wsConnected,
    toggleStep: wsToggleStep,
    isStepCompleted: wsIsStepCompleted,
  } = useRoadmapProgress({
    roadmapId: selectedRoadmap?.id || null,
    userId: user?.user_id || user?.id || null,
    enabled: !!selectedRoadmap && !!user,
  });

  // Fetch roadmaps
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/roadmaps`)
      .then((r) => r.json())
      .then((data) => {
        setRoadmaps(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch REST progress for the roadmap list view (overview)
  useEffect(() => {
    if (user) {
      fetch(`${BACKEND_URL}/api/user-progress/${user.user_id || user.id}`)
        .then((r) => r.json())
        .then(setRestProgress)
        .catch(() => {});
    }
  }, [user]);

  // When WS updates come in for the selected roadmap, also update restProgress for the list view
  useEffect(() => {
    if (selectedRoadmap && wsCompletedSteps) {
      setRestProgress((prev) => {
        // Remove old entries for this roadmap
        const filtered = prev.filter((p) => p.roadmap_id !== selectedRoadmap.id);
        // Add current WS completed steps
        const newEntries = wsCompletedSteps.map((stepId) => ({
          roadmap_id: selectedRoadmap.id,
          step_id: stepId,
          completed: true,
        }));
        return [...filtered, ...newEntries];
      });
    }
  }, [wsCompletedSteps, selectedRoadmap]);

  // REST-based helpers for the list view
  const isStepCompletedRest = (roadmapId: string, stepId: string) => {
    return restProgress.some(
      (p) => p.roadmap_id === roadmapId && p.step_id === stepId && p.completed
    );
  };

  const getProgressPercent = (roadmap: Roadmap) => {
    if (!roadmap.steps.length) return 0;
    const completed = roadmap.steps.filter((s) =>
      isStepCompletedRest(roadmap.id, s.id)
    ).length;
    return Math.round((completed / roadmap.steps.length) * 100);
  };

  // For the detail view: use WS when connected, or fall back to REST data
  const isStepCompletedDetail = (stepId: string) => {
    if (user && selectedRoadmap) {
      return wsIsStepCompleted(stepId);
    }
    return false;
  };

  const getDetailProgress = () => {
    if (!selectedRoadmap) return 0;
    const total = selectedRoadmap.steps.length;
    if (!total) return 0;
    const completed = selectedRoadmap.steps.filter((s) => isStepCompletedDetail(s.id)).length;
    return Math.round((completed / total) * 100);
  };

  const handleToggleStep = (stepId: string) => {
    if (!user || !selectedRoadmap) return;
    const isCompleted = isStepCompletedDetail(stepId);
    wsToggleStep(stepId, !isCompleted);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-secondary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!selectedRoadmap ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
                  <Map className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium text-secondary">Learning Paths</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-3">
                  Career <span className="gradient-text">Roadmaps</span>
                </h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Follow step-by-step visual paths to master the skills needed for your dream career.
                </p>
              </div>

              {/* Roadmap Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roadmaps.map((roadmap, i) => {
                  const prog = getProgressPercent(roadmap);
                  return (
                    <motion.button
                      key={roadmap.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => setSelectedRoadmap(roadmap)}
                      whileHover={{ y: -4 }}
                      className="p-6 rounded-2xl glass-card text-left group transition-all hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Map className="w-6 h-6 text-primary" />
                        </div>
                        <Badge variant="outline" className={DIFF_COLORS[roadmap.difficulty] || ""}>
                          {roadmap.difficulty}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{roadmap.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{roadmap.description}</p>
                      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {roadmap.duration}</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {roadmap.steps.length} steps</span>
                        <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {roadmap.career}</span>
                      </div>
                      {user && prog > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-primary font-medium">{prog}%</span>
                          </div>
                          <Progress value={prog} className="h-1.5" />
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Roadmap <ChevronRight className="w-3 h-3" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Back button */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRoadmap(null)}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" /> All Roadmaps
                </Button>
                {/* Real-time connection indicator */}
                {user && (
                  <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                    wsConnected
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : "text-muted-foreground bg-muted/30 border-border/50"
                  }`}>
                    {wsConnected ? (
                      <><Wifi className="w-3 h-3" /> Live sync</>
                    ) : (
                      <><WifiOff className="w-3 h-3" /> Connecting...</>
                    )}
                  </div>
                )}
              </div>

              {/* Roadmap Header */}
              <div className="glass-card p-6 sm:p-8 mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{selectedRoadmap.title}</h1>
                    <p className="text-muted-foreground">{selectedRoadmap.description}</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 ${DIFF_COLORS[selectedRoadmap.difficulty] || ""}`}>
                    {selectedRoadmap.difficulty}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {selectedRoadmap.duration}</span>
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {selectedRoadmap.steps.length} steps</span>
                  <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> {selectedRoadmap.career}</span>
                </div>
                {user && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Your Progress</span>
                      <span className="text-primary font-semibold">{getDetailProgress()}%</span>
                    </div>
                    <Progress value={getDetailProgress()} className="h-2" />
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border/50" />

                <div className="space-y-0">
                  {selectedRoadmap.steps.map((step, i) => {
                    const completed = isStepCompletedDetail(step.id);
                    const isExpanded2 = expandedStep === step.id;
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative pl-16 pb-8"
                      >
                        {/* Timeline node */}
                        <div className="absolute left-4 top-0">
                          <motion.button
                            onClick={() => handleToggleStep(step.id)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              completed
                                ? "bg-primary border-primary text-white"
                                : "bg-background border-border hover:border-primary/50"
                            }`}
                          >
                            {completed && <CheckCircle2 className="w-3 h-3" />}
                          </motion.button>
                        </div>

                        {/* Step card */}
                        <div
                          className={`rounded-xl border transition-all cursor-pointer ${
                            completed
                              ? "bg-primary/5 border-primary/20"
                              : "glass-card hover:border-primary/20"
                          }`}
                        >
                          <button
                            onClick={() => setExpandedStep(isExpanded2 ? null : step.id)}
                            className="w-full p-5 text-left"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-muted-foreground font-medium">Step {step.order}</span>
                                  {completed && (
                                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                <h3 className={`text-base font-semibold mb-1 ${completed ? "text-primary" : "text-foreground"}`}>
                                  {step.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {step.duration}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded2 ? "rotate-180" : ""}`} />
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {isExpanded2 && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 space-y-4 border-t border-border/20 pt-4">
                                  <div>
                                    <p className="text-xs font-medium text-foreground mb-2">Skills You'll Learn</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {step.skills.map((skill) => (
                                        <Badge key={skill} variant="outline" className="text-[10px] bg-background/30">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-foreground mb-2">Recommended Resources</p>
                                    <div className="space-y-1">
                                      {step.resources.map((resource) => (
                                        <div key={resource} className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <ExternalLink className="w-3 h-3 text-primary" />
                                          <span>{resource}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {user && (
                                    <Button
                                      variant={completed ? "outline" : "default"}
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleStep(step.id);
                                      }}
                                      className="gap-2"
                                    >
                                      {completed ? (
                                        <>Mark as Incomplete</>
                                      ) : (
                                        <><CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete</>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Completion node */}
                <div className="relative pl-16">
                  <div className="absolute left-4 top-0">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Star className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                    <p className="text-sm font-semibold text-foreground">Career Ready!</p>
                    <p className="text-xs text-muted-foreground">Complete all steps to master {selectedRoadmap.career}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RoadmapView;
