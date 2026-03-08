import DashboardCard from "./DashboardCard";
import { Map, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import type { AnalysisRoadmap } from "@/types/analysis";

const LearningRoadmap = ({ data }: { data: AnalysisRoadmap }) => {
  return (
    <DashboardCard title="Learning Roadmap" icon={Map} delay={0.65} accentColor="accent" className="col-span-full lg:col-span-2">
      <div className="mb-4">
        <span className="text-xs text-muted-foreground">Goal:</span>
        <span className="ml-2 text-sm font-semibold gradient-text-secondary">{data.goal}</span>
      </div>
      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
        <div className="space-y-4">
          {data.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="flex items-start gap-4 relative"
            >
              <div className="z-10 shrink-0 mt-0.5">
                {step.done ? (
                  <CheckCircle2 className="w-6 h-6 glow-text-accent" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50 flex-1">
                <p className="text-sm font-medium text-foreground">Step {i + 1} — {step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
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
          ))}
        </div>
      </div>
    </DashboardCard>
  );
};

export default LearningRoadmap;
