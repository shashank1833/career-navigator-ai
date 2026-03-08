import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    const jobDescription = formData.get("jobDescription") as string | null;
    const githubUsername = formData.get("githubUsername") as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No resume file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Read file as base64 for the AI to process
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.type || "application/pdf";

    // Build the analysis prompt
    const jobDescPart = jobDescription
      ? `\n\nThe candidate is applying for this job:\n"""${jobDescription}"""`
      : "\n\nNo specific job description was provided. Provide general career analysis.";

    const githubPart = githubUsername
      ? `\n\nThe candidate's GitHub username is: ${githubUsername}. Analyze their public profile if possible.`
      : "";

    const systemPrompt = `You are a career intelligence AI. Analyze the uploaded resume document thoroughly and return a comprehensive JSON analysis. Be accurate - extract real data from the document, don't make up information that isn't there.`;

    const userPrompt = `Analyze this resume document and return a JSON object with this EXACT structure. Extract real information from the document. For scores, provide realistic assessments based on the actual content.${jobDescPart}${githubPart}

Return ONLY valid JSON with this structure:
{
  "profile": {
    "name": "Full name from resume",
    "education": "Highest education",
    "experience": "X years",
    "skills": ["skill1", "skill2", ...],
    "technologies": ["tech1", "tech2", ...]
  },
  "skillGap": {
    "matching": ["skills that match the job"],
    "missing": ["required skills not in resume"],
    "suggested": ["additional skills to learn"]
  },
  "jobMatch": {
    "skillMatch": 0-100,
    "projectRelevance": 0-100,
    "experienceMatch": 0-100,
    "overall": 0-100
  },
  "improvements": [
    { "original": "weak bullet point from resume", "improved": "stronger version with metrics" }
  ],
  "interviewQuestions": {
    "technical": ["q1", "q2", "q3", "q4", "q5"],
    "conceptual": ["q1", "q2", "q3"],
    "behavioral": ["q1", "q2"]
  },
  "careerTrajectory": [
    { "role": "Role Name", "match": 0-100, "skills": ["needed skill1", "needed skill2"] }
  ],
  "weaknesses": [
    { "issue": "weakness description", "fix": "how to fix it" }
  ],
  "projectImpact": [
    { "name": "Project Name", "algorithm": 0-100, "depth": 0-100, "usefulness": 0-100, "deployment": 0-100 }
  ],
  "roadmap": {
    "goal": "Recommended career goal",
    "steps": [
      { "title": "Step title", "desc": "Step description", "done": false }
    ]
  },
  "github": {
    "username": "${githubUsername || "N/A"}",
    "repos": 0,
    "languages": [{ "name": "Lang", "pct": 0 }],
    "devScore": 0,
    "topProject": { "name": "project", "stars": 0, "forks": 0 },
    "activity": "N/A"
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      console.error("Failed to parse AI response as JSON:", jsonStr.substring(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse AI analysis", raw: content.substring(0, 1000) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
