import { motion } from "framer-motion";
import { Upload, FileText, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult } from "@/types/analysis";

interface ResumeUploadProps {
  onAnalyze: (data: AnalysisResult, rawText?: string, parsedResume?: any) => void;
}

type PipelineStep = "idle" | "extracting" | "extracted" | "analyzing" | "done" | "error";

const ResumeUpload = ({ onAnalyze }: ResumeUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [step, setStep] = useState<PipelineStep>("idle");
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.type === "application/pdf" || dropped.name.endsWith(".docx"))) {
      setFile(dropped);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    try {
      // ===== STEP 1: Parse resume (text extraction + NLP) =====
      setStep("extracting");

      const formData = new FormData();
      formData.append("resume", file);

      const parseRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!parseRes.ok) {
        const err = await parseRes.json().catch(() => ({ error: "Text extraction failed" }));
        throw new Error(err.error || `Extraction error ${parseRes.status}`);
      }

      const parseData = await parseRes.json();
      setStep("extracted");

      // ===== STEP 2: AI Analysis on structured data =====
      setStep("analyzing");

      const analyzeRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rawText: parseData.rawText,
            parsedResume: parseData.parsed,
            jobDescription: jobDescription.trim() || undefined,
          }),
        }
      );

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json().catch(() => ({ error: "AI analysis failed" }));
        throw new Error(err.error || `Analysis error ${analyzeRes.status}`);
      }

      const analysisData: AnalysisResult = await analyzeRes.json();
      analysisData._jobDescription = jobDescription.trim() || undefined;

      setStep("done");
      onAnalyze(analysisData, parseData.rawText, parseData.parsed);
    } catch (e) {
      setStep("error");
      toast({
        title: "Analysis Failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
      // Reset to allow retry
      setTimeout(() => setStep("idle"), 2000);
    }
  };

  const isLoading = step === "extracting" || step === "extracted" || step === "analyzing";

  const stepLabel = {
    idle: "Analyze with AI",
    extracting: "Extracting text from resume...",
    extracted: "Text extracted! Starting AI analysis...",
    analyzing: "Analyzing with AI...",
    done: "Analysis complete!",
    error: "Analysis failed",
  }[step];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card glow-border p-8 max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block mb-4"
        >
          <div className="p-4 rounded-2xl bg-muted/50">
            <Sparkles className="w-8 h-8 glow-text-primary" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold gradient-text mb-2">Upload Your Resume</h2>
        <p className="text-muted-foreground text-sm">Drop your PDF or DOCX and let AI analyze your career</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer mb-6 ${
          isDragging ? "border-primary bg-primary/5" : file ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/40"
        }`}
        onClick={() => document.getElementById("resume-input")?.click()}
      >
        <input id="resume-input" type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileChange} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-6 h-6 glow-text-accent" />
            <span className="font-medium text-foreground">{file.name}</span>
            <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Drag & drop or click to upload</p>
            <p className="text-muted-foreground/60 text-xs mt-1">PDF or DOCX, max 10MB</p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Job Description (optional)</label>
        <Textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here for skill gap analysis..."
          className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/50 min-h-[80px] resize-none"
        />
      </div>

      {/* Pipeline Progress */}
      {isLoading && (
        <div className="mb-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="space-y-2">
            <PipelineStepIndicator
              label="Text Extraction & NLP Parsing"
              status={step === "extracting" ? "active" : step === "extracted" || step === "analyzing" ? "done" : "pending"}
            />
            <PipelineStepIndicator
              label="AI Career Analysis"
              status={step === "analyzing" ? "active" : step === "done" ? "done" : "pending"}
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleAnalyze}
        disabled={!file || isLoading}
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 disabled:opacity-30"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {stepLabel}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            {stepLabel}
          </>
        )}
      </Button>
    </motion.div>
  );
};

// Pipeline step visual indicator
function PipelineStepIndicator({ label, status }: { label: string; status: "pending" | "active" | "done" }) {
  return (
    <div className="flex items-center gap-3">
      {status === "done" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
      {status === "active" && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
      {status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
      <span className={`text-sm ${status === "done" ? "text-green-500" : status === "active" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

export default ResumeUpload;
