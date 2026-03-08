import DashboardCard from "./DashboardCard";
import { Layers } from "lucide-react";
import { motion } from "framer-motion";

const projects = [
  { name: "Neural Search Engine", algorithm: 90, depth: 85, usefulness: 78, deployment: 60 },
  { name: "E-Commerce Platform", algorithm: 55, depth: 70, usefulness: 92, deployment: 88 },
  { name: "Chat Application", algorithm: 45, depth: 60, usefulness: 75, deployment: 70 },
];

const metrics = ["algorithm", "depth", "usefulness", "deployment"] as const;
const metricLabels: Record<string, string> = {
  algorithm: "Algorithm",
  depth: "Tech Depth",
  usefulness: "Usefulness",
  deployment: "Deploy Ready",
};

const ProjectImpact = () => {
  return (
    <DashboardCard title="Project Impact" icon={Layers} delay={0.45} accentColor="primary">
      <div className="space-y-5">
        {projects.map((p, pi) => (
          <div key={p.name}>
            <p className="text-sm font-medium text-foreground mb-2 code-font">{p.name}</p>
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((m) => (
                <div key={m}>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span>{metricLabels[m]}</span>
                    <span>{p[m]}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p[m]}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + pi * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default ProjectImpact;
