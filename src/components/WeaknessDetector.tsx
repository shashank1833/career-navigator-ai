import DashboardCard from "./DashboardCard";
import { AlertTriangle, ArrowRight } from "lucide-react";

const weaknesses = [
  { issue: "No system design experience mentioned", fix: "Add a section highlighting distributed system work or coursework" },
  { issue: "Too many technologies listed without depth", fix: "Focus on 5-6 core technologies and demonstrate proficiency with project examples" },
  { issue: "Projects lack measurable outcomes", fix: "Add metrics like response time improvements, user growth, or cost savings" },
  { issue: "Missing leadership or collaboration signals", fix: "Highlight team projects, mentoring, or cross-functional work" },
];

const WeaknessDetector = () => {
  return (
    <DashboardCard title="Weakness Detector" icon={AlertTriangle} delay={0.6} accentColor="secondary">
      <div className="space-y-3">
        {weaknesses.map((w, i) => (
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
