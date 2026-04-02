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

const DashboardCard = ({ title, icon: Icon, children, className = "" }: DashboardCardProps) => {
  return (
    <div className={`ed-card ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="ed-label">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export default DashboardCard;
