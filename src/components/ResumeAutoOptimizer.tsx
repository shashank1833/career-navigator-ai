import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, ArrowLeft, Target, CheckCircle, XCircle,
  Lightbulb, Download, Edit3, Save, RotateCcw, FileText,
  AlertTriangle, Key, BarChart3, ArrowRight, Copy, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DashboardCard from "./DashboardCard";
import ResumeTemplatePreview, { type TemplateData } from "./ResumeTemplatePreview";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisProfile } from "@/types/analysis";
import type { JobListing, ResumeOptimization } from "@/types/jobs";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

interface ResumeAutoOptimizerProps {
  profile: AnalysisProfile;
  job?: JobListing | null;
  jobDescription?: string;
  onBack: () => void;
  onVersionSaved?: (version: any) => void;
}

interface OptimizeResult {
  id: string;
  optimized_resume: {
    summary: string;
    skills: string[];
    experiences: Array<{ title: string; company: string; duration: string; bullets: string[] }>;
    projects: Array<{ name: string; description: string; technologies: string[] }>;
  };
  keyword_analysis: {
    extracted_keywords: string[];
    matched_keywords: string[];
    missing_keywords: string[];
    injected_keywords: string[];
  };
  application_strength: {
    score: number;
    strong_areas: string[];
    weak_areas: string[];
    suggestions: string[];
  };
  job_title: string;
  company_name: string;
  timestamp: string;
}

// Build profile data to send to API
function buildApiProfile(profile: AnalysisProfile) {
  return {
    name: profile.name || "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    tagline: profile.tagline || "",
    summary: profile.tagline || "",
    skills: profile.skills || [],
    experience_text: profile.experience || "",
    education: profile.education || "",
    experiences: [],
    projects: [],
  };
}

function buildTemplateFromResult(profile: AnalysisProfile, result: OptimizeResult): TemplateData {
  return {
    name: profile.name || "Candidate",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    summary: result.optimized_resume.summary,
    skills: result.optimized_resume.skills,
    experiences: result.optimized_resume.experiences || [],
    projects: result.optimized_resume.projects || [],
    education: profile.education || "",
  };
}

function buildOriginalTemplate(profile: AnalysisProfile): TemplateData {
  return {
    name: profile.name || "Candidate",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    summary: profile.tagline || "",
    skills: profile.skills || [],
    experiences: [],
    projects: [],
    education: profile.education || "",
  };
}

// Map to the legacy ResumeOptimization format for Supabase fallback
function mapToLegacyOptimization(result: OptimizeResult, profile: AnalysisProfile): ResumeOptimization {
  return {
    applicationStrength: {
      score: result.application_strength.score,
      strongAreas: result.application_strength.strong_areas,
      weakAreas: result.application_strength.weak_areas,
      suggestions: result.application_strength.suggestions,
    },
    optimizedSections: {
      summary: {
        original: profile.tagline || "",
        optimized: result.optimized_resume.summary,
      },
      skills: {
        original: profile.skills,
        optimized: result.optimized_resume.skills,
        added: result.keyword_analysis.injected_keywords,
      },
      bulletPoints: result.optimized_resume.experiences.flatMap((exp) =>
        exp.bullets.map((b) => ({ original: "", optimized: b }))
      ),
      projects: result.optimized_resume.projects.map((p) => ({
        name: p.name,
        relevance: "High",
        highlight: p.description,
      })),
    },
    missingSkills: result.keyword_analysis.missing_keywords.map((kw) => ({
      skill: kw,
      importance: "recommended" as const,
      learningPath: `Consider learning ${kw} to strengthen your application.`,
    })),
  };
}

