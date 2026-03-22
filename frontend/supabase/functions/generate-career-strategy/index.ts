import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { targetRole, currentSkills, missingSkills, experience, education } = await req.json();

    if (!targetRole) {
      return new Response(JSON.stringify({ error: "Target role is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a senior career strategist who creates actionable, month-by-month career transition plans. Focus on practical skills, real projects, and specific resources (courses, docs, tutorials). Be concrete and realistic.",
          },
          {
            role: "user",
            content: `Create a detailed career strategy for transitioning to: ${targetRole}

Current Skills: ${(currentSkills || []).join(", ") || "Not specified"}
Skill Gaps: ${(missingSkills || []).join(", ") || "Not specified"}
Experience: ${experience || "Not specified"}
Education: ${education || "Not specified"}

Return ONLY valid JSON in this exact format:
{
  "targetRole": "${targetRole}",
  "summary": "<1-2 sentence strategy overview>",
  "currentStrengths": ["<strength>", ...],
  "criticalGaps": ["<gap>", ...],
  "monthlyPlan": [
    {
      "month": 1,
      "title": "<month focus title>",
      "objective": "<what to achieve>",
      "tasks": ["<specific task>", ...],
      "resources": [{"title": "<resource name>", "url": "<real URL>", "type": "course|doc|tutorial|project"}],
      "milestone": "<measurable outcome>"
    }
  ],
  "totalMonths": <number>,
  "weeklyHours": <recommended hours per week>
}

Generate 3-6 months of plan. Use real, working URLs for resources. No markdown.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to generate strategy" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    console.error("generate-career-strategy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
