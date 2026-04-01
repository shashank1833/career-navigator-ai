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
  saved: "hsl(217, 91%, 60%)",
  applied: "hsl(263, 70%, 50%)",
  interview: "hsl(187, 92%, 49%)",
  offer: "hsl(142, 71%, 45%)",
  rejected: "hsl(0, 84%, 60%)",
};

const tooltipStyle = {
  background: "hsl(217,33%,14%)",
  border: "1px solid hsl(217,33%,20%)",
  borderRadius: 8,
  fontSize: 12,
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

  if (applications.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <h4 className="text-sm font-semibold text-foreground mb-1">No insights yet</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
          Once you start applying to jobs, you'll see a breakdown of your application pipeline and match score distribution here.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate("/analyze")} className="gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Start Analyzing
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <PieChartIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">Application Pipeline</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
              {statusData.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#888"} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "hsl(210,40%,98%)" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {statusData.map((s) => (
            <div key={s.name} className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />
              <span className="text-muted-foreground capitalize">{s.name} ({s.value})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">Match Score Distribution</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={matchScoreDistribution}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(215,20%,65%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(215,20%,65%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "hsl(210,40%,98%)" }} />
            <Bar dataKey="count" fill="hsl(217,91%,60%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
