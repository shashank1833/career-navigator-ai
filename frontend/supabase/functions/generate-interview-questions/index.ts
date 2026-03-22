import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jobDescription, skills } = await req.json();

    if (!jobDescription) {
      return new Response(JSON.stringify({ error: "Job description is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const skillsList = skills?.length ? skills.join(", ") : "general software engineering";

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
            content: "You are an expert technical interviewer with deep knowledge of the most commonly repeated interview questions across FAANG, Big Tech, and top startups. Focus on the questions that appear MOST FREQUENTLY in real interviews. Write in a conversational, human tone.",
          },
          {
            role: "user",
            content: `Given this job description:\n"""${jobDescription}"""\n\nThe candidate has these skills: ${skillsList}\n\nGenerate the MOST FREQUENTLY ASKED interview questions for this role. Focus on questions that are repeatedly asked across companies. Each question must include a difficulty level. Use this EXACT JSON format:\n{\n  "technical": [{"question": "...", "difficulty": "Easy|Medium|Hard"}] (40 items),\n  "conceptual": [{"question": "...", "difficulty": "Easy|Medium|Hard"}] (7 items),\n  "behavioral": [{"question": "...", "difficulty": "Easy|Medium|Hard"}] (7 items)\n}\n\nDifficulty guidelines:\n- Easy: Common screening questions, straightforward answers\n- Medium: Requires solid understanding, multi-step reasoning\n- Hard: Deep expertise needed, complex scenarios, system-level thinking\n\nReturn ONLY valid JSON, no markdown.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Failed to generate questions" }), {
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
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-interview-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
