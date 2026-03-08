import DashboardCard from "./DashboardCard";
import { Target } from "lucide-react";
import { motion } from "framer-motion";

const scores = [
  { label: "Skill Match", value: 78, color: "from-primary to-accent" },
  { label: "Project Relevance", value: 65, color: "from-secondary to-primary" },
  { label: "Experience Match", value: 82, color: "from-accent to-primary" },
  { label: "Overall Match", value: 75, color: "from-primary via-secondary to-accent" },
];

const CircularScore = ({ value, label, delay }: { value: number; label: string; delay: number }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <motion.circle
            cx="40" cy="40" r={radius} fill="none"
            stroke="url(#grad)" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, delay, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
};

const JobMatchScore = () => {
  return (
    <DashboardCard title="Job Match Score" icon={Target} delay={0.3} accentColor="primary">
      <div className="grid grid-cols-2 gap-6">
        {scores.map((s, i) => (
          <CircularScore key={s.label} value={s.value} label={s.label} delay={0.4 + i * 0.15} />
        ))}
      </div>
    </DashboardCard>
  );
};

export default JobMatchScore;
