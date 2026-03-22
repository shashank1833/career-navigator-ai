import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Loader2, CheckCircle2, XCircle, TrendingUp, History, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardCard from "./DashboardCard";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import { toast } from "sonner";

interface EvaluationResult {
  clarity: number;
  technicalDepth: number;
  communication: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface InterviewAttempt {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  user_answer: string;
  clarity_score: number;
  technical_depth_score: number;
  communication_score: number;
  feedback: string;
  created_at: string;
}

interface Props {
  question: string;
  category: string;
  difficulty: string;
}

const ScoreBar = ({ label, score, color }: { label: string; score: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${color}`}>{score}/10</span>
    </div>
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score * 10}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full ${score >= 7 ? "bg-green-500" : score >= 4 ? "bg-amber-500" : "bg-red-400"}`}
      />
    </div>
  </div>
);

const MockInterviewSimulator = ({ question, category, difficulty }: Props) => {
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<InterviewAttempt[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const sessionId = getSessionId();

  useEffect(() => {
    setAnswer("");
    setEvaluation(null);
  }, [question]);

  const loadHistory = async () => {
    if (history.length > 0) {
      setShowHistory(!showHistory);
      return;
    }
    setLoadingHistory(true);
    const { data } = await supabase
      .from("interview_attempts")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setHistory(data as InterviewAttempt[]);
    setShowHistory(true);
    setLoadingHistory(false);
  };

  const handleEvaluate = async () => {
    if (!answer.trim()) {
      toast.error("Please write your answer first");
      return;
    }

    setEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-interview-answer", {
        body: { question, answer: answer.trim(), category, difficulty },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setEvaluation(data);

      // Save to DB
      await supabase.from("interview_attempts").insert({
        session_id: sessionId,
        question,
        category,
        difficulty,
        user_answer: answer.trim(),
        clarity_score: data.clarity,
        technical_depth_score: data.technicalDepth,
        communication_score: data.communication,
        feedback: data.feedback,
      });

      toast.success("Answer evaluated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to evaluate. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const avgScore = evaluation
    ? Math.round(((evaluation.clarity + evaluation.technicalDepth + evaluation.communication) / 3) * 10) / 10
    : 0;

  return (
    <div className="space-y-4 mt-4">
      {/* Answer Input */}
      <DashboardCard title="Mock Interview" icon={Mic} delay={0.1} accentColor="primary">
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Question:</p>
            <p className="text-sm font-medium text-foreground">{question}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">{category}</Badge>
              <Badge variant="outline" className="text-[10px]">{difficulty}</Badge>
            </div>
          </div>

          <Textarea
            placeholder="Type your answer here... Be thorough and specific."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-[150px] bg-muted/20 border-border/50 text-sm resize-y"
            disabled={evaluating}
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {answer.length > 0 ? `${answer.split(/\s+/).filter(Boolean).length} words` : "Write your best answer"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadHistory} disabled={loadingHistory}>
                {loadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4 mr-1" />}
                History
              </Button>
              <Button onClick={handleEvaluate} disabled={evaluating || !answer.trim()} size="sm" className="gap-2">
                {evaluating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
                ) : (
                  <><Send className="w-4 h-4" /> Evaluate Answer</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Evaluation Result */}
      <AnimatePresence>
        {evaluation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <DashboardCard title="Evaluation Result" icon={TrendingUp} delay={0} accentColor="accent">
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                  <span className="text-sm font-medium text-foreground">Overall Score</span>
                  <span className={`text-2xl font-bold ${avgScore >= 7 ? "text-green-500" : avgScore >= 4 ? "text-amber-500" : "text-red-400"}`}>
                    {avgScore}/10
                  </span>
                </div>

                {/* Individual Scores */}
                <div className="space-y-3">
                  <ScoreBar label="Clarity" score={evaluation.clarity} color={evaluation.clarity >= 7 ? "text-green-500" : evaluation.clarity >= 4 ? "text-amber-500" : "text-red-400"} />
                  <ScoreBar label="Technical Depth" score={evaluation.technicalDepth} color={evaluation.technicalDepth >= 7 ? "text-green-500" : evaluation.technicalDepth >= 4 ? "text-amber-500" : "text-red-400"} />
                  <ScoreBar label="Communication" score={evaluation.communication} color={evaluation.communication >= 7 ? "text-green-500" : evaluation.communication >= 4 ? "text-amber-500" : "text-red-400"} />
                </div>

                {/* Feedback */}
                <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
                  <p className="text-sm text-foreground">{evaluation.feedback}</p>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {evaluation.strengths?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Strengths
                      </p>
                      {evaluation.strengths.map((s, i) => (
                        <p key={i} className="text-xs text-foreground/80 pl-4">• {s}</p>
                      ))}
                    </div>
                  )}
                  {evaluation.improvements?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-amber-500" /> To Improve
                      </p>
                      {evaluation.improvements.map((s, i) => (
                        <p key={i} className="text-xs text-foreground/80 pl-4">• {s}</p>
                      ))}
                    </div>
                  )}
                </div>

                <Button variant="outline" size="sm" onClick={() => { setEvaluation(null); setAnswer(""); }}>
                  Try Another Answer
                </Button>
              </div>
            </DashboardCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <DashboardCard title="Past Attempts" icon={History} delay={0} accentColor="secondary">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No previous attempts yet.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {history.map((attempt) => {
                    const avg = Math.round(((attempt.clarity_score + attempt.technical_depth_score + attempt.communication_score) / 3) * 10) / 10;
                    return (
                      <div key={attempt.id} className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-foreground line-clamp-2">{attempt.question}</p>
                          <span className={`text-sm font-bold shrink-0 ${avg >= 7 ? "text-green-500" : avg >= 4 ? "text-amber-500" : "text-red-400"}`}>
                            {avg}/10
                          </span>
                        </div>
                        <div className="flex gap-4 text-[10px] text-muted-foreground">
                          <span>Clarity: {attempt.clarity_score}</span>
                          <span>Depth: {attempt.technical_depth_score}</span>
                          <span>Comm: {attempt.communication_score}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{attempt.feedback}</p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </DashboardCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockInterviewSimulator;
