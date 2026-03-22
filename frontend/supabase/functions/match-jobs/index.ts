import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skills, technologies, experience, education, jobTitle } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a job market expert. Based on this candidate profile, generate 8 realistic job listings that would match their skills. Return jobs ranked by match score (highest first).

Candidate Profile:
- Skills: ${(skills || []).join(", ")}
- Technologies: ${(technologies || []).join(", ")}
- Experience: ${experience || "Not specified"}
- Education: ${education || "Not specified"}
${jobTitle ? `- Preferred Role: ${jobTitle}` : ""}

Return ONLY valid JSON array with this structure:
[
  {
    "id": "unique-id-string",
    "title": "Job Title",
    "company": "Company Name",
    "location": "City, Country (or Remote)",
    "type": "Full-time | Part-time | Contract",
    "salary": "$XX,000 - $XX,000",
    "description": "2-3 sentence job description",
    "requiredSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "matchingSkills": ["skills from candidate that match"],
    "missingSkills": ["required skills candidate lacks"],
    "matchScore": 0-100,
    "projectRelevance": 0-100,
    "experienceMatch": 0-100,
    "postedDate": "2026-03-XX",
    "applyUrl": "https://example.com/apply"
  }
]

Make the companies and roles realistic. Use real company names from the tech industry. Vary the match scores realistically.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a job market API that returns JSON job listings." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("Failed to generate job matches");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-jobs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
