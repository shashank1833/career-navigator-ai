import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const DashboardCharts = ({ applications }: DashboardChartsProps) => {
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
      <div className="text-center py-8 text-muted-foreground text-sm">
        No application data yet. Start applying to jobs to see insights here.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#888"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(217,33%,14%)", border: "1px solid hsl(217,33%,20%)", borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: "hsl(210,40%,98%)" }}
              />
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
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Match Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={matchScoreDistribution}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(215,20%,65%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215,20%,65%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(217,33%,14%)", border: "1px solid hsl(217,33%,20%)", borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: "hsl(210,40%,98%)" }}
              />
              <Bar dataKey="count" fill="hsl(217,91%,60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
