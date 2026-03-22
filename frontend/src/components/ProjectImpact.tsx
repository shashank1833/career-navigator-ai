import DashboardCard from "./DashboardCard";
import { Layers, Star, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import type { AnalysisProjectImpact } from "@/types/analysis";

const metrics = ["algorithm", "depth", "usefulness", "deployment"] as const;
const metricLabels: Record<string, string> = {
  algorithm: "Algorithm",
  depth: "Tech Depth",
  usefulness: "Usefulness",
  deployment: "Deploy Ready",
};

const getOverallScore = (p: AnalysisProjectImpact) =>
  Math.round((p.algorithm + p.depth + p.usefulness + p.deployment) / 4);

const getTopMetric = (p: AnalysisProjectImpact) => {
  const scores = metrics.map((m) => ({ key: m, value: p[m] }));
  return scores.reduce((a, b) => (b.value > a.value ? b : a));
};

const ProjectImpact = ({ data }: { data: AnalysisProjectImpact[] }) => {
  const bestProject = data.reduce((best, p) =>
    getOverallScore(p) > getOverallScore(best) ? p : best
  , data[0]);

  return (
    <DashboardCard title="Project Impact" icon={Layers} delay={0.45} accentColor="primary">
      <div className="space-y-5">
        {/* Highlight: Best Project */}
        {data.length > 1 && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Top Project</p>
              <p className="text-sm font-semibold text-foreground">{bestProject.name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-primary">{getOverallScore(bestProject)}%</p>
              <p className="text-[10px] text-muted-foreground">Overall</p>
            </div>
          </div>
        )}

        {data.map((p, pi) => {
          const overall = getOverallScore(p);
          const top = getTopMetric(p);
          return (
            <div key={p.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground code-font flex items-center gap-1.5">
                  {p === bestProject && data.length > 1 && <Star className="w-3.5 h-3.5 text-primary" />}
                  {p.name}
                </p>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {overall}%
                </span>
              </div>
              {/* Highlight: Strongest area */}
              <div className="text-[11px] text-muted-foreground">
                Strongest: <span className="text-foreground font-medium">{metricLabels[top.key]}</span> at <span className="text-primary font-medium">{top.value}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {metrics.map((m) => (
                  <div key={m}>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span>{metricLabels[m]}</span>
                      <span>{p[m]}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p[m]}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + pi * 0.1 }}
                        className={`h-full rounded-full ${m === top.key ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted-foreground/30'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
};

export default ProjectImpact;
