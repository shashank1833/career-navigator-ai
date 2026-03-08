import DashboardCard from "./DashboardCard";
import { BarChart3, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const data = {
  required: ["React", "TypeScript", "Node.js", "AWS", "Kubernetes", "System Design", "CI/CD"],
  have: ["React", "TypeScript", "Node.js", "AWS", "CI/CD"],
  missing: ["Kubernetes", "System Design"],
  suggested: ["Terraform", "Microservices", "Load Balancing"],
};

const SkillGapChart = () => {
  return (
    <DashboardCard title="Skill Gap Analysis" icon={BarChart3} delay={0.2} accentColor="secondary">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 glow-text-accent" /> Matching Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.have.map((s) => (
              <span key={s} className="px-2 py-0.5 text-xs rounded bg-accent/10 text-accent border border-accent/20">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-destructive" /> Missing Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.missing.map((s) => (
              <span key={s} className="px-2 py-0.5 text-xs rounded bg-destructive/10 text-destructive border border-destructive/20">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3 glow-text-primary" /> Suggested to Learn
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.suggested.map((s) => (
              <span key={s} className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary border border-primary/20">{s}</span>
            ))}
          </div>
        </div>
        {/* Visual bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Skill Coverage</span>
            <span>71%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "71%" }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent progress-glow"
            />
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default SkillGapChart;
