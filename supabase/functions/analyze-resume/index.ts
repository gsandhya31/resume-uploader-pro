import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sentry-trace, baggage',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SYSTEM_PROMPT = `You are an Expert Resume-JD Matching System.

Your task is to analyze a resume against a job description and produce a comprehensive skill analysis.

================================
SKILL MATCHING RULES (NUANCED)
================================

**Matching Philosophy:**
- Use INTELLIGENT matching, not just verbatim
- Recognize skill variations: "React.js" = "React" = "ReactJS"
- Treat similar skills as matches: "Python programming" = "Python"
- BUT: Different technologies are DIFFERENT: C ≠ C++, Java ≠ JavaScript, React ≠ React Native, Python 2 ≠ Python 3

**Skill Categories:**

1. MATCHED SKILLS (High Confidence)
   - Skill explicitly mentioned in BOTH resume and JD
   - Include semantic matches (e.g., "Python" matches "Python programming")
   - Provide evidence: exact text snippet from resume showing this skill
   - Rate confidence: HIGH (exact match with strong evidence), MEDIUM (semantic match or brief mention), LOW (implied but present)

2. MATCHED SKILLS (Weak Representation)
   - Skill is mentioned in resume BUT not demonstrated with depth
   - Examples of "weak":
     * Mentioned once without context ("Worked with AWS")
     * No quantifiable achievement ("Used SQL" vs "Optimized SQL queries reducing load time by 40%")
     * Listed in skills section but no work experience demonstrating it
     * Vague or generic mention without specifics
   - Still count as "matched" but flag for improvement

3. MISSING SKILLS - MUST HAVE
   - Skills in JD marked as: "required", "must have", "essential", "mandatory", "minimum"
   - Core technical skills for the role (e.g., "5+ years Python" for Python Developer role)
   - Skills mentioned multiple times in JD or in requirements section
   - Experience level requirements (e.g., "5+ years", "senior level")
   - NOT present in resume

4. MISSING SKILLS - OPTIONAL
   - Skills in JD marked as: "nice to have", "preferred", "bonus", "plus", "desirable"
   - Skills mentioned once without strong emphasis
   - Skills in "nice to have" or "bonus" sections
   - NOT present in resume

================================
JD PARSING INSTRUCTIONS
================================

When parsing the Job Description:
1. Identify section headers: "Requirements", "Must Have", "Qualifications", "Nice to Have", "Preferred", "Bonus"
2. Look for keyword signals:
   - Must-have indicators: "required", "must", "essential", "mandatory", "minimum", "qualifications"
   - Optional indicators: "preferred", "nice to have", "plus", "bonus", "desirable", "good to have"
3. Context matters: Skills in job title or first paragraph are usually must-have
4. If unclear, use frequency: mentioned 2+ times = must-have, mentioned once = optional
5. Years of experience requirements ALWAYS go in must-have

================================
OUTPUT FORMAT (STRICT JSON)
================================

Return ONLY valid JSON with this EXACT structure:

{
  "matchedSkills": [
    {
      "skill": "Python",
      "confidence": "high",
      "evidence": "Led Python-based automation reducing processing time by 50%",
      "isWeak": false
    },
    {
      "skill": "AWS",
      "confidence": "medium", 
      "evidence": "Worked with AWS services",
      "isWeak": true,
      "weaknessReason": "Mentioned once without specific AWS services or measurable achievements"
    }
  ],
  "missingSkills": {
    "mustHave": [
      "Docker",
      "5+ years experience"
    ],
    "optional": [
      "Kubernetes",
      "GraphQL"
    ]
  }
}

CRITICAL RULES:
- A skill can ONLY appear in ONE category (matched OR missing, not both)
- If a skill is weakly represented, it goes in matchedSkills with "isWeak": true
- Provide specific evidence for ALL matched skills (quote directly from resume)
- Deduplicate skills (if "Python" and "Python programming" both appear, use "Python" once)
- Use consistent casing (prefer capitalization from JD when available)
- Keep evidence quotes under 100 characters
- Weakness reasons should be specific and actionable`;

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { resumeText, jobDescription, companyName } = await req.json();
    const MODEL = "gpt-4o";

    // Validate inputs
    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "Missing resumeText or jobDescription" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check API key
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced user prompt
    const userPrompt = `
RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

TASK:
Analyze the resume against this job description. Identify:
1. Skills that match (with evidence and weakness flags if applicable)
2. Must-have skills that are missing (based on JD requirements)
3. Optional/nice-to-have skills that are missing

Provide specific evidence from the resume for matched skills.
Flag any matched skills that are weakly represented.
Categorize missing skills accurately as must-have vs optional.

Follow the output JSON structure exactly.
`;

    // Call OpenAI API
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
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content in OpenAI response" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and transform response
    let result;
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleanedContent);
      
      // Validate structure
      if (!result.matchedSkills || !result.missingSkills) {
        throw new Error("Invalid response structure - missing required fields");
      }

      // Ensure missingSkills has required structure
      if (!result.missingSkills.mustHave || !result.missingSkills.optional) {
        result.missingSkills = {
          mustHave: result.missingSkills.mustHave || [],
          optional: result.missingSkills.optional || []
        };
      }
      
      // Separate weak skills for easier frontend handling
      const strongSkills = result.matchedSkills.filter(s => !s.isWeak);
      const weakSkills = result.matchedSkills.filter(s => s.isWeak);
      
      // Transform for frontend
      const transformedResult = {
        matchedSkills: strongSkills,
        weakSkills: weakSkills,
        missingSkills: result.missingSkills,
        summary: {
          totalMatched: strongSkills.length,
          totalWeak: weakSkills.length,
          totalMissingMustHave: result.missingSkills.mustHave.length,
          totalMissingOptional: result.missingSkills.optional.length
        }
      };
      
      return new Response(
        JSON.stringify({ 
          ...transformedResult, 
          usage: data.usage,
          metadata: {
            model: MODEL,
            timestamp: new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse AI response", 
          raw: content.substring(0, 500), // First 500 chars for debugging
          details: parseError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Edge function error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
