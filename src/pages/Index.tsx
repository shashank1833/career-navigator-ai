import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap } from "lucide-react";
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

const Index = () => {
  const [analyzed, setAnalyzed] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background orbs */}
      <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow" />
      <div className="floating-orb w-80 h-80 bg-secondary top-1/3 -left-40 animate-pulse-glow" style={{ animationDelay: "1s" }} />
      <div className="floating-orb w-64 h-64 bg-accent bottom-20 right-1/4 animate-pulse-glow" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
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
            <h1 className="text-4xl sm:text-5xl font-extrabold gradient-text tracking-tight">
              Career Intelligence
            </h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Upload your resume and unlock AI-driven insights to accelerate your career growth
          </p>
        </motion.header>

        <AnimatePresence mode="wait">
          {!analyzed ? (
            <motion.div key="upload" exit={{ opacity: 0, y: -30, transition: { duration: 0.3 } }}>
              <ResumeUpload onAnalyze={() => setAnalyzed(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              <ProfileCard />
              <JobMatchScore />
              <SkillGapChart />
              <ResumeImprovements />
              <CareerTrajectory />
              <ProjectImpact />
              <GitHubAnalyzer />
              <WeaknessDetector />
              <InterviewQuestions />
              <LearningRoadmap />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
