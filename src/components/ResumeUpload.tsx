import { Upload, FileText, Sparkles, Loader2, ShieldCheck, Zap, Brain } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult } from "@/types/analysis";

interface ResumeUploadProps {
  onAnalyze: (data: AnalysisResult) => void;
}

const FEATURES = [
  { icon: Brain, label: "AI-powered skill extraction" },
  { icon: Zap, label: "Instant job match scoring" },
  { icon: ShieldCheck, label: "Privacy-first — your data stays yours" },
];

const ResumeUpload = ({ onAnalyze }: ResumeUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
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
      data._jobDescription = jobDescription.trim() || undefined;
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
    <div className="ed-card max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[10px] bg-muted mb-4">
          <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="text-[22px] font-semibold text-foreground mb-2 tracking-tight">Upload Your Resume</h2>
        <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
          Our AI reads your resume, extracts skills and experience, then generates actionable insights to accelerate your job search.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`ed-upload-zone mb-6 ${
          isDragging ? "border-primary bg-teal-light" : file ? "border-primary bg-teal-light" : ""
        }`}
        onClick={() => document.getElementById("resume-input")?.click()}
      >
        <input id="resume-input" type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileChange} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-medium text-foreground text-[13px]">{file.name}</span>
            <span className="text-[11px] text-muted-foreground font-mono">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-foreground text-[13px] font-medium mb-1">Drag & drop your resume here</p>
            <p className="text-muted-foreground text-[11px]">
              Supports PDF and DOCX — or <span className="text-primary cursor-pointer hover:underline">browse files</span>
            </p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="ed-label mb-2 block">Target Job Description <span className="normal-case font-normal">(optional)</span></label>
        <Textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste a job listing here and we'll score your resume against its requirements…"
          className="bg-background border-border text-foreground placeholder:text-muted-foreground/50 min-h-[80px] resize-none text-[13px]"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {FEATURES.map((f) => (
          <div key={f.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <f.icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="w-full h-11 text-[13px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-150 disabled:opacity-30"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing — this takes about 15 seconds…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Analyze with AI
          </>
        )}
      </Button>
    </div>
  );
};

export default ResumeUpload;
