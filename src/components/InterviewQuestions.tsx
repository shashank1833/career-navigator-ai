import DashboardCard from "./DashboardCard";
import MockInterviewSimulator from "./MockInterviewSimulator";
import { MessageSquare, Briefcase, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AnalysisInterviewQuestions, InterviewQuestionItem } from "@/types/analysis";

type Category = "technical" | "conceptual" | "behavioral";

const categoryColors: Record<Category, string> = {
  technical: "bg-primary/10 text-primary border-primary/20",
  conceptual: "bg-secondary/10 text-secondary border-secondary/20",
  behavioral: "bg-accent/10 text-accent border-accent/20",
};

const difficultyStyles: Record<string, string> = {
  Easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Hard: "bg-red-500/15 text-red-400 border-red-500/30",
};

function normalizeQuestion(item: string | InterviewQuestionItem): { question: string; difficulty: string } {
  if (typeof item === "string") return { question: item, difficulty: "Medium" };
  return { question: item.question, difficulty: item.difficulty || "Medium" };
}

interface Props {
  data: AnalysisInterviewQuestions;
  jobDescription?: string;
  skills?: string[];
}

const InterviewQuestions = ({ data, jobDescription, skills }: Props) => {
  const [activeCategory, setActiveCategory] = useState<Category>("technical");
  const [customJD, setCustomJD] = useState(jobDescription || "");
  const [questions, setQuestions] = useState<AnalysisInterviewQuestions | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<{ question: string; difficulty: string } | null>(null);

  const displayedQuestions = (questions?.[activeCategory] || []).map(normalizeQuestion);

  const handleGenerate = async () => {
    if (!customJD.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    setGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke(
        "generate-interview-questions",
        { body: { jobDescription: customJD, skills: skills || [] } }
      );

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setQuestions(result);
      setActiveCategory("technical");
      toast.success("Interview questions generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <DashboardCard title="Job Description" icon={Briefcase} delay={0.1} accentColor="secondary">
        <div className="space-y-3">
          <Textarea
            placeholder="Paste a job description here to generate tailored interview questions..."
            value={customJD}
            onChange={(e) => setCustomJD(e.target.value)}
            className="min-h-[120px] bg-muted/20 border-border/50 text-sm resize-y"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {customJD.length > 0 ? `${customJD.length} characters` : "Enter a job description to get started"}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating || !customJD.trim()}
              size="sm"
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Questions
                </>
              )}
            </Button>
          </div>
        </div>
      </DashboardCard>

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
              {cat} ({(questions?.[cat] || []).length})
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {displayedQuestions.map((q, i) => (
            <motion.div
              key={`${activeCategory}-${i}-${q.question.slice(0, 20)}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg bg-muted/20 border border-border/50 text-sm text-foreground/90 hover:bg-muted/30 transition-colors flex items-start justify-between gap-3"
            >
              <div className="flex-1">
                <span className="text-muted-foreground font-mono text-xs mr-2">Q{i + 1}</span>
                {q.question}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold px-2 py-0.5 ${difficultyStyles[q.difficulty] || difficultyStyles.Medium}`}
                >
                  {q.difficulty}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => setSelectedQuestion(q)}
                >
                  Practice
                </Button>
              </div>
            </motion.div>
          ))}
          {displayedQuestions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No questions yet. Paste a job description above and click "Generate Questions".
            </p>
          )}
        </div>
      </DashboardCard>
    </div>
  );
};

export default InterviewQuestions;
