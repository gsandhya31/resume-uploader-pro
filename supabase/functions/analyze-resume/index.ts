import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SYSTEM_PROMPT = `You are an Expert Resume Reviewer.

Your task is to analyze a resume and a job description and produce ONLY TWO outputs:

1. Matched Skills
2. Missing Skills

--------------------------------
SKILL MATCHING RULES (STRICT)
--------------------------------

Definitions:
- A "Matched Skill" is a skill that is explicitly mentioned verbatim in BOTH the resume text and the job description.
- A "Missing Skill" is a skill that is explicitly mentioned verbatim in the job description BUT does NOT appear anywhere in the resume text.

Rules:
- Use ONLY exact, verbatim matches.
- Do NOT infer, assume, or semantically guess skills.
- If a skill is not written explicitly in the resume, it MUST be treated as missing.
- Do NOT include implied, related, or weakly suggested skills.
- A skill must appear in ONLY ONE list:
  - If matched, it must NOT appear in missing.
  - If missing, it must NOT appear in matched.
- Deduplicate skills.
- Normalize skill names using consistent casing.

--------------------------------
OUTPUT REQUIREMENTS (STRICT)
--------------------------------

Return ONLY valid JSON.
Do NOT include explanations, markdown, or additional text.

The JSON response MUST follow this exact structure:
{
  "matchedSkills": ["Skill 1", "Skill 2"],
  "missingSkills": ["Skill 3", "Skill 4"]
}`;

serve(async (req) => {
  // 1. Handle CORS Preflight (OPTIONS request)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    // 2. Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { resumeText, jobDescription, companyName } = await req.json();
    
    const MODEL = "gpt-4o-mini";
    
    console.log("=== analyze-resume function called ===");
    console.log("Model:", MODEL);
    console.log("Resume length:", resumeText?.length || 0);
    console.log("JD length:", jobDescription?.length || 0);
    console.log("Company:", companyName || "Not provided");

    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "Missing resumeText or jobDescription" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `Resume Text:
${resumeText}

Job Description:
${jobDescription}

${companyName ? `Target Company: ${companyName}` : ''}

Analyze the above and return the matched skills as JSON.`;

    console.log("Calling OpenAI API directly with model:", MODEL);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("OpenAI response received. Model used:", data.model);
    console.log("Response content:", content);

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from OpenAI" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from AI
    let result;
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse OpenAI response", raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract token usage from OpenAI response
    const usage = data.usage;
    const usageData = usage ? {
      input: usage.prompt_tokens,
      output: usage.completion_tokens,
      total: usage.total_tokens
    } : null;

    console.log("Token usage:", usageData);
    console.log("Returning result:", result);

    return new Response(
      JSON.stringify({ ...result, usage: usageData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-resume function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
