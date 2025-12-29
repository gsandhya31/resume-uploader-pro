# Resume-JD Matcher

AI-powered tool to analyze resume alignment with job descriptions.

## Demo
[Live Link] | [Video Walkthrough]

## Product Overview
- **Problem**: Job seekers don't know which skills to emphasize
- **Solution**: AI-powered skill gap analysis with actionable insights
- **Impact**: Helps users optimize resumes for specific roles

## Key Features
- Intelligent skill matching (semantic + strict)
- Must-have vs optional skill categorization
- Weak skill detection with improvement guidance
- Real-time analysis in <15 seconds

## Technical Stack
- Frontend: React, TypeScript, Tailwind CSS (built with Lovable)
- Backend: Supabase Edge Functions
- AI: OpenAI GPT-4o with custom prompt engineering
- Deployment: Vercel + Supabase

## AI Product Management Highlights
- Comprehensive PRD with user stories
- Strategic MVP scoping decisions
- Prompt engineering for nuanced analysis
- Extensive testing with synthetic data

## Architecture Decisions
[Explain single API call vs pipeline approach]
[Discuss prompt engineering strategy]
[Show sample input/output]

## Future Roadmap
[List US-8/9 and beyond]
```

### LinkedIn Post Template
```
🚀 Just shipped my Resume-JD Matcher MVP!

As an AI Product Manager, I wanted to showcase my skills by building something practical.

🎯 What it does:
Analyzes your resume against any job description and tells you:
- Which skills match (with evidence from your resume)
- Which skills are weakly represented
- Critical missing must-have skills
- Optional nice-to-have skills

🤖 Technical approach:
Built using GPT-4o with carefully engineered prompts that:
✅ Understand "React.js" = "React" (semantic matching)
✅ Distinguish C++ ≠ C (strict language matching)
✅ Detect weak representations ("Worked with AWS" vs "Built AWS infrastructure serving 1M users")

💡 Key PM insight:
Instead of just showing matched/missing skills, I focused on ACTIONABILITY - telling users exactly WHY a skill is weak and HOW to improve it.

Try it: [link]
Code: [GitHub link]

#ProductManagement #AI #CareerTools #JobSearch
