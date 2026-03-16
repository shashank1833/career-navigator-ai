import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowLeft, User, Target, MessageSquare, TrendingUp, Sparkles, FileText, Briefcase, Download, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ResumeUpload from "@/components/ResumeUpload";
import ProfileCard from "@/components/ProfileCard";
import SkillGapChart from "@/components/SkillGapChart";
import SkillMatchVisualization from "@/components/SkillMatchVisualization";
import JobMatchScore from "@/components/JobMatchScore";
import InterviewQuestions from "@/components/InterviewQuestions";
import CareerTrajectory from "@/components/CareerTrajectory";
import ResumeImprovements from "@/components/ResumeImprovements";
import WeaknessDetector from "@/components/WeaknessDetector";
import ProjectImpact from "@/components/ProjectImpact";
import JobMatching from "@/components/JobMatching";
import CareerRoleAnalyzer from "@/components/CareerRoleAnalyzer";
import CareerStrategyEngine from "@/components/CareerStrategyEngine";
import CareerReportExport from "@/components/CareerReportExport";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import type { AnalysisResult } from "@/types/analysis";

type NavigationState = {
  analysisData?: AnalysisResult;
  profileData?: AnalysisResult["profile"];
  initialTab?: "profile" | "resume" | "improvements" | "interview" | "career" | "jobs" | "export";
  initialJobsTab?: "recommended" | "saved" | "tracker";
};

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [navigationState] = useState<NavigationState | null>(() => location.state as NavigationState | null);
  const { saveOriginalResume } = useResumeVersions();

  useEffect(() => {
    if (navigationState?.analysisData) {
      setData(navigationState.analysisData);
      window.history.replaceState({}, document.title);
    } else if (navigationState?.profileData) {
      setData({
        profile: navigationState.profileData,
        skillGap: { matching: [], missing: [], suggested: [] },
        jobMatch: { skillMatch: 0, projectRelevance: 0, experienceMatch: 0, overall: 0 },
        improvements: [],
        interviewQuestions: { technical: [], conceptual: [], behavioral: [] },
        careerTrajectory: [],
        weaknesses: [],
        projectImpact: [],
        roadmap: { goal: "", steps: [] },
        github: { username: "N/A", repos: 0, languages: [], devScore: 0, topProject: { name: "", stars: 0, forks: 0 }, activity: "N/A" },
      });
      window.history.replaceState({}, document.title);
    }
  }, [navigationState]);

  const handleAnalyze = (result: AnalysisResult) => {
    setData(result);
    saveOriginalResume(result.profile, result);
  };

  return (
    <div className="relative">
      <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow opacity-10" />
      <div className="floating-orb w-80 h-80 bg-secondary top-1/2 -left-40 animate-pulse-glow opacity-10" style={{ animationDelay: "1s" }} />
      <div className="floating-orb w-64 h-64 bg-accent bottom-20 right-1/4 animate-pulse-glow opacity-5" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!data ? (
            <motion.div key="upload" exit={{ opacity: 0, y: -30, transition: { duration: 0.3 } }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Zap className="w-3.5 h-3.5 glow-text-primary" />
                  <span className="text-xs font-medium text-primary">AI-Powered Career Intelligence</span>
                </div>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Brain className="w-10 h-10 glow-text-primary" />
                  <h1 className="text-4xl sm:text-5xl font-extrabold gradient-text tracking-tight">Career Intelligence</h1>
                </div>
                <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                  Upload your resume and unlock AI-driven insights to accelerate your career growth
                </p>
              </motion.div>
              <ResumeUpload onAnalyze={handleAnalyze} />
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <div className="mb-6">
                <Button variant="ghost" size="sm" onClick={() => setData(null)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" /> New Analysis
                </Button>
              </div>

              <Tabs defaultValue={navigationState?.initialTab ?? "profile"} className="w-full">
                <TabsList className="w-full flex flex-wrap justify-start gap-1.5 bg-muted/50 border border-border/50 rounded-xl p-1.5 mb-8 h-auto min-h-[48px]">
                  {[
                    { value: "profile", icon: User, label: "Profile Overview", shortLabel: "Profile" },
                    { value: "resume", icon: Sparkles, label: "Projects", shortLabel: "Projects" },
                    { value: "improvements", icon: FileText, label: "Resume", shortLabel: "Resume" },
                    { value: "interview", icon: MessageSquare, label: "Interview Prep", shortLabel: "Interview" },
                    { value: "career", icon: TrendingUp, label: "Career Growth", shortLabel: "Career" },
                    { value: "jobs", icon: Briefcase, label: "Job Matching", shortLabel: "Jobs" },
                    { value: "export", icon: Download, label: "Export Report", shortLabel: "Export" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="profile">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="space-y-5">
                      <ProfileCard data={data.profile} />
                      <JobMatchScore data={data.jobMatch} />
                      <SkillGapChart data={data.skillGap} />
                      <SkillMatchVisualization skillGap={data.skillGap} jobMatch={data.jobMatch} />
                    </div>
                  </motion.div>
                </TabsContent>
                <TabsContent value="resume">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="space-y-5">
                      <ProjectImpact data={data.projectImpact} />
                      <WeaknessDetector data={data.weaknesses} />
                    </div>
                  </motion.div>
                </TabsContent>
                <TabsContent value="improvements">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <ResumeImprovements data={data.improvements} />
                  </motion.div>
                </TabsContent>
                <TabsContent value="interview">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <InterviewQuestions data={data.interviewQuestions} jobDescription={data._jobDescription} skills={data.profile.skills} />
                  </motion.div>
                </TabsContent>
                <TabsContent value="career">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <CareerRoleAnalyzer profile={data.profile} />
                    <div className="mt-5">
                      <CareerStrategyEngine
                        targetRole={data.profile.tagline || "Software Engineer"}
                        currentSkills={data.profile.skills}
                        missingSkills={data.skillGap.missing}
                        experience={data.profile.experience}
                        education={data.profile.education}
                      />
                    </div>
                  </motion.div>
                </TabsContent>
                <TabsContent value="jobs">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <JobMatching profile={data.profile} initialTab={navigationState?.initialJobsTab} />
                  </motion.div>
                </TabsContent>
                <TabsContent value="export">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <CareerReportExport analysis={data} />
                  </motion.div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
