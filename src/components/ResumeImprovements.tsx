import DashboardCard from "./DashboardCard";
import { PenLine, ArrowRight } from "lucide-react";

const improvements = [
  {
    original: "Worked on backend systems using Node.js",
    improved: "Architected and deployed scalable backend microservices using Node.js, serving 50K+ daily requests with 99.9% uptime",
  },
  {
    original: "Built a machine learning model",
    improved: "Developed a gradient-boosted ML model achieving 94% accuracy for customer churn prediction, reducing churn by 18%",
  },
  {
    original: "Managed a team of developers",
    improved: "Led a cross-functional team of 6 engineers, delivering 3 major product features ahead of schedule over 2 quarters",
  },
];

const ResumeImprovements = () => {
  return (
    <DashboardCard title="Resume Improvements" icon={PenLine} delay={0.35} accentColor="accent">
      <div className="space-y-4">
        {improvements.map((item, i) => (
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
