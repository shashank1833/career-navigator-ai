import { motion } from "framer-motion";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  delay?: number;
  className?: string;
  accentColor?: "primary" | "secondary" | "accent";
}

const accentMap = {
  primary: "glow-text-primary",
  secondary: "glow-text-secondary",
  accent: "glow-text-accent",
};

const DashboardCard = ({ title, icon: Icon, children, delay = 0, className = "", accentColor = "primary" }: DashboardCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-card-hover p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-muted/50">
          <Icon className={`w-5 h-5 ${accentMap[accentColor]}`} />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
};

export default DashboardCard;
