import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, DollarSign, Target, Loader2, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

interface SalaryInsights {
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  sample_count: number;
  top_companies: { company: string; count: number }[];
  role: string;
  location: string;
}

interface MarketInsightsProps {
  userSkills?: string[];
}

const CITIES = ["United States", "New York", "San Francisco", "Seattle", "Austin", "Boston", "Chicago", "Los Angeles", "Remote"];

const formatSalary = (n: number) => {
  if (!n) return "$0";
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
};

const SalaryRangeBar = ({ min, p25, median, p75, max }: { min: number; p25: number; median: number; p75: number; max: number }) => {
  const range = max - min;
  if (!range) return null;
  const pct = (v: number) => ((v - min) / range) * 100;

  return (
    <div className="mt-4">
      <div className="relative h-6 bg-muted/30 rounded-full overflow-hidden">
        {/* IQR bar */}
        <div
          className="absolute h-full bg-primary/30 rounded-full"
          style={{ left: `${pct(p25)}%`, width: `${pct(p75) - pct(p25)}%` }}
        />
        {/* Median line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary"
          style={{ left: `${pct(median)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 salary-number">
        <span>{formatSalary(min)}</span>
        <span className="text-primary font-medium">{formatSalary(median)} median</span>
        <span>{formatSalary(max)}</span>
      </div>
      <div className="flex justify-center gap-4 text-[10px] text-muted-foreground mt-2">
        <span>P25: <span className="salary-number">{formatSalary(p25)}</span></span>
        <span>P75: <span className="salary-number">{formatSalary(p75)}</span></span>
      </div>
    </div>
  );
};

const MarketInsights = ({ userSkills = [] }: MarketInsightsProps) => {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("United States");
  const [loading, setLoading] = useState(false);
  const [salaryData, setSalaryData] = useState<SalaryInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSalary = async () => {
    if (!role.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ role: role.trim(), location });
      const res = await fetch(`${API}/salary-insights?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch salary data");
      const data = await res.json();
      setSalaryData(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const companyChartData = (salaryData?.top_companies || []).map((c) => ({
    name: c.company.length > 15 ? c.company.slice(0, 15) + "..." : c.company,
    value: c.count,
  }));

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Role (e.g., Software Engineer)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchSalary()}
          className="flex-1"
        />
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={fetchSalary} disabled={!role.trim() || loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Analyze
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!salaryData && !loading && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Enter a role and location to see salary intelligence.
        </div>
      )}

      {salaryData && (
        <div className="space-y-5">
          {/* Salary Range */}
          <div className="flat-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">
                Salary Range — {salaryData.role}
              </h3>
              {salaryData.location && (
                <span className="text-xs text-muted-foreground">• {salaryData.location}</span>
              )}
            </div>

            {salaryData.sample_count > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold salary-number text-foreground">{formatSalary(salaryData.p25)}</p>
                    <p className="text-xs text-muted-foreground">25th percentile</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold salary-number text-primary">{formatSalary(salaryData.median)}</p>
                    <p className="text-xs text-muted-foreground">Median</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold salary-number text-foreground">{formatSalary(salaryData.p75)}</p>
                    <p className="text-xs text-muted-foreground">75th percentile</p>
                  </div>
                </div>

                <SalaryRangeBar
                  min={salaryData.min}
                  p25={salaryData.p25}
                  median={salaryData.median}
                  p75={salaryData.p75}
                  max={salaryData.max}
                />

                <p className="text-xs text-muted-foreground mt-3">
                  Based on <span className="salary-number font-medium">{salaryData.sample_count}</span> job postings
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No salary data available for this role yet. Job cache may need to refresh.
              </p>
            )}
          </div>

          {/* Top Companies */}
          {companyChartData.length > 0 && (
            <div className="flat-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Top Hiring Companies</h3>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={companyChartData} margin={{ left: -10, right: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--card-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {companyChartData.map((_, i) => (
                      <Cell key={i} fill={`hsl(160, 84%, ${50 - i * 5}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketInsights;
