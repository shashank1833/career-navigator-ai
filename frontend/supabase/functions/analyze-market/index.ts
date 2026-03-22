import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TECH_CATEGORIES: Record<string, string[]> = {
  "Programming Languages": ["javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "kotlin", "swift", "scala"],
  "Frameworks": ["react", "angular", "vue", "node.js", "express", "django", "flask", "spring", "next.js", "svelte", "fastapi"],
  "Cloud Platforms": ["aws", "azure", "gcp", "heroku", "vercel", "netlify"],
  "DevOps Tools": ["docker", "kubernetes", "terraform", "ansible", "jenkins", "ci/cd", "github actions"],
  "Databases": ["sql", "nosql", "mongodb", "postgresql", "redis", "elasticsearch", "dynamodb", "mysql"],
  "Data & AI": ["machine learning", "data science", "tensorflow", "pytorch", "pandas", "spark"],
};

const KNOWN_SKILLS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "kotlin", "swift", "scala",
  "react", "angular", "vue", "node.js", "express", "django", "flask", "spring", "spring boot", "next.js", "svelte", "fastapi",
  "aws", "azure", "gcp", "heroku", "vercel",
  "docker", "kubernetes", "terraform", "ansible", "jenkins", "ci/cd", "github actions",
  "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "dynamodb",
  "machine learning", "data science", "tensorflow", "pytorch",
  "rest api", "graphql", "microservices", "git", "agile", "scrum",
  "html", "css", "sass", "tailwind", "bootstrap",
  "linux", "serverless", "kafka", "rabbitmq",
];

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const skill of KNOWN_SKILLS) {
    if (lower.includes(skill)) found.push(skill);
  }
  return [...new Set(found)];
}

function getCategoryForSkill(skill: string): string {
  const lower = skill.toLowerCase();
  for (const [category, skills] of Object.entries(TECH_CATEGORIES)) {
    if (skills.some(s => lower.includes(s) || s.includes(lower))) return category;
  }
  return "Other";
}

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

    const { jobTitle, location, userSkills } = await req.json();
    const searchTerms = jobTitle || "software developer";
    const searchLocation = location || "us";

    // Fetch multiple pages for better analysis
    const pages = [1, 2, 3];
    const allJobs: any[] = [];

    for (const page of pages) {
      const url = `https://api.adzuna.com/v1/api/jobs/${searchLocation}/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=50&what=${encodeURIComponent(searchTerms)}&content-type=application/json`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        allJobs.push(...(data.results || []));
      }
    }

    const totalJobs = allJobs.length;
    if (totalJobs === 0) {
      return new Response(JSON.stringify({ error: "No jobs found for this search" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Skill demand analysis
    const skillCounts: Record<string, number> = {};
    for (const job of allJobs) {
      const text = (job.title || "") + " " + (job.description || "");
      const skills = extractSkills(text);
      for (const skill of skills) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
    }

    const skillDemand = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count, percentage: Math.round((count / totalJobs) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // 2. Technology category breakdown
    const categoryBreakdown: Record<string, { skills: Record<string, number> }> = {};
    for (const { skill, count } of skillDemand) {
      const cat = getCategoryForSkill(skill);
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { skills: {} };
      categoryBreakdown[cat].skills[skill] = count;
    }

    const technologyCategories = Object.entries(categoryBreakdown).map(([category, data]) => ({
      category,
      skills: Object.entries(data.skills)
        .map(([skill, count]) => ({
          skill,
          count,
          percentage: Math.round((count / totalJobs) * 100),
          demand: count / totalJobs > 0.5 ? "High" : count / totalJobs > 0.25 ? "Medium" : "Emerging",
        }))
        .sort((a, b) => b.count - a.count),
    })).sort((a, b) => b.skills.reduce((s, sk) => s + sk.count, 0) - a.skills.reduce((s, sk) => s + sk.count, 0));

    // 3. Salary insights
    const salaries = allJobs
      .filter(j => j.salary_min && j.salary_max && j.salary_min > 0)
      .map(j => ({ min: j.salary_min, max: j.salary_max, avg: (j.salary_min + j.salary_max) / 2 }));

    let salaryInsights = null;
    if (salaries.length > 0) {
      const avgValues = salaries.map(s => s.avg).sort((a, b) => a - b);
      const medianIdx = Math.floor(avgValues.length / 2);
      salaryInsights = {
        average: Math.round(avgValues.reduce((s, v) => s + v, 0) / avgValues.length),
        median: Math.round(avgValues[medianIdx]),
        min: Math.round(Math.min(...salaries.map(s => s.min))),
        max: Math.round(Math.max(...salaries.map(s => s.max))),
        sampleSize: salaries.length,
        distribution: [
          { range: "$0-50k", count: avgValues.filter(v => v < 50000).length },
          { range: "$50-75k", count: avgValues.filter(v => v >= 50000 && v < 75000).length },
          { range: "$75-100k", count: avgValues.filter(v => v >= 75000 && v < 100000).length },
          { range: "$100-125k", count: avgValues.filter(v => v >= 100000 && v < 125000).length },
          { range: "$125-150k", count: avgValues.filter(v => v >= 125000 && v < 150000).length },
          { range: "$150k+", count: avgValues.filter(v => v >= 150000).length },
        ],
      };
    }

    // 4. Skill gap comparison
    const normalizedUserSkills = (userSkills || []).map((s: string) => s.toLowerCase().trim());
    const userSkillSet = new Set(normalizedUserSkills);

    const skillGap = skillDemand.map(({ skill, percentage }) => ({
      skill,
      demandPercentage: percentage,
      userHas: userSkillSet.has(skill.toLowerCase()),
    }));

    const missingHighDemand = skillGap
      .filter(s => !s.userHas && s.demandPercentage > 20)
      .sort((a, b) => b.demandPercentage - a.demandPercentage);

    const matchingSkills = skillGap.filter(s => s.userHas);

    // 5. Emerging trends (skills with moderate demand = growing)
    const emergingSkills = skillDemand
      .filter(s => s.percentage >= 10 && s.percentage <= 40)
      .map(s => ({
        skill: s.skill,
        percentage: s.percentage,
        trend: s.percentage > 30 ? "Growing demand" : s.percentage > 20 ? "Rapid growth" : "Emerging trend",
      }))
      .slice(0, 10);

    return new Response(JSON.stringify({
      totalJobsAnalyzed: totalJobs,
      searchTerm: searchTerms,
      skillDemand,
      technologyCategories,
      salaryInsights,
      skillGap: {
        matching: matchingSkills,
        missing: missingHighDemand,
        coverageScore: skillGap.length > 0 ? Math.round((matchingSkills.length / skillGap.length) * 100) : 0,
      },
      emergingSkills,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Market analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
