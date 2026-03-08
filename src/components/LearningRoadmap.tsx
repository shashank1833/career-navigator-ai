import DashboardCard from "./DashboardCard";
import { Map, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

const roadmap = {
  goal: "Machine Learning Engineer",
  steps: [
    { title: "Strengthen Python & Data Analysis", desc: "Master NumPy, Pandas, and statistical analysis", done: true },
    { title: "Build ML Projects", desc: "Implement classification, regression, and NLP models", done: false },
    { title: "Learn Model Deployment", desc: "Docker, FastAPI, and model serving with MLflow", done: false },
    { title: "Study ML System Design", desc: "Feature stores, training pipelines, and monitoring", done: false },
  ],
};

const LearningRoadmap = () => {
  return (
    <DashboardCard title="Learning Roadmap" icon={Map} delay={0.65} accentColor="accent" className="col-span-full lg:col-span-2">
      <div className="mb-4">
        <span className="text-xs text-muted-foreground">Goal:</span>
        <span className="ml-2 text-sm font-semibold gradient-text-secondary">{roadmap.goal}</span>
      </div>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
        <div className="space-y-4">
          {roadmap.steps.map((step, i) => (
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
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
};

export default LearningRoadmap;
