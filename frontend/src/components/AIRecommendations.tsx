import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Loader2, Sparkles, Target, TrendingUp, DollarSign,
  BookOpen, ChevronRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

interface Recommendation {
  title: string;
  match_score: number;
  reason: string;
  skills_to_develop: string[];
  salary_range: string;
}

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "lead", label: "Lead / Principal" },
];

const AIRecommendations = () => {
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [expLevel, setExpLevel] = useState("entry");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai-recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
          experience_level: expLevel,
        }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch {
      setRecommendations([]);
    }
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI Career Recommendations</h3>
            <p className="text-xs text-muted-foreground">Get personalized career suggestions powered by AI</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Your Skills</label>
            <Input
              placeholder="e.g., Python, React, Machine Learning, SQL..."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="rounded-xl bg-card/50 border-border/50"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Separate skills with commas</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Interests</label>
            <Input
              placeholder="e.g., AI, Web Development, Data Analysis..."
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="rounded-xl bg-card/50 border-border/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Experience Level</label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <Button
                  key={lvl.value}
                  variant={expLevel === lvl.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpLevel(lvl.value)}
                  className={`rounded-lg ${
                    expLevel === lvl.value
                      ? "bg-primary text-primary-foreground"
                      : "border-border/50 hover:bg-muted/30"
                  }`}
                >
                  {lvl.label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRecommend}
            disabled={loading || (!skills && !interests)}
            className="w-full gap-2 rounded-xl h-11"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Get Recommendations</>
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Your Top Career Matches
            </h3>
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-base font-semibold text-foreground">{rec.title}</h4>
                  <Badge variant="outline" className={`${getScoreColor(rec.match_score)} text-xs font-bold`}>
                    {rec.match_score}% Match
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{rec.reason}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Skills to Develop
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.skills_to_develop.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px] bg-background/30">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Expected Salary
                    </p>
                    <p className="text-sm font-semibold text-foreground">{rec.salary_range}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {hasSearched && !loading && recommendations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 glass-card"
        >
          <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No recommendations found. Try adding more skills or interests.</p>
        </motion.div>
      )}
    </div>
  );
};

export default AIRecommendations;
