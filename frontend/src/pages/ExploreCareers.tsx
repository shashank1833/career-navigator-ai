import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Code, BarChart3, Target, Sparkles, Cloud, Brain,
  Briefcase, Shield, Zap, TrendingUp, Compass, ChevronDown, ChevronUp,
  ExternalLink, BookOpen, Award, X, Flame
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

interface HeatmapSkill {
  skill: string;
  count: number;
  demand_pct: number;
  trending: boolean;
}

const MarketHeatmap = () => {
  const [skills, setSkills] = useState<HeatmapSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/market-heatmap`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setSkills(data.skills || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!skills.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8 flat-card p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-foreground text-sm">Live Market Heatmap</h2>
        <span className="text-xs text-muted-foreground">— skill demand from job postings</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.slice(0, 30).map((s) => {
          const opacity = Math.max(0.2, s.demand_pct / 100);
          return (
            <div
              key={s.skill}
              className="relative skill-tag cursor-default"
              style={{
                backgroundColor: `hsl(160, 84%, 39%, ${opacity})`,
                borderColor: `hsl(160, 84%, 39%, ${opacity * 1.5})`,
                color: s.demand_pct > 50 ? "hsl(160, 30%, 4%)" : "inherit",
              }}
              title={`${s.count} job postings`}
            >
              {s.skill}
              {s.trending && (
                <Flame className="w-2.5 h-2.5 text-amber-400 ml-1 inline" />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Darker = higher demand. <Flame className="w-3 h-3 text-amber-400 inline" /> = trending this week.
      </p>
    </motion.div>
  );
};

interface Career {
  id: string;
  title: string;
  domain: string;
  description: string;
  avg_salary: string;
  demand: string;
  growth_rate: string;
  skills: string[];
  icon: string;
  color: string;
  level: string;
  trending: boolean;
}

const ICON_MAP: Record<string, any> = {
  code: Code, "bar-chart": BarChart3, target: Target, palette: Sparkles,
  server: Cloud, brain: Brain, briefcase: Briefcase, shield: Shield,
  wrench: Target, zap: Zap, cloud: Cloud, megaphone: TrendingUp,
};

const COLOR_MAP: Record<string, string> = {
  blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
  purple: "from-purple-500/20 to-purple-600/5 border-purple-500/30",
  green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
  pink: "from-pink-500/20 to-pink-600/5 border-pink-500/30",
  orange: "from-orange-500/20 to-orange-600/5 border-orange-500/30",
  violet: "from-violet-500/20 to-violet-600/5 border-violet-500/30",
  teal: "from-teal-500/20 to-teal-600/5 border-teal-500/30",
  red: "from-red-500/20 to-red-600/5 border-red-500/30",
  slate: "from-slate-500/20 to-slate-600/5 border-slate-500/30",
  yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30",
  cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30",
  amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
};

const ICON_COLOR_MAP: Record<string, string> = {
  blue: "text-blue-400", purple: "text-purple-400", green: "text-emerald-400",
  pink: "text-pink-400", orange: "text-orange-400", violet: "text-violet-400",
  teal: "text-teal-400", red: "text-red-400", slate: "text-slate-400",
  yellow: "text-yellow-400", cyan: "text-cyan-400", amber: "text-amber-400",
};

const DOMAINS = ["All", "IT", "Core", "Business"];

const DEMAND_COLORS: Record<string, string> = {
  "Very High": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "High": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Medium": "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const ExploreCareers = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (domain !== "All") params.set("domain", domain);
    if (search) params.set("search", search);

    fetch(`${BACKEND_URL}/api/careers?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setCareers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [domain, search]);

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Compass className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Career Explorer</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-3">
            Explore <span className="gradient-text">Careers</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover careers across domains, compare salaries, and find the perfect path for your ambitions.
          </p>
        </motion.div>

        {/* Market Heatmap */}
        <MarketHeatmap />

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search careers, skills, or domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-card/50 border-border/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {DOMAINS.map((d) => (
              <Button
                key={d}
                variant={domain === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDomain(d)}
                className={`rounded-lg px-4 ${
                  domain === d
                    ? "bg-primary text-primary-foreground"
                    : "border-border/50 hover:bg-muted/30"
                }`}
              >
                {d}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${careers.length} career${careers.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Career Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {careers.map((career, i) => {
              const IconComp = ICON_MAP[career.icon] || Compass;
              const isExpanded = expandedId === career.id;
              return (
                <motion.div
                  key={career.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`relative rounded-2xl bg-gradient-to-br ${COLOR_MAP[career.color] || COLOR_MAP.blue} border transition-all overflow-hidden`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center ${ICON_COLOR_MAP[career.color] || "text-primary"}`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div className="flex gap-2">
                        {career.trending && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                            <TrendingUp className="w-2.5 h-2.5" /> Trending
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-background/30 text-xs text-muted-foreground">
                          {career.domain}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-1.5">{career.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{career.description}</p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-background/30">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Salary Range</p>
                        <p className="text-xs font-semibold text-foreground">{career.avg_salary}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background/30">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Demand</p>
                        <Badge variant="outline" className={`text-[10px] ${DEMAND_COLORS[career.demand] || ""}`}>
                          {career.demand}
                        </Badge>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : career.id)}
                      className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                    >
                      {isExpanded ? "Show Less" : "View Skills & Details"}
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-border/20"
                      >
                        <div className="p-6 pt-4 space-y-4">
                          <div>
                            <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" /> Required Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {career.skills.map((skill) => (
                                <Badge key={skill} variant="outline" className="text-[10px] bg-background/30">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2.5 rounded-lg bg-background/30">
                              <p className="text-[10px] text-muted-foreground mb-0.5">Growth Rate</p>
                              <p className="text-sm font-bold text-emerald-400">{career.growth_rate}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-background/30">
                              <p className="text-[10px] text-muted-foreground mb-0.5">Level</p>
                              <p className="text-sm font-semibold text-foreground">{career.level}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {!loading && careers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No careers found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ExploreCareers;
