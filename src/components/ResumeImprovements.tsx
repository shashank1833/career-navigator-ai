import DashboardCard from "./DashboardCard";
import { PenLine, ArrowRight, Lightbulb } from "lucide-react";
import type { AnalysisImprovement } from "@/types/analysis";

const ResumeImprovements = ({ data }: { data: AnalysisImprovement[] }) => {
  return (
    <DashboardCard title="Resume Improvements" icon={PenLine} delay={0.35} accentColor="accent">
      <div className="space-y-5">
        {data.map((item, i) => (
          <div key={i} className="space-y-2">
            <p className="text-xs text-muted-foreground line-through decoration-destructive/40">{item.original}</p>
            
            {/* Main suggestion */}
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-1 glow-text-accent shrink-0" />
              <p className="text-sm text-foreground/90">{item.improved}</p>
            </div>

            {/* Alternative suggestions */}
            {item.alternatives && item.alternatives.length > 0 && (
              <div className="ml-5 space-y-1.5 border-l-2 border-border/40 pl-3">
                {item.alternatives.map((alt, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <Lightbulb className="w-3 h-3 mt-0.5 text-amber-400/70 shrink-0" />
                    <p className="text-xs text-foreground/70">{alt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default ResumeImprovements;
