import DashboardCard from "./DashboardCard";
import { Github, Star, GitFork } from "lucide-react";
import { motion } from "framer-motion";
import type { AnalysisGitHub } from "@/types/analysis";

const langColors: Record<string, string> = {
  TypeScript: "bg-primary",
  JavaScript: "bg-primary",
  Python: "bg-secondary",
  Go: "bg-accent",
  Java: "bg-destructive",
  Rust: "bg-destructive",
  C: "bg-muted-foreground",
  "C++": "bg-muted-foreground",
  Ruby: "bg-destructive",
  Other: "bg-muted-foreground",
};

const GitHubAnalyzer = ({ data }: { data: AnalysisGitHub }) => {
  return (
    <DashboardCard title="GitHub Analysis" icon={Github} delay={0.55} accentColor="primary">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">@{data.username}</p>
            <p className="text-xs text-muted-foreground">{data.repos} repositories · {data.activity} activity</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold gradient-text">{data.devScore}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dev Score</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Languages</p>
          <div className="h-2 rounded-full overflow-hidden flex">
            {data.languages.map((l) => (
              <motion.div
                key={l.name}
                initial={{ width: 0 }}
                animate={{ width: `${l.pct}%` }}
                transition={{ duration: 1, delay: 0.7 }}
                className={`h-full ${langColors[l.name] || "bg-muted"}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {data.languages.map((l) => (
              <span key={l.name} className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${langColors[l.name] || "bg-muted"}`} /> {l.name} {l.pct}%
              </span>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Strongest Project</p>
          <p className="text-sm font-medium text-foreground code-font">{data.topProject.name}</p>
          <div className="flex gap-3 mt-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> {data.topProject.stars}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><GitFork className="w-3 h-3" /> {data.topProject.forks}</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default GitHubAnalyzer;
