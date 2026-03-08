import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, CheckCircle, XCircle, Lightbulb, ArrowRight, Copy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardCard from "./DashboardCard";
import type { JobListing, ResumeOptimization } from "@/types/jobs";
import { useToast } from "@/hooks/use-toast";

interface ResumeOptimizerProps {
  job: JobListing;
  optimization: ResumeOptimization | null;
  loading: boolean;
  onBack: () => void;
}

const ResumeOptimizer = ({ job, optimization, loading, onBack }: ResumeOptimizerProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Text copied to clipboard" });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-foreground font-medium">Optimizing your resume for</p>
        <p className="text-primary font-semibold mt-1">{job.title} at {job.company}</p>
        <p className="text-muted-foreground text-xs mt-2">This may take a moment...</p>
      </motion.div>
    );
  }

  if (!optimization) return null;

  const { applicationStrength, optimizedSections, missingSkills } = optimization;
  const scoreColor = applicationStrength.score >= 80 ? "text-accent" : applicationStrength.score >= 60 ? "text-primary" : "text-secondary";

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-semibold text-foreground">{job.title}</h3>
            <p className="text-sm text-primary">{job.company} • {job.location}</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${scoreColor}`}>{applicationStrength.score}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Application Strength</p>
          </div>
        </div>
        <Progress value={applicationStrength.score} className="h-1.5 mt-3" />
      </motion.div>

      {/* Strong & Weak Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DashboardCard title="Strong Areas" icon={CheckCircle} accentColor="accent" delay={0.1}>
          <ul className="space-y-2">
            {applicationStrength.strongAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                {area}
              </li>
            ))}
          </ul>
        </DashboardCard>
        <DashboardCard title="Weak Areas" icon={XCircle} accentColor="secondary" delay={0.15}>
          <ul className="space-y-2">
            {applicationStrength.weakAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <XCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                {area}
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>

      {/* Suggestions */}
      <DashboardCard title="Improvement Suggestions" icon={Lightbulb} accentColor="primary" delay={0.2}>
        <ul className="space-y-2">
          {applicationStrength.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              {s}
            </li>
          ))}
        </ul>
      </DashboardCard>

      {/* Optimized Summary */}
      <DashboardCard title="Optimized Summary" icon={FileText} accentColor="accent" delay={0.25}>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Original</p>
            <p className="text-sm text-muted-foreground">{optimizedSections.summary.original}</p>
          </div>
          <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-primary" /></div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 relative group">
            <p className="text-[10px] uppercase tracking-wider text-primary mb-1">Optimized</p>
            <p className="text-sm text-foreground">{optimizedSections.summary.optimized}</p>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => copyToClipboard(optimizedSections.summary.optimized)}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </DashboardCard>

      {/* Optimized Bullet Points */}
      {optimizedSections.bulletPoints.length > 0 && (
        <DashboardCard title="Optimized Bullet Points" icon={Sparkles} accentColor="primary" delay={0.3}>
          <div className="space-y-4">
            {optimizedSections.bulletPoints.map((bp, i) => (
              <div key={i} className="space-y-2">
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground">{bp.original}</p>
                </div>
                <div className="flex justify-center"><ArrowRight className="w-3 h-3 text-primary" /></div>
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 relative group">
                  <p className="text-xs text-foreground">{bp.optimized}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1.5 right-1.5 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(bp.optimized)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* Skills Optimization */}
      <DashboardCard title="Skills (Reordered for Job)" icon={Sparkles} accentColor="accent" delay={0.35}>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Prioritized Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {optimizedSections.skills.optimized.map((skill) => (
                <Badge key={skill} className="text-[10px] bg-accent/15 text-accent border-accent/30">{skill}</Badge>
              ))}
            </div>
          </div>
          {optimizedSections.skills.added.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Suggested Additions</p>
              <div className="flex flex-wrap gap-1.5">
                {optimizedSections.skills.added.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[10px] border-primary/30 text-primary">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <DashboardCard title="Missing Skills & Learning Paths" icon={Lightbulb} accentColor="secondary" delay={0.4}>
          <div className="space-y-3">
            {missingSkills.map((ms, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{ms.skill}</span>
                  <Badge
                    className={`text-[10px] ${
                      ms.importance === "critical"
                        ? "bg-destructive/15 text-destructive border-destructive/30"
                        : ms.importance === "recommended"
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {ms.importance}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{ms.learningPath}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
  );
};

export default ResumeOptimizer;
