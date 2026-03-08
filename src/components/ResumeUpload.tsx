import { motion } from "framer-motion";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult } from "@/types/analysis";

interface ResumeUploadProps {
  onAnalyze: (data: AnalysisResult) => void;
}

const ResumeUpload = ({ onAnalyze }: ResumeUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [loading, setLoading] = useState(false);
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
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      if (jobDescription.trim()) formData.append("jobDescription", jobDescription);
      if (githubUsername.trim()) formData.append("githubUsername", githubUsername);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Analysis failed" }));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      onAnalyze(data);
    } catch (e) {
      toast({
        title: "Analysis Failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

      <div className="mb-6">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">GitHub Username (optional)</label>
        <Input
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          placeholder="e.g. octocat"
          className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 disabled:opacity-30"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze with AI
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default ResumeUpload;
