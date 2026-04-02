import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, PieChart as PieChartIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { JobApplication } from "@/hooks/useJobApplications";

interface DashboardChartsProps {
  applications: JobApplication[];
}

const STATUS_COLORS: Record<string, string> = {
  saved: "#0F9B72",
  applied: "#6B6B67",
  interview: "#D97706",
  offer: "#0F9B72",
  rejected: "#DC2626",
};

const tooltipStyle = {
  background: "#FFFFFF",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "'DM Sans', sans-serif",
  color: "#1A1A18",
};

const DashboardCharts = ({ applications }: DashboardChartsProps) => {
  const navigate = useNavigate();

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [applications]);

  const matchScoreDistribution = useMemo(() => {
    const buckets = [
      { range: "0-25", min: 0, max: 25, count: 0 },
      { range: "26-50", min: 26, max: 50, count: 0 },
      { range: "51-75", min: 51, max: 75, count: 0 },
      { range: "76-100", min: 76, max: 100, count: 0 },
    ];
    applications.forEach((a) => {
      const bucket = buckets.find((b) => a.match_score >= b.min && a.match_score <= b.max);
      if (bucket) bucket.count++;
    });
    return buckets.map((b) => ({ name: b.range, count: b.count }));
  }, [applications]);

  const maxCount = Math.max(...matchScoreDistribution.map(d => d.count), 1);

  if (applications.length === 0) {
    return (
      <div className="ed-card text-center py-12">
        <div className="p-3 rounded-[10px] bg-muted w-fit mx-auto mb-4">
          <BarChart3 className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h4 className="text-[13px] font-semibold text-foreground mb-1">No insights yet</h4>
        <p className="text-[12px] text-muted-foreground max-w-sm mx-auto mb-4">
          Once you start applying to jobs, you'll see a breakdown of your application pipeline and match score distribution here.
        </p>
        <button onClick={() => navigate("/analyze")} className="ed-btn">
          <Sparkles className="w-3.5 h-3.5" /> Start Analyzing
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="ed-card">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
          <p className="ed-label">Application Pipeline</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} strokeWidth={0}>
              {statusData.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#E5E5E3"} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {statusData.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />
              <span className="text-muted-foreground capitalize">{s.name} ({s.value})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ed-card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
          <p className="ed-label">Match Score Distribution</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={matchScoreDistribution}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6B6B67", fontFamily: "'DM Mono', monospace" }}
              axisLine={{ stroke: "#E5E5E3", strokeWidth: 0.5 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B6B67", fontFamily: "'DM Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {matchScoreDistribution.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.count === maxCount ? "#0F9B72" : "#E5E5E3"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
