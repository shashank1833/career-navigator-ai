import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profile, job } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a resume optimization expert. Optimize this candidate's resume for the target job.

Candidate Profile:
- Name: ${profile.name}
- Skills: ${(profile.skills || []).join(", ")}
- Technologies: ${(profile.technologies || []).join(", ")}
- Experience: ${profile.experience}
- Education: ${profile.education}

Target Job:
- Title: ${job.title}
- Company: ${job.company}
- Required Skills: ${(job.requiredSkills || []).join(", ")}
- Description: ${job.description}

Return ONLY valid JSON with this structure:
{
  "applicationStrength": {
    "score": 0-100,
    "strongAreas": ["strength1", "strength2", "strength3"],
    "weakAreas": ["weakness1", "weakness2"],
    "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"]
  },
  "optimizedSections": {
    "summary": {
      "original": "Generate a generic professional summary based on the profile",
      "optimized": "Rewritten summary tailored to this specific job"
    },
    "skills": {
      "original": ${JSON.stringify(profile.skills || [])},
      "optimized": ["reordered and augmented skills list prioritizing job-relevant ones"],
      "added": ["new skills to highlight or learn"]
    },
    "bulletPoints": [
      {
        "original": "A generic bullet point about their experience",
        "optimized": "Rewritten to match job keywords and requirements"
      }
    ],
    "projects": [
      {
        "name": "Relevant project name",
        "relevance": "Why this project matters for the role",
        "highlight": "How to present it for maximum impact"
      }
    ]
  },
  "missingSkills": [
    { "skill": "skill name", "importance": "critical|recommended|nice-to-have", "learningPath": "How to acquire this skill quickly" }
  ]
}

Write like a real person. Avoid corporate buzzwords. Be specific and actionable.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a resume optimization expert returning structured JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("Failed to optimize resume");
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
    console.error("optimize-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
