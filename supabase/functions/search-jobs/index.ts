import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Skill normalization for matching
const SKILL_ALIASES: Record<string, string[]> = {
  "javascript": ["js", "es6", "ecmascript"],
  "typescript": ["ts"],
  "react": ["react.js", "reactjs"],
  "node.js": ["node", "nodejs"],
  "python": ["py", "python3"],
  "rest api": ["restful", "rest", "api"],
  "aws": ["amazon web services", "ec2", "s3", "lambda"],
  "docker": ["containers"],
  "kubernetes": ["k8s"],
  "sql": ["mysql", "postgresql", "postgres"],
  "nosql": ["mongodb", "mongo", "dynamodb"],
  "machine learning": ["ml", "deep learning", "ai"],
  "spring": ["spring boot"],
};

const SKILL_CANONICAL: Map<string, string> = new Map();
for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
  SKILL_CANONICAL.set(canonical.toLowerCase(), canonical);
  for (const alias of aliases) {
    SKILL_CANONICAL.set(alias.toLowerCase(), canonical);
  }
}

const normalizeSkill = (skill: string): string => {
  const lower = skill.toLowerCase().trim();
  return SKILL_CANONICAL.get(lower) || skill.trim();
};

const extractSkillsFromText = (text: string): string[] => {
  const knownSkills = [
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php",
    "react", "angular", "vue", "node.js", "express", "django", "flask", "spring", "spring boot",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "git", "ci/cd", "jenkins", "github actions", "agile", "scrum",
    "rest api", "graphql", "microservices", "machine learning", "data science",
    "html", "css", "sass", "tailwind", "bootstrap"
  ];
  
  const lowerText = text.toLowerCase();
  const found: string[] = [];
  
  for (const skill of knownSkills) {
    if (lowerText.includes(skill)) {
      found.push(normalizeSkill(skill));
    }
  }
  
  return [...new Set(found)];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ADZUNA_APP_ID = Deno.env.get("ADZUNA_APP_ID");
    const ADZUNA_API_KEY = Deno.env.get("ADZUNA_API_KEY");

    if (!ADZUNA_APP_ID || !ADZUNA_API_KEY) {
      throw new Error("Adzuna API credentials not configured");
    }

    const { skills, technologies, jobTitle, location, page = 1 } = await req.json();

    // Build search query from skills and job title
    const searchTerms = jobTitle || (skills?.slice(0, 3).join(" ") || "software developer");
    const searchLocation = location || "us";
    
    // Adzuna API call
    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${searchLocation}/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=20&what=${encodeURIComponent(searchTerms)}&content-type=application/json`;

    const response = await fetch(adzunaUrl);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Adzuna API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const userSkills = [...(skills || []), ...(technologies || [])].map(normalizeSkill);
    const userSkillSet = new Set(userSkills.map(s => s.toLowerCase()));

    // Transform Adzuna results to our format with match scoring
    const jobs = (data.results || []).map((job: any, index: number) => {
      const description = job.description || "";
      const jobSkills = extractSkillsFromText(description + " " + job.title);
      
      const matching: string[] = [];
      const missing: string[] = [];
      
      for (const skill of jobSkills) {
        if (userSkillSet.has(skill.toLowerCase())) {
          matching.push(skill);
        } else {
          missing.push(skill);
        }
      }

      // Calculate match score
      const skillMatchRatio = jobSkills.length > 0 ? matching.length / jobSkills.length : 0;
      const matchScore = Math.round(skillMatchRatio * 100);

      return {
        id: job.id || `adzuna-${index}-${Date.now()}`,
        title: job.title,
        company: job.company?.display_name || "Unknown Company",
        location: job.location?.display_name || "Remote",
        type: job.contract_type || "Full-time",
        salary: job.salary_min && job.salary_max 
          ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k`
          : "Competitive",
        description: description.slice(0, 500),
        requiredSkills: jobSkills,
        matchingSkills: matching,
        missingSkills: missing,
        matchScore,
        projectRelevance: Math.min(100, matchScore + Math.floor(Math.random() * 15)),
        experienceMatch: Math.min(100, matchScore + Math.floor(Math.random() * 20)),
        postedDate: job.created ? new Date(job.created).toLocaleDateString() : "Recent",
        applyUrl: job.redirect_url || "#",
      };
    });

    // Sort by match score
    jobs.sort((a: any, b: any) => b.matchScore - a.matchScore);

    return new Response(JSON.stringify(jobs), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search jobs error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
