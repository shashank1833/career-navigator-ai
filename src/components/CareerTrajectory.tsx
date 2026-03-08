import DashboardCard from "./DashboardCard";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const careers = [
  { role: "Backend Engineer", match: 85, skills: ["System Design", "Distributed Systems", "API Design"] },
  { role: "ML Engineer", match: 72, skills: ["PyTorch", "MLOps", "Feature Engineering"] },
  { role: "Cloud Engineer", match: 68, skills: ["Terraform", "Networking", "Security"] },
];

const CareerTrajectory = () => {
  return (
    <DashboardCard title="Career Trajectory" icon={TrendingUp} delay={0.5} accentColor="secondary">
      <div className="space-y-4">
        {careers.map((c, i) => (
          <div key={c.role} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">{c.role}</span>
              <span className="text-sm font-bold gradient-text">{c.match}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c.match}%` }}
                transition={{ duration: 1, delay: 0.6 + i * 0.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {c.skills.map((s) => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default CareerTrajectory;