const ResumeAutoOptimizer = ({
  profile,
  job,
  jobDescription: initialJobDesc,
  onBack,
  onVersionSaved,
}: ResumeAutoOptimizerProps) => {
  const { toast } = useToast();
  const [customJobDesc, setCustomJobDesc] = useState(initialJobDesc || job?.description || "");
  const [customJobTitle, setCustomJobTitle] = useState(job?.title || "");
  const [customCompany, setCustomCompany] = useState(job?.company || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeView, setActiveView] = useState<"preview" | "analysis" | "compare">("preview");
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = useCallback(async () => {
    if (!customJobDesc.trim()) {
      toast({ title: "Job description required", description: "Please paste a job description to optimize for.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setTemplateData(null);

    try {
      // Primary: FastAPI backend
      const apiProfile = buildApiProfile(profile);
      const jobInput = {
        title: customJobTitle || job?.title || "Target Role",
        company: customCompany || job?.company || "Company",
        location: job?.location || "",
        description: customJobDesc,
        required_skills: job?.requiredSkills || [],
      };

      const res = await fetch(`${BACKEND_URL}/api/optimize-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: apiProfile, job: jobInput }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errData.detail || `API error ${res.status}`);
      }

      const data: OptimizeResult = await res.json();
      setResult(data);
      setTemplateData(buildTemplateFromResult(profile, data));

      toast({ title: "Resume optimized!", description: `Optimized for ${data.job_title} at ${data.company_name}` });
    } catch (primaryErr) {
      console.error("Primary optimization failed:", primaryErr);

      // Fallback: Try Supabase edge function
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) throw new Error("Supabase not configured");

        const fallbackJob: JobListing = {
          id: job?.id || crypto.randomUUID(),
          title: customJobTitle || job?.title || "Target Role",
          company: customCompany || job?.company || "Company",
          location: job?.location || "Remote",
          type: job?.type || "Full-time",
          salary: job?.salary || "",
          description: customJobDesc,
          requiredSkills: job?.requiredSkills || [],
          matchingSkills: job?.matchingSkills || [],
          missingSkills: job?.missingSkills || [],
          matchScore: job?.matchScore || 0,
          projectRelevance: job?.projectRelevance || 0,
          experienceMatch: job?.experienceMatch || 0,
          postedDate: job?.postedDate || new Date().toISOString(),
          applyUrl: job?.applyUrl || "",
        };

        const fbRes = await fetch(`${supabaseUrl}/functions/v1/optimize-resume`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profile, job: fallbackJob }),
        });

        if (!fbRes.ok) throw new Error("Fallback also failed");

        const fbData: ResumeOptimization = await fbRes.json();

        // Convert to our format
        const converted: OptimizeResult = {
          id: crypto.randomUUID(),
          optimized_resume: {
            summary: fbData.optimizedSections.summary.optimized,
            skills: fbData.optimizedSections.skills.optimized,
            experiences: fbData.optimizedSections.bulletPoints.length > 0
              ? [{
                  title: customJobTitle || "Experience",
                  company: "",
                  duration: "",
                  bullets: fbData.optimizedSections.bulletPoints.map((bp) => bp.optimized),
                }]
              : [],
            projects: fbData.optimizedSections.projects.map((p) => ({
              name: p.name,
              description: p.highlight,
              technologies: [],
            })),
          },
          keyword_analysis: {
            extracted_keywords: [],
            matched_keywords: [],
            missing_keywords: fbData.missingSkills.map((ms) => ms.skill),
            injected_keywords: fbData.optimizedSections.skills.added,
          },
          application_strength: {
            score: fbData.applicationStrength.score,
            strong_areas: fbData.applicationStrength.strongAreas,
            weak_areas: fbData.applicationStrength.weakAreas,
            suggestions: fbData.applicationStrength.suggestions,
          },
          job_title: customJobTitle || job?.title || "Target Role",
          company_name: customCompany || job?.company || "Company",
          timestamp: new Date().toISOString(),
        };

        setResult(converted);
        setTemplateData(buildTemplateFromResult(profile, converted));
        toast({ title: "Resume optimized (fallback)", description: "Used backup service successfully." });
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
        setError(
          primaryErr instanceof Error
            ? primaryErr.message
            : "Optimization failed. Please try again."
        );
        toast({ title: "Optimization failed", description: "Both primary and fallback services failed.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [profile, job, customJobDesc, customJobTitle, customCompany, toast]);

  const handleTemplateChange = (updated: TemplateData) => {
    setTemplateData(updated);
  };

  const handleDownloadPdf = () => {
    if (!templateData) return;
    // Dynamic import to avoid loading jsPDF until needed
    import("@/lib/template-pdf-export").then(({ exportTemplatePdf }) => {
      exportTemplatePdf(templateData, {
        jobTitle: result?.job_title || customJobTitle,
        company: result?.company_name || customCompany,
        score: result?.application_strength.score,
      });
      toast({ title: "PDF downloaded", description: "Your optimized resume has been exported." });
    });
  };

  const handleReoptimize = () => {
    setResult(null);
    setTemplateData(null);
    setIsEditing(false);
    setError(null);
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-green-500" : score >= 60 ? "text-primary" : "text-orange-500";

  // ── Initial State: Job Description Input ──
  if (!result && !loading) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <DashboardCard title="Auto-Optimize Resume" icon={Sparkles} accentColor="primary">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste a job description below and our AI will automatically modify your resume to align with the role while maintaining professional formatting.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Job Title
                  </label>
                  <Input
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="bg-muted/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Company Name
                  </label>
                  <Input
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="e.g. Google"
                    className="bg-muted/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Job Description *
                </label>
                <Textarea
                  value={customJobDesc}
                  onChange={(e) => setCustomJobDesc(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="bg-muted/30 resize-none min-h-[160px]"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                onClick={handleOptimize}
                disabled={!customJobDesc.trim()}
                className="w-full gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Optimize Resume for This Job
              </Button>

              {/* Features */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {[
                  { icon: Key, label: "Keyword Extraction" },
                  { icon: Target, label: "Skill Matching" },
                  { icon: Edit3, label: "Content Rewriting" },
                  { icon: BarChart3, label: "Match Scoring" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <f.icon className="w-3 h-3 text-primary" />
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </DashboardCard>
        </motion.div>
      </div>
    );
  }

  // ── Loading State ──
  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
        <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-foreground font-medium">Optimizing your resume</p>
        <p className="text-primary font-semibold mt-1">
          {customJobTitle || "Target Role"} at {customCompany || "Company"}
        </p>
        <div className="mt-4 max-w-xs mx-auto space-y-2">
          <p className="text-xs text-muted-foreground">Extracting keywords & matching skills...</p>
          <Progress value={33} className="h-1.5" />
        </div>
      </motion.div>
    );
  }

  // ── Result View ──
  if (!result || !templateData) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReoptimize} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Re-optimize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? "View Mode" : "Edit Mode"}
          </Button>
          <Button size="sm" onClick={handleDownloadPdf} className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Score Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-semibold text-foreground">{result.job_title}</h3>
            <p className="text-sm text-primary">{result.company_name}</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${scoreColor(result.application_strength.score)}`}>
              {result.application_strength.score}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Match Score</p>
          </div>
        </div>
        <Progress value={result.application_strength.score} className="h-1.5 mt-3" />
      </motion.div>

      {/* Tabs: Preview / Analysis / Compare */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <TabsList className="w-full flex justify-start gap-1 bg-muted/30 border border-border rounded-lg p-1 mb-4">
          <TabsTrigger value="preview" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileText className="w-3.5 h-3.5" /> Resume Preview
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart3 className="w-3.5 h-3.5" /> Analysis
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Copy className="w-3.5 h-3.5" /> Compare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ResumeTemplatePreview
              data={templateData}
              editable={isEditing}
              onChange={handleTemplateChange}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="analysis">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Strong & Weak Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DashboardCard title="Strong Areas" icon={CheckCircle} accentColor="accent" delay={0.1}>
                <ul className="space-y-2">
                  {result.application_strength.strong_areas.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {area}
                    </li>
                  ))}
                </ul>
              </DashboardCard>
              <DashboardCard title="Weak Areas" icon={XCircle} accentColor="secondary" delay={0.15}>
                <ul className="space-y-2">
                  {result.application_strength.weak_areas.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <XCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      {area}
                    </li>
                  ))}
                </ul>
              </DashboardCard>
            </div>

            {/* Suggestions */}
            <DashboardCard title="Improvement Suggestions" icon={Lightbulb} accentColor="primary" delay={0.2}>
              <ul className="space-y-2">
                {result.application_strength.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </DashboardCard>

            {/* Keyword Analysis */}
            <DashboardCard title="Keyword Analysis" icon={Key} accentColor="accent" delay={0.25}>
              <div className="space-y-3">
                {result.keyword_analysis.matched_keywords.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Matched Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keyword_analysis.matched_keywords.map((kw) => (
                        <Badge key={kw} className="text-[10px] bg-green-500/15 text-green-600 border-green-500/30">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {result.keyword_analysis.missing_keywords.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Missing Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keyword_analysis.missing_keywords.map((kw) => (
                        <Badge key={kw} variant="outline" className="text-[10px] border-orange-500/30 text-orange-500">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {result.keyword_analysis.injected_keywords.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Keywords Added to Resume</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keyword_analysis.injected_keywords.map((kw) => (
                        <Badge key={kw} className="text-[10px] bg-primary/15 text-primary border-primary/30">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DashboardCard>
          </motion.div>
        </TabsContent>

        <TabsContent value="compare">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">Original</Badge>
                </div>
                <ResumeTemplatePreview data={buildOriginalTemplate(profile)} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="text-xs bg-primary/15 text-primary border-primary/30">Optimized</Badge>
                </div>
                <ResumeTemplatePreview data={templateData} />
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResumeAutoOptimizer;
