import DashboardCard from "./DashboardCard";
import { MessageSquare, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { AnalysisInterviewQuestions } from "@/types/analysis";

type Category = "technical" | "conceptual" | "behavioral";

const categoryColors: Record<Category, string> = {
  technical: "bg-primary/10 text-primary border-primary/20",
  conceptual: "bg-secondary/10 text-secondary border-secondary/20",
  behavioral: "bg-accent/10 text-accent border-accent/20",
};

interface Props {
  data: AnalysisInterviewQuestions;
  jobDescription?: string;
}

const InterviewQuestions = ({ data, jobDescription }: Props) => {
  const [activeCategory, setActiveCategory] = useState<Category>("technical");
  const [showJD, setShowJD] = useState(false);
  const questions = data[activeCategory] || [];

  return (
    <div className="space-y-5">
      {jobDescription && (
        <DashboardCard title="Target Job Description" icon={Briefcase} delay={0.1} accentColor="secondary">
          <button
            onClick={() => setShowJD(!showJD)}
            className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-left line-clamp-2">{showJD ? "Hide job description" : jobDescription.slice(0, 150) + (jobDescription.length > 150 ? "..." : "")}</span>
            {showJD ? <ChevronUp className="w-4 h-4 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 shrink-0 ml-2" />}
          </button>
          {showJD && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-3 rounded-lg bg-muted/20 border border-border/50 text-sm text-foreground/80 whitespace-pre-wrap max-h-60 overflow-y-auto"
            >
              {jobDescription}
            </motion.div>
          )}
        </DashboardCard>
      )}

      <DashboardCard title="Interview Questions" icon={MessageSquare} delay={0.4} accentColor="accent" className="col-span-full lg:col-span-2">
        <div className="flex gap-2 mb-4">
          {(["technical", "conceptual", "behavioral"] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 capitalize ${
                activeCategory === cat ? categoryColors[cat] : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
              }`}
            >
              {cat} ({(data[cat] || []).length})
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <motion.div
              key={`${activeCategory}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg bg-muted/20 border border-border/50 text-sm text-foreground/90 hover:bg-muted/30 transition-colors"
            >
              <span className="text-muted-foreground font-mono text-xs mr-2">Q{i + 1}</span>
              {q}
            </motion.div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
};

export default InterviewQuestions;
