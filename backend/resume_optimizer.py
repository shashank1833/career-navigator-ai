"""
Resume Optimizer Module - LLM-powered job-specific resume modification.

Flow:
1. Parse structured resume data + job description
2. Extract keywords from job description
3. Match skills between resume and job
4. Send structured input to Claude for optimization
5. Return structured optimized resume content
"""

import os
import json
import re
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)


# ─── Input / Output Models ───────────────────────────────────────────

class ResumeExperience(BaseModel):
    title: str = ""
    company: str = ""
    duration: str = ""
    bullets: List[str] = []

class ResumeProject(BaseModel):
    name: str = ""
    description: str = ""
    technologies: List[str] = []

class ResumeProfile(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    tagline: str = ""
    summary: str = ""
    skills: List[str] = []
    experience_text: str = ""
    education: str = ""
    experiences: List[ResumeExperience] = []
    projects: List[ResumeProject] = []

class JobInput(BaseModel):
    title: str = ""
    company: str = ""
    location: str = ""
    description: str = ""
    required_skills: List[str] = []

class OptimizeRequest(BaseModel):
    profile: ResumeProfile
    job: JobInput

class OptimizedExperience(BaseModel):
    title: str = ""
    company: str = ""
    duration: str = ""
    bullets: List[str] = []

class OptimizedProject(BaseModel):
    name: str = ""
    description: str = ""
    technologies: List[str] = []

class OptimizedResume(BaseModel):
    summary: str = ""
    skills: List[str] = []
    experiences: List[OptimizedExperience] = []
    projects: List[OptimizedProject] = []

class KeywordAnalysis(BaseModel):
    extracted_keywords: List[str] = []
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    injected_keywords: List[str] = []

class ApplicationStrength(BaseModel):
    score: int = 0
    strong_areas: List[str] = []
    weak_areas: List[str] = []
    suggestions: List[str] = []

class OptimizeResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_profile: ResumeProfile
    optimized_resume: OptimizedResume
    job_title: str = ""
    company_name: str = ""
    keyword_analysis: KeywordAnalysis
    application_strength: ApplicationStrength
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ─── Keyword Extraction (rule-based, pre-LLM) ──────────────────────

COMMON_TECH_KEYWORDS = {
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "nodejs", "express", "django", "flask", "fastapi", "spring",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "sql", "nosql", "mongodb", "postgresql", "mysql", "redis",
    "git", "ci/cd", "jenkins", "github actions", "rest", "graphql",
    "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "agile", "scrum", "jira", "figma", "html", "css", "tailwind",
    "go", "rust", "c++", "c#", ".net", "swift", "kotlin",
    "microservices", "api", "devops", "linux", "bash",
    "data analysis", "data engineering", "etl", "spark", "hadoop",
    "tableau", "power bi", "excel", "r", "scala",
    "security", "oauth", "jwt", "saas", "b2b", "b2c",
    "product management", "project management", "leadership",
    "communication", "problem solving", "teamwork",
}


def extract_keywords_from_job(job_description: str, required_skills: List[str]) -> List[str]:
    """Extract relevant keywords from a job description using rule-based matching."""
    keywords = set()

    # Add explicitly provided required skills
    for skill in required_skills:
        keywords.add(skill.lower().strip())

    # Extract from description text
    desc_lower = job_description.lower()
    for kw in COMMON_TECH_KEYWORDS:
        if kw in desc_lower:
            keywords.add(kw)

    # Extract multi-word phrases that look like skills (e.g., "3+ years of X")
    patterns = [
        r"(?:experience with|proficiency in|knowledge of|familiar with|expertise in|skilled in)\s+([a-zA-Z0-9\s\+\#\.\/]+?)(?:\.|,|;|\band\b|\bor\b|$)",
        r"(?:strong|excellent|good)\s+([a-zA-Z\s]+?)(?:\s+skills|\.|,|;|$)",
    ]
    for pattern in patterns:
        matches = re.findall(pattern, desc_lower)
        for match in matches:
            cleaned = match.strip().rstrip(".")
            if 2 < len(cleaned) < 40:
                keywords.add(cleaned)

    return sorted(list(keywords))


def match_skills(resume_skills: List[str], job_keywords: List[str]) -> Dict[str, List[str]]:
    """Compare resume skills against job keywords."""
    resume_lower = {s.lower().strip() for s in resume_skills}
    job_lower = {k.lower().strip() for k in job_keywords}

    matched = []
    missing = []

    for kw in job_lower:
        found = False
        for rs in resume_lower:
            if kw in rs or rs in kw:
                matched.append(kw)
                found = True
                break
        if not found:
            missing.append(kw)

    return {"matched": sorted(matched), "missing": sorted(missing)}


# ─── LLM Optimization ──────────────────────────────────────────────

async def optimize_resume_with_llm(
    profile: ResumeProfile,
    job: JobInput,
    job_keywords: List[str],
    skill_match: Dict[str, List[str]],
) -> Dict[str, Any]:
    """Use Claude to intelligently modify resume content for a target job."""

    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        raise ValueError("EMERGENT_LLM_KEY not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=f"resume-opt-{uuid.uuid4()}",
        system_message="""You are an expert resume optimization AI. You modify resume content to align with specific job descriptions while maintaining truthfulness and professionalism.

RULES:
1. ONLY modify content - never change the structure/template order.
2. Keep all information truthful - don't fabricate experience or skills.
3. Only add skills that are supported by the candidate's existing experience/projects.
4. Use strong action verbs in experience bullet points.
5. Include measurable impact where possible (numbers, percentages, scale).
6. Inject job keywords naturally - NO keyword stuffing.
7. Reorder skills so the most relevant ones for this job appear first.
8. Keep the summary concise (2-4 sentences) and aligned with the target role.
9. Prioritize experience/projects most relevant to the target job.
10. Output ONLY valid JSON - no markdown, no code fences, no extra text."""
    ).with_model("anthropic", "claude-4-sonnet-20250514")

    # Build structured input for the LLM
    structured_input = {
        "resume": {
            "name": profile.name,
            "current_summary": profile.summary or profile.tagline or "",
            "skills": profile.skills,
            "experiences": [
                {
                    "title": exp.title,
                    "company": exp.company,
                    "duration": exp.duration,
                    "bullets": exp.bullets,
                }
                for exp in profile.experiences
            ],
            "projects": [
                {
                    "name": proj.name,
                    "description": proj.description,
                    "technologies": proj.technologies,
                }
                for proj in profile.projects
            ],
            "education": profile.education,
            "experience_text": profile.experience_text,
        },
        "target_job": {
            "title": job.title,
            "company": job.company,
            "description": job.description[:2000],  # Limit size
        },
        "keyword_analysis": {
            "job_keywords": job_keywords,
            "matched_skills": skill_match["matched"],
            "missing_skills": skill_match["missing"],
        },
    }

    prompt = f"""Optimize this resume for the target job. Here is the structured input:

{json.dumps(structured_input, indent=2)}

Return a JSON object with EXACTLY this structure:
{{
  "summary": "Rewritten professional summary (2-4 sentences) aligned with the target role, highlighting relevant experience and domain keywords",
  "skills": ["skill1", "skill2", ...],
  "experiences": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Duration",
      "bullets": [
        "Action verb + what you did + technology used + measurable impact",
        "..."
      ]
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "description": "Rewritten description emphasizing relevance to target job",
      "technologies": ["tech1", "tech2"]
    }}
  ],
  "application_strength": {{
    "score": 75,
    "strong_areas": ["area1", "area2", "area3"],
    "weak_areas": ["area1", "area2"],
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
  }},
  "injected_keywords": ["keyword1", "keyword2"]
}}

IMPORTANT RULES for the optimization:
- SUMMARY: Rewrite to align with "{job.title}" role at "{job.company}". Highlight relevant experience and domain.
- SKILLS: Reorder so most relevant skills appear first. Only add skills that are supported by existing experience/projects. Remove irrelevant skills from prominent positions (move to end, don't delete).
- EXPERIENCES: Rewrite bullet points with action verbs, technologies, and measurable impact. Prioritize experience most relevant to the target job. Keep all experiences but reorder by relevance.
- PROJECTS: Rewrite descriptions to emphasize relevance to the target job. Prioritize relevant projects.
- SCORE: Rate 0-100 how well the optimized resume matches the job.
- Only include skills in "injected_keywords" that were naturally added from the missing keywords list and are supported by the candidate's background.

Return ONLY the JSON object, no other text."""

    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)

    # Parse the JSON response
    try:
        # Clean response - remove potential markdown code fences
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        result = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response: {e}\nResponse: {response[:500]}")
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            result = json.loads(json_match.group())
        else:
            raise ValueError(f"LLM returned invalid JSON: {str(e)}")

    return result


