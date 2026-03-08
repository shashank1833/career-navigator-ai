import DashboardCard from "./DashboardCard";
import { PenLine, ArrowRight } from "lucide-react";
import type { AnalysisImprovement } from "@/types/analysis";

const ResumeImprovements = ({ data }: { data: AnalysisImprovement[] }) => {
  return (
    <DashboardCard title="Resume Improvements" icon={PenLine} delay={0.35} accentColor="accent">
      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={i} className="space-y-1.5">
            <p className="text-xs text-muted-foreground line-through decoration-destructive/40">{item.original}</p>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-1 glow-text-accent shrink-0" />
              <p className="text-sm text-foreground/90">{item.improved}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default ResumeImprovements;
