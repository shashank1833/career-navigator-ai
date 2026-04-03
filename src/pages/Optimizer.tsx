import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, FileText, Loader2, ArrowRight, 
  Target, Key, BarChart3, Edit3, Download, CheckCircle,
  ChevronRight, Upload, Palette, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DashboardCard from "@/components/DashboardCard";
import TemplateSelector from "@/components/TemplateSelector";
import StyledResume, { type ResumeData } from "@/components/StyledResume";
import { type TemplateStyle, getTemplate } from "@/lib/resume-templates";
import { useToast } from "@/hooks/use-toast";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

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
  const resumeRef = useRef<HTMLDivElement>(null);
  const { saveOptimizedVersion } = useResumeVersions();
  const [step, setStep] = useState<"template" | "input" | "loading" | "result">("template");
  const [saved, setSaved] = useState(false);
  
  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>("modern");
  
  // Resume input
  const [resumeText, setResumeText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [education, setEducation] = useState("");
  
  // Job input
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  // Results
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [originalData, setOriginalData] = useState<ResumeData | null>(null);
  const [activeView, setActiveView] = useState<"preview" | "analysis" | "compare">("preview");

  const parseResumeText = (): ResumeData => {
    const skillsList = skills.split(',').map(s => s.trim()).filter(Boolean);
    
    // Parse experiences from resume text (basic parsing)
    const experiences: ResumeData["experiences"] = [];
    const projects: ResumeData["projects"] = [];
    
    // Simple heuristic parsing
    const lines = resumeText.split('\n').filter(l => l.trim());
    let currentSection = "";
    let currentExp: ResumeData["experiences"][0] | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes("experience") || trimmed.toLowerCase().includes("work history")) {
        currentSection = "experience";
        continue;
      }
      if (trimmed.toLowerCase().includes("project")) {
        currentSection = "projects";
        continue;
      }
      if (trimmed.toLowerCase().includes("education")) {
        currentSection = "education";
        continue;
      }
      
      if (currentSection === "experience") {
        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
          if (currentExp) {
            currentExp.bullets.push(trimmed.replace(/^[•\-*]\s*/, ''));
          }
        } else if (trimmed.length > 5) {
          if (currentExp) experiences.push(currentExp);
          currentExp = {
            title: trimmed,
            company: "",
            duration: "",
            bullets: []
          };
        }
      }
    }
    if (currentExp) experiences.push(currentExp);
    
    return {
      name: name || "Candidate",
      email: email || "",
      phone: phone || "",
      location: location || "",
      summary: lines.slice(0, 3).join(' ').substring(0, 300) || "",
      skills: skillsList,
      experiences: experiences.length > 0 ? experiences : [
        { title: "Position", company: "Company", duration: "Present", bullets: ["Key responsibility"] }
      ],
      projects: projects,
      education: education || "",
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
      const inputData = parseResumeText();
      setOriginalData(inputData);

      const response = await fetch(`${BACKEND_URL}/api/optimize-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            name: inputData.name,
            email: inputData.email,
            phone: inputData.phone,
            location: inputData.location,
            linkedin: "",
            tagline: "",
            summary: inputData.summary,
            skills: inputData.skills,
            experience_text: resumeText,
            education: inputData.education,
            experiences: inputData.experiences,
            projects: inputData.projects,
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
      
      // Build optimized resume data
      setResumeData({
        name: inputData.name,
        email: inputData.email,
        phone: inputData.phone,
        location: inputData.location,
        summary: data.optimized_resume.summary,
        skills: data.optimized_resume.skills,
        experiences: data.optimized_resume.experiences || inputData.experiences,
        projects: data.optimized_resume.projects || inputData.projects,
        education: inputData.education,
      });

      setStep("result");
      toast({ title: "Resume Optimized!", description: `Tailored for ${data.job_title} at ${data.company_name}` });

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

  const handleDownloadPdf = async () => {
    if (!resumeRef.current || !resumeData) return;
    
    toast({ title: "Generating PDF...", description: "Please wait" });
    
    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const fileName = `${resumeData.name.replace(/\s+/g, '_')}_${result?.job_title?.replace(/\s+/g, '_') || 'Resume'}.pdf`;
      pdf.save(fileName);
      
      toast({ title: "PDF Downloaded!", description: fileName });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({ title: "PDF Generation Failed", description: "Please try again", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setStep("template");
    setResult(null);
    setResumeData(null);
    setOriginalData(null);
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-green-500" : score >= 60 ? "text-primary" : "text-orange-500";

  // Step 1: Template Selection
  if (step === "template") {
    return (
      <div className="relative">
        <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow opacity-10" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Step 1 of 2</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Template</h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Select a professional template for your optimized resume. Each template is designed for different industries and roles.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <Button
              onClick={() => setStep("input")}
              size="lg"
              className="gap-2 px-8"
            >
              Continue with {getTemplate(selectedTemplate).name} Template
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 2: Input Form
  if (step === "input") {
    const template = getTemplate(selectedTemplate);
    
    return (
      <div className="relative">
        <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow opacity-10" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Step 2 of 2 • {template.name} Template</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Enter Your Details</h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Provide your resume content and the target job description. Our AI will optimize your resume for the role.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resume Input */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <DashboardCard title="Your Information" icon={FileText} accentColor="primary">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="name" className="text-xs text-muted-foreground">Full Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1 bg-muted/30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs text-muted-foreground">Email *</Label>
                      <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="mt-1 bg-muted/30"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="mt-1 bg-muted/30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-xs text-muted-foreground">Location</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="New York, NY"
                        className="mt-1 bg-muted/30"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="skills" className="text-xs text-muted-foreground">Skills (comma-separated) *</Label>
                    <Input
                      id="skills"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="Python, React, AWS, Machine Learning..."
                      className="mt-1 bg-muted/30"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="education" className="text-xs text-muted-foreground">Education</Label>
                    <Input
                      id="education"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="BS Computer Science, MIT, 2020"
                      className="mt-1 bg-muted/30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resume" className="text-xs text-muted-foreground">Resume Content *</Label>
                    <Textarea
                      id="resume"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your full resume content here including experience, projects, achievements..."
                      className="mt-1 bg-muted/30 min-h-[150px] resize-none"
                    />
                  </div>
                </div>
              </DashboardCard>
            </motion.div>

            {/* Job Description Input */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <DashboardCard title="Target Job" icon={Target} accentColor="secondary">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="jobTitle" className="text-xs text-muted-foreground">Job Title *</Label>
                      <Input
                        id="jobTitle"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Senior Software Engineer"
                        className="mt-1 bg-muted/30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-xs text-muted-foreground">Company *</Label>
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
                      placeholder="Paste the full job description here including requirements, responsibilities, qualifications..."
                      className="mt-1 bg-muted/30 min-h-[280px] resize-none"
                    />
                  </div>
                </div>
              </DashboardCard>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="mt-6 flex gap-3 justify-center"
          >
            <Button variant="outline" onClick={() => setStep("template")} className="gap-2">
              <Palette className="w-4 h-4" /> Change Template
            </Button>
            <Button
              onClick={handleOptimize}
              disabled={!name.trim() || !resumeText.trim() || !jobDescription.trim() || !jobTitle.trim()}
              className="gap-2 px-8"
              size="lg"
            >
              <Sparkles className="w-5 h-5" />
              Optimize Resume
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 3: Loading
  if (step === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-lg font-medium text-foreground">Optimizing your resume</p>
          <p className="text-primary font-semibold mt-1">{jobTitle} at {company}</p>
          <p className="text-xs text-muted-foreground mt-2">Using {getTemplate(selectedTemplate).name} template</p>
          <div className="mt-6 max-w-xs mx-auto space-y-2">
            <p className="text-xs text-muted-foreground">Analyzing job requirements...</p>
            <Progress value={50} className="h-1.5" />
          </div>
        </motion.div>
      </div>
    );
  }

  // Step 4: Results
  if (!result || !resumeData) return null;

  return (
    <div className="relative">
      <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow opacity-10" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Optimized Resume</h1>
            <p className="text-sm text-muted-foreground">
              {result.job_title} at {result.company_name} • {getTemplate(selectedTemplate).name} Template
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> New Optimization
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
              <div className="flex justify-center">
                <div className="max-w-[800px] w-full">
                  <StyledResume 
                    ref={resumeRef}
                    data={resumeData} 
                    templateId={selectedTemplate}
                    className="border border-border rounded-lg overflow-hidden"
                  />
                </div>
              </div>
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
                  {originalData && (
                    <StyledResume 
                      data={originalData} 
                      templateId={selectedTemplate}
                      className="border border-border rounded-lg overflow-hidden scale-90 origin-top"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="text-xs bg-primary/15 text-primary border-primary/30">Optimized</Badge>
                  </div>
                  <StyledResume 
                    data={resumeData} 
                    templateId={selectedTemplate}
                    className="border border-border rounded-lg overflow-hidden scale-90 origin-top"
                  />
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