# ─── Main Optimization Function ────────────────────────────────────

async def optimize_resume(request: OptimizeRequest) -> OptimizeResponse:
    """Main entry point: optimize a resume for a specific job."""

    profile = request.profile
    job = request.job

    # Step 1: Extract keywords from job description
    job_keywords = extract_keywords_from_job(job.description, job.required_skills)
    logger.info(f"Extracted {len(job_keywords)} keywords from job description")

    # Step 2: Match skills
    skill_match = match_skills(profile.skills, job_keywords)
    logger.info(f"Matched: {len(skill_match['matched'])}, Missing: {len(skill_match['missing'])}")

    # Step 3: LLM optimization
    llm_result = await optimize_resume_with_llm(profile, job, job_keywords, skill_match)

    # Step 4: Build response
    optimized_resume = OptimizedResume(
        summary=llm_result.get("summary", profile.summary or profile.tagline or ""),
        skills=llm_result.get("skills", profile.skills),
        experiences=[
            OptimizedExperience(**exp)
            for exp in llm_result.get("experiences", [])
        ],
        projects=[
            OptimizedProject(**proj)
            for proj in llm_result.get("projects", [])
        ],
    )

    app_strength_data = llm_result.get("application_strength", {})
    application_strength = ApplicationStrength(
        score=app_strength_data.get("score", 50),
        strong_areas=app_strength_data.get("strong_areas", []),
        weak_areas=app_strength_data.get("weak_areas", []),
        suggestions=app_strength_data.get("suggestions", []),
    )

    keyword_analysis = KeywordAnalysis(
        extracted_keywords=job_keywords,
        matched_keywords=skill_match["matched"],
        missing_keywords=skill_match["missing"],
        injected_keywords=llm_result.get("injected_keywords", []),
    )

    return OptimizeResponse(
        original_profile=profile,
        optimized_resume=optimized_resume,
        job_title=job.title,
        company_name=job.company,
        keyword_analysis=keyword_analysis,
        application_strength=application_strength,
    )
