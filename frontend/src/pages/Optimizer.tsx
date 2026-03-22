import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Upload, FileText, Loader2, ArrowRight, 
  Target, Key, BarChart3, Edit3, Download, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DashboardCard from "@/components/DashboardCard";
import ResumeTemplatePreview, { type TemplateData } from "@/components/ResumeTemplatePreview";
import { useToast } from "@/hooks/use-toast";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experiences: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  education: string;
}

interface OptimizeResult {
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
}

const Optimizer = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<"input" | "loading" | "result">("input");
  
  // Resume input
  const [resumeText, setResumeText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState("");
  
  // Job input
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  // Results
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [originalTemplate, setOriginalTemplate] = useState<TemplateData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeView, setActiveView] = useState<"preview" | "analysis" | "compare">("preview");

  const parseResumeText = (): ResumeData => {
    // Simple parsing of resume text
    const lines = resumeText.split('\n').filter(l => l.trim());
    const skillsList = skills.split(',').map(s => s.trim()).filter(Boolean);
    
    return {
      name: name || "Candidate",
      email: email || "",
      phone: "",
      location: "",
      summary: lines.slice(0, 3).join(' ') || "",
      skills: skillsList,
      experiences: [],
      projects: [],
      education: "",
    };
  };

  const handleOptimize = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast({ 
        title: "Missing Information", 
        description: "Please provide both your resume and the job description.", 
        variant: "destructive" 
      });
      return;
    }

    setStep("loading");

    try {
      const resumeData = parseResumeText();
      
      // Save original template
      setOriginalTemplate({
        name: resumeData.name,
        email: resumeData.email,
        phone: resumeData.phone,
        location: resumeData.location,
        linkedin: "",
        summary: resumeData.summary,
        skills: resumeData.skills,
        experiences: resumeData.experiences,
        projects: resumeData.projects,
        education: resumeData.education,
      });

      const response = await fetch(`${BACKEND_URL}/api/optimize-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            name: resumeData.name,
            email: resumeData.email,
            phone: resumeData.phone,
            location: resumeData.location,
            linkedin: "",
            tagline: "",
            summary: resumeData.summary,
            skills: resumeData.skills,
            experience_text: resumeText,
            education: resumeData.education,
            experiences: resumeData.experiences,
            projects: resumeData.projects,
          },
          job: {
            title: jobTitle || "Target Role",
            company: company || "Company",
            location: "",
            description: jobDescription,
            required_skills: [],
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errData.detail || `API error ${response.status}`);
      }

      const data: OptimizeResult = await response.json();
      setResult(data);
      
      // Build template from result
      setTemplateData({
        name: resumeData.name,
        email: resumeData.email,
        phone: resumeData.phone,
        location: resumeData.location,
        linkedin: "",
        summary: data.optimized_resume.summary,
        skills: data.optimized_resume.skills,
        experiences: data.optimized_resume.experiences || [],
        projects: data.optimized_resume.projects || [],
        education: resumeData.education,
      });

      setStep("result");
      toast({ title: "Resume Optimized!", description: `Optimized for ${data.job_title} at ${data.company_name}` });

    } catch (error) {
      console.error("Optimization failed:", error);
      toast({ 
        title: "Optimization Failed", 
        description: error instanceof Error ? error.message : "Please try again.", 
        variant: "destructive" 
      });
      setStep("input");
    }
  };

  const handleDownloadPdf = () => {
    if (!templateData) return;
    
    import("@/lib/template-pdf-export").then(({ exportTemplatePdf }) => {
      exportTemplatePdf(templateData, {
        jobTitle: result?.job_title || jobTitle,
        company: result?.company_name || company,
        score: result?.application_strength.score,
      });
      toast({ title: "PDF Downloaded", description: "Your optimized resume has been exported." });
    });
  };

  const handleTemplateChange = (updated: TemplateData) => {
    setTemplateData(updated);
  };

  const handleReset = () => {
    setStep("input");
    setResult(null);
    setTemplateData(null);
    setOriginalTemplate(null);
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-green-500" : score >= 60 ? "text-primary" : "text-orange-500";

  // Step 1: Input Form
  if (step === "input") {
    return (
      <div className="relative">
        <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow opacity-10" />
        <div className="floating-orb w-80 h-80 bg-secondary top-1/2 -left-40 animate-pulse-glow opacity-10" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Resume Optimizer</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Optimize Your Resume</h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Paste your resume and a job description. Our AI will tailor your resume to match the job requirements while keeping your original template.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resume Input */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <DashboardCard title="Your Resume" icon={FileText} accentColor="primary">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="name" className="text-xs text-muted-foreground">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1 bg-muted/30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                      <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="mt-1 bg-muted/30"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="skills" className="text-xs text-muted-foreground">Skills (comma-separated)</Label>
                    <Input
                      id="skills"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="Python, React, AWS, Machine Learning..."
                      className="mt-1 bg-muted/30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resume" className="text-xs text-muted-foreground">Resume Content</Label>
                    <Textarea
                      id="resume"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume content here... Include your experience, projects, education, etc."
                      className="mt-1 bg-muted/30 min-h-[200px] resize-none"
                    />
                  </div>
                </div>
              </DashboardCard>
            </motion.div>

            {/* Job Description Input */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <DashboardCard title="Target Job" icon={Target} accentColor="secondary">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="jobTitle" className="text-xs text-muted-foreground">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Senior Software Engineer"
                        className="mt-1 bg-muted/30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-xs text-muted-foreground">Company</Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Google"
                        className="mt-1 bg-muted/30"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="jobDesc" className="text-xs text-muted-foreground">Job Description *</Label>
                    <Textarea
                      id="jobDesc"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the full job description here..."
                      className="mt-1 bg-muted/30 min-h-[200px] resize-none"
                    />
                  </div>
                </div>
              </DashboardCard>
            </motion.div>
          </div>

          {/* Features */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: Key, label: "Keyword Extraction", desc: "Identifies key requirements" },
                { icon: Target, label: "Skill Matching", desc: "Aligns your skills" },
                { icon: Edit3, label: "Content Rewriting", desc: "Optimizes language" },
                { icon: BarChart3, label: "Match Scoring", desc: "Rates your fit" },
              ].map((f) => (
                <div key={f.label} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                  <f.icon className="w-4 h-4 text-primary mb-2" />
                  <p className="text-xs font-medium text-foreground">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={handleOptimize}
              disabled={!resumeText.trim() || !jobDescription.trim()}
              className="w-full h-12 text-base gap-2"
              size="lg"
            >
              <Sparkles className="w-5 h-5" />
              Optimize My Resume
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 2: Loading
  if (step === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-lg font-medium text-foreground">Optimizing your resume</p>
          <p className="text-primary font-semibold mt-1">{jobTitle || "Target Role"} at {company || "Company"}</p>
          <div className="mt-6 max-w-xs mx-auto space-y-2">
            <p className="text-xs text-muted-foreground">Analyzing job requirements...</p>
            <Progress value={50} className="h-1.5" />
          </div>
        </motion.div>
      </div>
    );
  }

  // Step 3: Results
  if (!result || !templateData) return null;

  return (
    <div className="relative">
      <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow opacity-10" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Optimized Resume</h1>
            <p className="text-sm text-muted-foreground">
              Tailored for {result.job_title} at {result.company_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> New Optimization
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{result.job_title}</h3>
                <p className="text-sm text-primary">{result.company_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-bold ${scoreColor(result.application_strength.score)}`}>
                {result.application_strength.score}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Match Score</p>
            </div>
          </div>
          <Progress value={result.application_strength.score} className="h-2 mt-3" />
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
          <TabsList className="w-full flex justify-start gap-1 bg-muted/30 border border-border rounded-lg p-1 mb-4">
            <TabsTrigger value="preview" className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4" /> Resume Preview
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="w-4 h-4" /> Analysis
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Target className="w-4 h-4" /> Compare
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
              {/* Keywords */}
              <DashboardCard title="Keyword Analysis" icon={Key} accentColor="primary">
                <div className="space-y-4">
                  {result.keyword_analysis.matched_keywords.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Matched Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keyword_analysis.matched_keywords.map((kw) => (
                          <Badge key={kw} className="text-xs bg-green-500/15 text-green-600 border-green-500/30">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.keyword_analysis.missing_keywords.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Missing Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keyword_analysis.missing_keywords.map((kw) => (
                          <Badge key={kw} variant="outline" className="text-xs border-orange-500/30 text-orange-500">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DashboardCard>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardCard title="Strong Areas" icon={CheckCircle} accentColor="accent">
                  <ul className="space-y-2">
                    {result.application_strength.strong_areas.map((area, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </DashboardCard>
                <DashboardCard title="Areas to Improve" icon={Target} accentColor="secondary">
                  <ul className="space-y-2">
                    {result.application_strength.weak_areas.map((area, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Target className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </DashboardCard>
              </div>

              {/* Suggestions */}
              <DashboardCard title="Suggestions" icon={Sparkles} accentColor="primary">
                <ul className="space-y-2">
                  {result.application_strength.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
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
                  {originalTemplate && <ResumeTemplatePreview data={originalTemplate} />}
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
    </div>
  );
};

export default Optimizer;
