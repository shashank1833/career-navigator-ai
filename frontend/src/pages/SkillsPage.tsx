import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Search, TrendingUp, Zap, Star, Code, Brain,
  Cloud, Users, Loader2, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

interface Skill {
  name: string;
  level: string;
  popularity: number;
}

interface SkillCategory {
  id: string;
  category: string;
  skills: Skill[];
}

const CATEGORY_ICONS: Record<string, any> = {
  "Programming Languages": Code,
  "Frontend Frameworks": Zap,
  "Backend & DevOps": Cloud,
  "Data & AI": Brain,
  "Soft Skills & Business": Users,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Programming Languages": "from-blue-500/20 to-blue-600/5 border-blue-500/20",
  "Frontend Frameworks": "from-purple-500/20 to-purple-600/5 border-purple-500/20",
  "Backend & DevOps": "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  "Data & AI": "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
  "Soft Skills & Business": "from-pink-500/20 to-pink-600/5 border-pink-500/20",
};

const POPULARITY_COLOR = (p: number) => {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 60) return "bg-blue-500";
  if (p >= 40) return "bg-amber-500";
  return "bg-slate-500";
};

const SkillsPage = () => {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/skills-categories`)
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      skills: cat.skills.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.skills.length > 0);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-0 left-1/3 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <BookOpen className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Skills Library</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-3">
            In-Demand <span className="gradient-text">Skills</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Browse trending skills across categories. See popularity and demand to prioritize your learning.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
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
        </motion.div>

        {/* Skill Categories */}
        <div className="space-y-8">
          {filteredCategories.map((cat, ci) => {
            const CatIcon = CATEGORY_ICONS[cat.category] || BookOpen;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <CatIcon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{cat.category}</h2>
                  <span className="text-xs text-muted-foreground ml-auto">{cat.skills.length} skills</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.skills.map((skill, si) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: ci * 0.1 + si * 0.05 }}
                      whileHover={{ y: -3 }}
                      className={`p-5 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[cat.category] || "from-muted/20 to-muted/5 border-border/30"} border transition-all`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground">{skill.name}</h3>
                        {skill.popularity >= 80 && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                            <Star className="w-3 h-3 fill-amber-400" /> Hot
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{skill.level}</p>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Demand</span>
                          <span className="font-medium text-foreground">{skill.popularity}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-background/50 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.popularity}%` }}
                            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${POPULARITY_COLOR(skill.popularity)}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No skills found</h3>
            <p className="text-muted-foreground text-sm">Try a different search term</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SkillsPage;
