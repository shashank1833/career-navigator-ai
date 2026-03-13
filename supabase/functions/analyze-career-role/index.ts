import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { targetRole, period, currentSkills, currentTechnologies, experience, education } = await req.json();
    const timeframe = period || "6-months";
    const periodLabel = timeframe.replace("-", " ");

    if (!targetRole) {
      return new Response(JSON.stringify({ error: "Target role is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const hasWorkExperience = experience && 
      experience !== "Not specified" && 
      /intern|full[- ]?time|work|job|employ|year|month|company|role|position/i.test(experience);

    const prompt = `You are a career advisor AI. A candidate wants to transition to the role: "${targetRole}" within a ${periodLabel} timeframe.

Their current profile:
- Skills: ${(currentSkills || []).join(", ") || "Not specified"}
- Technologies: ${(currentTechnologies || []).join(", ") || "Not specified"}
- Experience: ${experience || "Not specified"}
- Education: ${education || "Not specified"}

Analyze how well they match this target role and what skills they're missing.

IMPORTANT RULES:
- Only include skills that are DIRECTLY RELEVANT to the "${targetRole}" role. Do NOT list unrelated skills.
- For "matchingSkills" and "missingSkills": ONLY list practical frameworks, tools, libraries, platforms, and technologies (e.g. React, Docker, Kubernetes, TensorFlow, AWS, PostgreSQL). Do NOT include theoretical concepts, soft skills, or abstract topics.
- The roadmap steps should focus on learning specific tools and frameworks, NOT theory.
- CRITICAL: "experienceMatch" MUST be 0 if the candidate has NO internship or full-time work experience. Only assign non-zero if they clearly have internship or full-time professional experience relevant to the target role. Academic/personal projects do NOT count.
${!hasWorkExperience ? '- The candidate has NO work experience. Set "experienceMatch" to 0.' : ''}

Return ONLY valid JSON with this exact structure:
{
  "targetRole": "${targetRole}",
  "matchPercentage": 0-100,
  "matchBreakdown": {
    "skillMatch": 0-100,
    "experienceMatch": 0-100,
    "educationMatch": 0-100
  },
  "matchingSkills": ["ONLY practical tools/frameworks relevant to ${targetRole}"],
  "missingSkills": ["ONLY practical tools/frameworks required for ${targetRole} that candidate lacks"],
  "roadmap": {
    "goal": "Become a ${targetRole}",
    "steps": [
      {
        "title": "Learn [Tool/Framework Name]",
        "desc": "What to build and why this tool matters for the role",
        "done": false,
        "skills": ["specific tool or framework"],
        "links": [{ "label": "Official Docs", "url": "https://react.dev" }, { "label": "FreeCodeCamp Course", "url": "https://www.freecodecamp.org/learn" }]
      }
    ]
  },
  "timeEstimate": "Estimated time to be job-ready",
  "tips": ["2-3 actionable tips focused on practical tool adoption"]
}

Make the roadmap steps specifically address the missing skills. Include 5-8 roadmap steps.

CRITICAL RULES FOR LINKS:
- For EACH step, provide 2-5 resource links.
- ONLY use REAL, VERIFIED URLs that you are confident actually exist. Examples of good URLs:
  - Official documentation sites (e.g. https://react.dev, https://docs.docker.com, https://kubernetes.io/docs)
  - Well-known learning platforms (e.g. https://www.freecodecamp.org/learn, https://developer.mozilla.org, https://www.w3schools.com)
  - Official GitHub repos (e.g. https://github.com/facebook/react)
- DO NOT fabricate or guess URLs. Do NOT use placeholder URLs like "https://youtube.com/..." or made-up documentation paths.
- If you are not 100% sure a URL exists, DO NOT include it. Fewer real links are better than many broken ones.
- Prefer official documentation and well-known educational platforms over random blog posts.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a career transition advisor. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);

    // Force experienceMatch to 0 if no real work experience detected
    if (!hasWorkExperience && parsed.matchBreakdown) {
      parsed.matchBreakdown.experienceMatch = 0;
      // Recalculate overall match as weighted average
      const { skillMatch, educationMatch } = parsed.matchBreakdown;
      parsed.matchPercentage = Math.round((skillMatch * 0.5 + educationMatch * 0.3) / 0.8);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-career-role error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
