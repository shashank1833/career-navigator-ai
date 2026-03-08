import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, ArrowLeft, User, Target, MessageSquare, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { AnalysisResult } from "@/types/analysis";
import type { LucideIcon } from "lucide-react";

const SectionHeader = ({ icon: Icon, title, subtitle, delay = 0 }: { icon: LucideIcon; title: string; subtitle: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="flex items-center gap-3 mb-5 mt-12 first:mt-0"
  >
    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
      <Icon className="w-5 h-5 glow-text-primary" />
    </div>
    <div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-4" />
  </motion.div>
);

const Index = () => {
  const [data, setData] = useState<AnalysisResult | null>(null);

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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-3.5 h-3.5 glow-text-primary" />
            <span className="text-xs font-medium text-primary">AI-Powered Career Intelligence</span>
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

              {/* Section 1: Profile & Match Overview */}
              <SectionHeader icon={User} title="Profile Overview" subtitle="Your extracted professional profile and job compatibility" delay={0.05} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <ProfileCard data={data.profile} />
                <JobMatchScore data={data.jobMatch} />
                <SkillGapChart data={data.skillGap} />
              </div>

              {/* Section 2: Resume & Project Analysis */}
              <SectionHeader icon={Sparkles} title="Resume & Project Analysis" subtitle="AI suggestions to strengthen your resume and project impact" delay={0.2} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <ResumeImprovements data={data.improvements} />
                <ProjectImpact data={data.projectImpact} />
                <WeaknessDetector data={data.weaknesses} />
              </div>

              {/* Section 3: Interview Prep */}
              <SectionHeader icon={MessageSquare} title="Interview Preparation" subtitle="AI-generated questions tailored to your profile and target role" delay={0.35} />
              <div className="grid grid-cols-1 gap-5">
                <InterviewQuestions data={data.interviewQuestions} />
              </div>

              {/* Section 4: Career Growth */}
              <SectionHeader icon={TrendingUp} title="Career Growth" subtitle="Career trajectory predictions and personalized learning path" delay={0.5} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <CareerTrajectory data={data.careerTrajectory} />
                {data.github && data.github.username !== "N/A" && <GitHubAnalyzer data={data.github} />}
              </div>
              <div className="grid grid-cols-1 gap-5 mt-5">
                <LearningRoadmap data={data.roadmap} />
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
