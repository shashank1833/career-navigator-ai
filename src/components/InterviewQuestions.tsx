import DashboardCard from "./DashboardCard";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { AnalysisInterviewQuestions } from "@/types/analysis";

type Category = "technical" | "conceptual" | "behavioral";

const categoryColors: Record<Category, string> = {
  technical: "bg-primary/10 text-primary border-primary/20",
  conceptual: "bg-secondary/10 text-secondary border-secondary/20",
  behavioral: "bg-accent/10 text-accent border-accent/20",
};

const InterviewQuestions = ({ data }: { data: AnalysisInterviewQuestions }) => {
  const [activeCategory, setActiveCategory] = useState<Category>("technical");
  const questions = data[activeCategory] || [];

  return (
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
  );
};

export default InterviewQuestions;
