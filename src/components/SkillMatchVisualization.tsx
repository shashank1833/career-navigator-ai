import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import DashboardCard from "./DashboardCard";
import type { AnalysisSkillGap, AnalysisJobMatch } from "@/types/analysis";

interface Props {
  skillGap: AnalysisSkillGap;
  jobMatch: AnalysisJobMatch;
}

const SkillMatchVisualization = ({ skillGap, jobMatch }: Props) => {
  const total = skillGap.matching.length + skillGap.missing.length;
  const coverage = total > 0 ? Math.round((skillGap.matching.length / total) * 100) : 0;

  const radarData = [
    { skill: "Skills", resume: jobMatch.skillMatch, required: 100 },
    { skill: "Projects", resume: jobMatch.projectRelevance, required: 100 },
    { skill: "Experience", resume: jobMatch.experienceMatch, required: 100 },
    { skill: "Overall", resume: jobMatch.overall, required: 100 },
  ];

  return (
    <div className="space-y-5">
      {/* Coverage Indicator */}
      <DashboardCard title="Skill Coverage" icon={BarChart3} delay={0.1} accentColor="primary">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold gradient-text">{coverage}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {skillGap.matching.length} of {total} required skills matched
              </p>
            </div>
            <div className="w-24 h-24 relative">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-muted" />
                <motion.circle
                  cx="50" cy="50" r="40" fill="none" strokeWidth="8"
                  strokeLinecap="round"
                  stroke="url(#coverageGrad)"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - coverage / 100) }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="coverageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${coverage}%` }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent progress-glow"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Radar Chart */}
      <DashboardCard title="Resume vs Requirements" icon={BarChart3} delay={0.2} accentColor="secondary">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="skill"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <Radar
                name="Required"
                dataKey="required"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted))"
                fillOpacity={0.3}
              />
              <Radar
                name="Your Resume"
                dataKey="resume"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-sm bg-primary/30 border border-primary" />
            Your Resume
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-sm bg-muted/30 border border-muted-foreground" />
            Required
          </div>
        </div>
      </DashboardCard>

      {/* Skill Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Matching */}
        <DashboardCard title="Matching Skills" icon={CheckCircle2} delay={0.3} accentColor="accent">
          <div className="flex flex-wrap gap-1.5">
            {skillGap.matching.map((s) => (
              <Badge key={s} variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                {s}
              </Badge>
            ))}
            {skillGap.matching.length === 0 && (
              <p className="text-xs text-muted-foreground">None detected</p>
            )}
          </div>
        </DashboardCard>

        {/* Missing */}
        <DashboardCard title="Missing Skills" icon={XCircle} delay={0.4} accentColor="primary">
          <div className="flex flex-wrap gap-1.5">
            {skillGap.missing.map((s) => (
              <Badge key={s} variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                {s}
              </Badge>
            ))}
            {skillGap.missing.length === 0 && (
              <p className="text-xs text-muted-foreground">No gaps!</p>
            )}
          </div>
        </DashboardCard>

        {/* Suggested */}
        <DashboardCard title="Suggested Skills" icon={Lightbulb} delay={0.5} accentColor="secondary">
          <div className="flex flex-wrap gap-1.5">
            {skillGap.suggested.map((s) => (
              <Badge key={s} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                {s}
              </Badge>
            ))}
            {skillGap.suggested.length === 0 && (
              <p className="text-xs text-muted-foreground">None suggested</p>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Individual Skill Progress Bars */}
      <DashboardCard title="Match Breakdown" icon={BarChart3} delay={0.6} accentColor="accent">
        <div className="space-y-3">
          {[
            { label: "Skill Match", value: jobMatch.skillMatch },
            { label: "Project Relevance", value: jobMatch.projectRelevance },
            { label: "Experience Match", value: jobMatch.experienceMatch },
            { label: "Overall Match", value: jobMatch.overall },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={`font-bold ${item.value >= 75 ? "text-green-500" : item.value >= 50 ? "text-amber-500" : "text-red-400"}`}>
                  {item.value}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    item.value >= 75 ? "bg-green-500" : item.value >= 50 ? "bg-amber-500" : "bg-red-400"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
};

export default SkillMatchVisualization;
