import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, ArrowLeft, User, Target, MessageSquare, TrendingUp, Sparkles, FileText, Briefcase, Download } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ResumeUpload from "@/components/ResumeUpload";
import ProfileCard from "@/components/ProfileCard";
import SkillGapChart from "@/components/SkillGapChart";
import JobMatchScore from "@/components/JobMatchScore";
import InterviewQuestions from "@/components/InterviewQuestions";
import CareerTrajectory from "@/components/CareerTrajectory";
import ResumeImprovements from "@/components/ResumeImprovements";
import GitHubAnalyzer from "@/components/GitHubAnalyzer";
import WeaknessDetector from "@/components/WeaknessDetector";
import LearningRoadmap from "@/components/LearningRoadmap";
import ProjectImpact from "@/components/ProjectImpact";
import JobMatching from "@/components/JobMatching";
import ResumeVersions from "@/components/ResumeVersions";
import CareerReportExport from "@/components/CareerReportExport";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import type { AnalysisResult } from "@/types/analysis";

const Index = () => {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const { versions, loading: versionsLoading, deleteVersion } = useResumeVersions();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow" />
      <div className="floating-orb w-80 h-80 bg-secondary top-1/3 -left-40 animate-pulse-glow" style={{ animationDelay: "1s" }} />
      <div className="floating-orb w-64 h-64 bg-accent bottom-20 right-1/4 animate-pulse-glow" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-3.5 h-3.5 glow-text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Career Intelligence</span>
            </div>
            <ThemeToggle />
          </div>
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
              <ResumeUpload onAnalyze={(result) => setData(result)} />
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <div className="mb-6">
                <Button variant="ghost" onClick={() => setData(null)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" /> New Analysis
                </Button>
              </div>

              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="w-full flex justify-start gap-2 bg-muted/50 border border-border rounded-xl p-2 mb-8 overflow-x-auto">
                  <TabsTrigger value="profile" className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">Profile Overview</span>
                    <span className="sm:hidden">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="resume" className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Sparkles className="w-5 h-5" />
                    <span className="hidden sm:inline">Projects</span>
                    <span className="sm:hidden">Projects</span>
                  </TabsTrigger>
                  <TabsTrigger value="improvements" className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <FileText className="w-5 h-5" />
                    <span className="hidden sm:inline">Resume</span>
                    <span className="sm:hidden">Resume</span>
                  </TabsTrigger>
                  <TabsTrigger value="interview" className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <MessageSquare className="w-5 h-5" />
                    <span className="hidden sm:inline">Interview Prep</span>
                    <span className="sm:hidden">Interview</span>
                  </TabsTrigger>
                  <TabsTrigger value="career" className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <TrendingUp className="w-5 h-5" />
                    <span className="hidden sm:inline">Career Growth</span>
                    <span className="sm:hidden">Career</span>
                  </TabsTrigger>
                  <TabsTrigger value="jobs" className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Briefcase className="w-5 h-5" />
                    <span className="hidden sm:inline">Job Matching</span>
                    <span className="sm:hidden">Jobs</span>
                  </TabsTrigger>
                  <TabsTrigger value="export" className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Download className="w-5 h-5" />
                    <span className="hidden sm:inline">Export Report</span>
                    <span className="sm:hidden">Export</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="space-y-5">
                      <div><ProfileCard data={data.profile} /></div>
                      <div><JobMatchScore data={data.jobMatch} /></div>
                      <div><SkillGapChart data={data.skillGap} /></div>
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
                    <InterviewQuestions data={data.interviewQuestions} jobDescription={data._jobDescription} />
                  </motion.div>
                </TabsContent>

                <TabsContent value="career">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="space-y-5">
                      <div><CareerTrajectory data={data.careerTrajectory} /></div>
                      {data.github && data.github.username !== "N/A" && <div><GitHubAnalyzer data={data.github} /></div>}
                      <div><LearningRoadmap data={data.roadmap} /></div>
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
