import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Zap, DollarSign, Target, AlertTriangle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface MarketData {
  totalJobsAnalyzed: number;
  searchTerm: string;
  skillDemand: { skill: string; count: number; percentage: number }[];
  technologyCategories: { category: string; skills: { skill: string; count: number; percentage: number; demand: string }[] }[];
  salaryInsights: {
    average: number;
    median: number;
    min: number;
    max: number;
    sampleSize: number;
    distribution: { range: string; count: number }[];
  } | null;
  skillGap: {
    matching: { skill: string; demandPercentage: number; userHas: boolean }[];
    missing: { skill: string; demandPercentage: number; userHas: boolean }[];
    coverageScore: number;
  };
  emergingSkills: { skill: string; percentage: number; trend: string }[];
}

interface MarketInsightsProps {
  userSkills?: string[];
}

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(263, 70%, 50%)",
  "hsl(187, 92%, 49%)",
  "hsl(142, 71%, 45%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
];

const DEMAND_COLORS: Record<string, string> = {
  High: "hsl(142, 71%, 45%)",
  Medium: "hsl(45, 93%, 47%)",
  Emerging: "hsl(187, 92%, 49%)",
};

const tooltipStyle = {
  background: "hsl(217,33%,14%)",
  border: "1px solid hsl(217,33%,20%)",
  borderRadius: 8,
  fontSize: 12,
};

const MarketInsights = ({ userSkills = [] }: MarketInsightsProps) => {
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MarketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeMarket = async () => {
    if (!jobTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("analyze-market", {
        body: { jobTitle: jobTitle.trim(), userSkills },
      });
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze market data");
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (val: number) => {
    if (val >= 1000) return `$${Math.round(val / 1000)}k`;
    return `$${val}`;
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Enter a job title (e.g. Backend Engineer, Data Scientist)"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeMarket()}
              className="bg-muted/50 border-border"
            />
            <Button onClick={analyzeMarket} disabled={loading || !jobTitle.trim()} className="shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Analyze
            </Button>
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing {jobTitle} job market...</p>
        </div>
      )}

      {data && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Summary */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{data.totalJobsAnalyzed} jobs analyzed</Badge>
            <span>for "{data.searchTerm}"</span>
          </div>

          {/* Top Skills Demand */}
          <Card className="bg-card/80 backdrop-blur border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Top Skills in Demand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(300, data.skillDemand.slice(0, 15).length * 32)}>
                <BarChart data={data.skillDemand.slice(0, 15)} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(215,20%,65%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="skill" tick={{ fontSize: 12, fill: "hsl(210,40%,98%)" }} axisLine={false} tickLine={false} width={75} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "hsl(210,40%,98%)" }} formatter={(val: number) => [`${val}%`, "Demand"]} />
                  <Bar dataKey="percentage" fill="hsl(217,91%,60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technology Categories */}
            <Card className="bg-card/80 backdrop-blur border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  Technology Stack Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.technologyCategories.slice(0, 5).map((cat) => (
                  <div key={cat.category}>
                    <h4 className="text-sm font-medium text-foreground mb-2">{cat.category}</h4>
                    <div className="space-y-1.5">
                      {cat.skills.slice(0, 5).map((s) => (
                        <div key={s.skill} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-24 truncate capitalize">{s.skill}</span>
                          <Progress value={s.percentage} className="h-2 flex-1" />
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 shrink-0"
                            style={{ borderColor: DEMAND_COLORS[s.demand], color: DEMAND_COLORS[s.demand] }}
                          >
                            {s.demand}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Salary Insights */}
            <Card className="bg-card/80 backdrop-blur border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Salary Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.salaryInsights ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Average</p>
                        <p className="text-lg font-bold text-foreground">{formatSalary(data.salaryInsights.average)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Median</p>
                        <p className="text-lg font-bold text-foreground">{formatSalary(data.salaryInsights.median)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Range</p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatSalary(data.salaryInsights.min)} – {formatSalary(data.salaryInsights.max)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sample</p>
                        <p className="text-lg font-bold text-foreground">{data.salaryInsights.sampleSize} jobs</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={data.salaryInsights.distribution}>
                        <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(215,20%,65%)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(215,20%,65%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "hsl(210,40%,98%)" }} />
                        <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No salary data available for this search.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Skill Gap Comparison */}
          <Card className="bg-card/80 backdrop-blur border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-secondary" />
                Skill Gap vs Market Demand
                <Badge variant="outline" className="ml-auto text-xs">
                  Coverage: {data.skillGap.coverageScore}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Upload a resume to see skill gap analysis.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-green-500 mb-3 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" /> Your Matching Skills
                    </h4>
                    <div className="space-y-1.5">
                      {data.skillGap.matching.length > 0 ? data.skillGap.matching.map((s) => (
                        <div key={s.skill} className="flex items-center justify-between text-sm">
                          <span className="text-foreground capitalize">{s.skill}</span>
                          <span className="text-muted-foreground text-xs">{s.demandPercentage}% demand</span>
                        </div>
                      )) : <p className="text-xs text-muted-foreground">No matching skills found.</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Missing High-Demand Skills
                    </h4>
                    <div className="space-y-1.5">
                      {data.skillGap.missing.length > 0 ? data.skillGap.missing.map((s) => (
                        <div key={s.skill} className="flex items-center justify-between text-sm">
                          <span className="text-foreground capitalize">{s.skill}</span>
                          <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                            {s.demandPercentage}% demand
                          </Badge>
                        </div>
                      )) : <p className="text-xs text-muted-foreground">Great! You cover all high-demand skills.</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emerging Trends */}
          <Card className="bg-card/80 backdrop-blur border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Emerging Skill Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.emergingSkills.map((s) => (
                  <div key={s.skill} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                    <span className="text-sm text-foreground capitalize flex-1">{s.skill}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0"
                      style={{
                        borderColor: s.trend === "Growing demand" ? "hsl(142,71%,45%)" : s.trend === "Rapid growth" ? "hsl(45,93%,47%)" : "hsl(187,92%,49%)",
                        color: s.trend === "Growing demand" ? "hsl(142,71%,45%)" : s.trend === "Rapid growth" ? "hsl(45,93%,47%)" : "hsl(187,92%,49%)",
                      }}
                    >
                      {s.trend}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MarketInsights;
