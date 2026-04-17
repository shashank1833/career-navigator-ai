import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, TrendingUp, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

interface SkillEntry {
  skill: string;
  demand_count: number;
  demand_percentage: number;
}

interface SkillGapData {
  covered_skills: SkillEntry[];
  missing_skills: SkillEntry[];
  priority_skills: SkillEntry[];
  recommended_resources: any[];
  coverage_score: number;
}

interface SkillGapChartProps {
  userId?: string;
  resumeSkills?: string[]; // from analyzed resume — merged with roadmap progress on backend
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="flat-card p-2 text-xs">
        <p className="font-medium capitalize">{label}</p>
        <p className="text-primary">{payload[0].value}% job demand</p>
      </div>
    );
  }
  return null;
};

const SkillGapChart = ({ userId, resumeSkills = [] }: SkillGapChartProps) => {
  const navigate = useNavigate();
  const [data, setData] = useState<SkillGapData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${API}/skill-gap/${userId}`, { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Complete some roadmap steps to see your skill gap analysis.
      </div>
    );
  }

  // Build chart data: top 10 missing skills sorted by demand
  const chartData = data.missing_skills.slice(0, 10).map((s) => ({
    skill: s.skill.length > 12 ? s.skill.slice(0, 12) + "..." : s.skill,
    fullSkill: s.skill,
    value: s.demand_percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Skill Coverage</p>
          <p className="text-2xl font-bold text-foreground">{data.coverage_score}%</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p><span className="text-emerald-400 font-medium">{data.covered_skills.length}</span> skills covered</p>
          <p><span className="text-amber-400 font-medium">{data.missing_skills.length}</span> skills missing</p>
        </div>
      </div>

      {/* Missing Skills Chart */}
      {chartData.length > 0 ? (
        <div>
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Top missing skills by job demand
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="skill" width={90} tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(entry) => navigate(`/resources?skill=${entry.fullSkill}`)}
              >
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`hsl(160, 84%, ${Math.max(25, 60 - i * 4)}%)`}
                    opacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-1">Click any bar to find resources for that skill</p>
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No gap data available yet. Add more jobs to the cache.
        </div>
      )}

      {/* Priority Skills */}
      {data.priority_skills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Priority skills to learn next
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.priority_skills.map((s) => (
              <button
                key={s.skill}
                onClick={() => navigate(`/resources?skill=${s.skill}`)}
                className="skill-tag hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
              >
                {s.skill} ({s.demand_percentage}%)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Covered Skills */}
      {data.covered_skills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Skills you have
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.covered_skills.slice(0, 10).map((s) => (
              <span key={s.skill} className="skill-tag text-emerald-400 border-emerald-400/30">
                {s.skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGapChart;
