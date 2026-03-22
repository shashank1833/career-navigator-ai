// Skill normalization utility to match related technologies

const SKILL_ALIASES: Record<string, string[]> = {
  "javascript": ["js", "es6", "es2015", "ecmascript", "vanilla js"],
  "typescript": ["ts"],
  "react": ["react.js", "reactjs", "react js"],
  "vue": ["vue.js", "vuejs", "vue js", "vue 3"],
  "angular": ["angularjs", "angular.js", "angular 2+"],
  "node.js": ["node", "nodejs", "node js"],
  "express": ["express.js", "expressjs"],
  "next.js": ["nextjs", "next"],
  "python": ["py", "python3", "python 3"],
  "java": ["jdk", "java se", "java ee"],
  "c#": ["csharp", "c sharp", "dotnet", ".net"],
  "c++": ["cpp", "c plus plus"],
  "ruby": ["ruby on rails", "rails", "ror"],
  "php": ["php7", "php8", "laravel", "symfony"],
  "go": ["golang"],
  "rust": ["rustlang"],
  "kotlin": ["kt"],
  "swift": ["swiftui"],
  "sql": ["mysql", "postgresql", "postgres", "mssql", "sql server", "sqlite", "oracle db"],
  "nosql": ["mongodb", "mongo", "dynamodb", "couchdb", "cassandra", "redis"],
  "aws": ["amazon web services", "ec2", "s3", "lambda", "aws cloud"],
  "azure": ["microsoft azure", "azure cloud"],
  "gcp": ["google cloud", "google cloud platform"],
  "docker": ["containers", "containerization"],
  "kubernetes": ["k8s", "kube"],
  "rest api": ["restful", "restful api", "rest", "rest apis", "api design"],
  "graphql": ["gql", "apollo graphql"],
  "git": ["github", "gitlab", "bitbucket", "version control"],
  "ci/cd": ["continuous integration", "continuous deployment", "jenkins", "github actions", "circleci"],
  "machine learning": ["ml", "deep learning", "ai", "artificial intelligence"],
  "tensorflow": ["tf"],
  "pytorch": ["torch"],
  "data science": ["data analysis", "analytics", "data analytics"],
  "html": ["html5"],
  "css": ["css3", "sass", "scss", "less", "tailwind", "tailwindcss", "bootstrap"],
  "spring": ["spring boot", "spring framework", "spring mvc"],
  "django": ["django rest framework", "drf"],
  "flask": ["flask api"],
  "agile": ["scrum", "kanban", "agile methodology"],
  "microservices": ["micro-services", "service-oriented architecture", "soa"],
  "testing": ["unit testing", "integration testing", "e2e testing", "test automation", "jest", "mocha", "pytest"],
};

// Create reverse lookup map
const SKILL_CANONICAL: Map<string, string> = new Map();
for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
  SKILL_CANONICAL.set(canonical.toLowerCase(), canonical);
  for (const alias of aliases) {
    SKILL_CANONICAL.set(alias.toLowerCase(), canonical);
  }
}

export const normalizeSkill = (skill: string): string => {
  const lower = skill.toLowerCase().trim();
  return SKILL_CANONICAL.get(lower) || skill.trim();
};

export const normalizeSkills = (skills: string[]): string[] => {
  const normalized = new Set<string>();
  for (const skill of skills) {
    normalized.add(normalizeSkill(skill));
  }
  return Array.from(normalized);
};

export const calculateSkillMatch = (
  userSkills: string[],
  jobSkills: string[]
): { matchingSkills: string[]; missingSkills: string[]; matchScore: number } => {
  const normalizedUserSkills = normalizeSkills(userSkills);
  const normalizedJobSkills = normalizeSkills(jobSkills);
  
  const userSkillSet = new Set(normalizedUserSkills.map(s => s.toLowerCase()));
  
  const matching: string[] = [];
  const missing: string[] = [];
  
  for (const skill of normalizedJobSkills) {
    if (userSkillSet.has(skill.toLowerCase())) {
      matching.push(skill);
    } else {
      missing.push(skill);
    }
  }
  
  const matchScore = normalizedJobSkills.length > 0 
    ? Math.round((matching.length / normalizedJobSkills.length) * 100)
    : 0;
  
  return { matchingSkills: matching, missingSkills: missing, matchScore };
};

export const extractSkillsFromText = (text: string): string[] => {
  const allKnownSkills = Array.from(SKILL_CANONICAL.keys());
  const lowerText = text.toLowerCase();
  const found: string[] = [];
  
  for (const skill of allKnownSkills) {
    // Match whole words only
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerText)) {
      found.push(SKILL_CANONICAL.get(skill) || skill);
    }
  }
  
  return [...new Set(found)];
};
