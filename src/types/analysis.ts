// Types for AI analysis results
export interface AnalysisProfile {
  name: string;
  education: string;
  experience: string;
  skills: string[];
  technologies: string[];
}

export interface AnalysisSkillGap {
  matching: string[];
  missing: string[];
  suggested: string[];
}

export interface AnalysisJobMatch {
  skillMatch: number;
  projectRelevance: number;
  experienceMatch: number;
  overall: number;
}

export interface AnalysisImprovement {
  original: string;
  improved: string;
}

export interface AnalysisInterviewQuestions {
  technical: string[];
  conceptual: string[];
  behavioral: string[];
}

export interface AnalysisCareerPath {
  role: string;
  match: number;
  skills: string[];
}

export interface AnalysisWeakness {
  issue: string;
  fix: string;
}

export interface AnalysisProjectImpact {
  name: string;
  algorithm: number;
  depth: number;
  usefulness: number;
  deployment: number;
}

export interface AnalysisRoadmapStep {
  title: string;
  desc: string;
  done: boolean;
}

export interface AnalysisRoadmap {
  goal: string;
  steps: AnalysisRoadmapStep[];
}

export interface AnalysisGitHub {
  username: string;
  repos: number;
  languages: { name: string; pct: number }[];
  devScore: number;
  topProject: { name: string; stars: number; forks: number };
  activity: string;
}

export interface AnalysisResult {
  profile: AnalysisProfile;
  skillGap: AnalysisSkillGap;
  jobMatch: AnalysisJobMatch;
  improvements: AnalysisImprovement[];
  interviewQuestions: AnalysisInterviewQuestions;
  careerTrajectory: AnalysisCareerPath[];
  weaknesses: AnalysisWeakness[];
  projectImpact: AnalysisProjectImpact[];
  roadmap: AnalysisRoadmap;
  github: AnalysisGitHub;
}
