import DashboardCard from "./DashboardCard";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { AnalysisWeakness } from "@/types/analysis";

const WeaknessDetector = ({ data }: { data: AnalysisWeakness[] }) => {
  return (
    <DashboardCard title="Weakness Detector" icon={AlertTriangle} delay={0.6} accentColor="secondary">
      <div className="space-y-3">
        {data.map((w, i) => (
          <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/50">
            <p className="text-sm text-destructive/90 font-medium mb-1">{w.issue}</p>
            <div className="flex items-start gap-1.5">
              <ArrowRight className="w-3 h-3 mt-0.5 glow-text-accent shrink-0" />
              <p className="text-xs text-muted-foreground">{w.fix}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default WeaknessDetector;
