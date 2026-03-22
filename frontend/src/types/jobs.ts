export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requiredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  matchScore: number;
  projectRelevance: number;
  experienceMatch: number;
  postedDate: string;
  applyUrl: string;
}

export interface ApplicationStrength {
  score: number;
  strongAreas: string[];
  weakAreas: string[];
  suggestions: string[];
}

export interface OptimizedSection {
  original: string;
  optimized: string;
}

export interface OptimizedSkills {
  original: string[];
  optimized: string[];
  added: string[];
}

export interface OptimizedProject {
  name: string;
  relevance: string;
  highlight: string;
}

export interface MissingSkill {
  skill: string;
  importance: "critical" | "recommended" | "nice-to-have";
  learningPath: string;
}

export interface ResumeOptimization {
  applicationStrength: ApplicationStrength;
  optimizedSections: {
    summary: OptimizedSection;
    skills: OptimizedSkills;
    bulletPoints: OptimizedSection[];
    projects: OptimizedProject[];
  };
  missingSkills: MissingSkill[];
}
