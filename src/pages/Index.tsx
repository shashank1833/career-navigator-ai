import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, ArrowLeft, User, Target, MessageSquare, TrendingUp, Sparkles, FileText, Briefcase, Download } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import ParticleBackground from "@/components/3d/ParticleBackground";
import HeroBrain from "@/components/3d/HeroBrain";
import TiltCard from "@/components/3d/TiltCard";
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
import ResumeVersions from "@/components/ResumeVersions";
import CareerReportExport from "@/components/CareerReportExport";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import type { AnalysisResult } from "@/types/analysis";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const { versions, loading: versionsLoading, deleteVersion, saveOriginalResume } = useResumeVersions();

  // Load analysis data from navigation state (from Resume History)
  useEffect(() => {
    const state = location.state as { analysisData?: AnalysisResult; profileData?: AnalysisResult["profile"] } | null;
    if (state?.analysisData) {
      setData(state.analysisData);
      window.history.replaceState({}, document.title);
    } else if (state?.profileData) {
      // Partial data from resume version without full analysis - build minimal result
      setData({
        profile: state.profileData,
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
  }, [location.state]);

  // Save full analysis to DB when new analysis completes
  const handleAnalyze = (result: AnalysisResult) => {
    setData(result);
    // Save original resume with full analysis data
    saveOriginalResume(result.profile, result);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
              </Button>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Zap className="w-3.5 h-3.5 glow-text-primary" />
                <span className="text-xs font-medium text-primary">AI-Powered Career Intelligence</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <HeroBrain size="sm" />
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-10 h-10 glow-text-primary" />
            <h1 className="text-4xl sm:text-5xl font-extrabold gradient-text tracking-tight">Career Intelligence</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Upload your resume and unlock AI-driven insights to accelerate your career growth
          </p>
        </motion.header>

        <AnimatePresence mode="wait">
          {!data ? (
            <motion.div key="upload" exit={{ opacity: 0, y: -30, transition: { duration: 0.3 } }}>
              <ResumeUpload onAnalyze={handleAnalyze} />
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <div className="mb-6">
                <Button variant="ghost" onClick={() => setData(null)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" /> New Analysis
                </Button>
              </div>

              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="w-full flex flex-wrap justify-start gap-2 bg-muted/50 border border-border rounded-xl p-2 mb-8 h-auto min-h-[56px]">
                  <TabsTrigger value="profile" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Profile Overview</span>
                    <span className="sm:hidden">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="resume" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Projects</span>
                    <span className="sm:hidden">Projects</span>
                  </TabsTrigger>
                  <TabsTrigger value="improvements" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Resume</span>
                    <span className="sm:hidden">Resume</span>
                  </TabsTrigger>
                  <TabsTrigger value="interview" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Interview Prep</span>
                    <span className="sm:hidden">Interview</span>
                  </TabsTrigger>
                  <TabsTrigger value="career" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Career Growth</span>
                    <span className="sm:hidden">Career</span>
                  </TabsTrigger>
                  <TabsTrigger value="jobs" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Briefcase className="w-4 h-4" />
                    <span className="hidden sm:inline">Job Matching</span>
                    <span className="sm:hidden">Jobs</span>
                  </TabsTrigger>
                  <TabsTrigger value="export" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export Report</span>
                    <span className="sm:hidden">Export</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="space-y-5">
                      <TiltCard><ProfileCard data={data.profile} /></TiltCard>
                      <TiltCard><JobMatchScore data={data.jobMatch} /></TiltCard>
                      <TiltCard><SkillGapChart data={data.skillGap} /></TiltCard>
                      <TiltCard tiltAmount={6}><SkillMatchVisualization skillGap={data.skillGap} jobMatch={data.jobMatch} /></TiltCard>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="resume">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="space-y-5">
                      <div><ProjectImpact data={data.projectImpact} /></div>
                      <div><WeaknessDetector data={data.weaknesses} /></div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="improvements">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="space-y-5">
                      <ResumeImprovements data={data.improvements} />
                      <ResumeVersions
                        versions={versions}
                        loading={versionsLoading}
                        onDelete={deleteVersion}
                      />
                    </div>
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
                    <JobMatching profile={data.profile} />
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
