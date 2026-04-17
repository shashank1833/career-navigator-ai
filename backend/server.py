from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, WebSocket, WebSocketDisconnect, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import traceback
import httpx
import asyncio
import json
from connection_manager import manager as ws_manager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
COACH_SESSION_MAX_MESSAGES = int(os.environ.get("COACH_SESSION_MAX_MESSAGES", "20"))
JOB_CACHE_REFRESH_HOURS = int(os.environ.get("JOB_CACHE_REFRESH_HOURS", "4"))
PUBLIC_PROFILE_ENABLED = os.environ.get("PUBLIC_PROFILE_ENABLED", "true").lower() == "true"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ─── LLM Helper ────────────────────────────────────────────────────

def get_llm_chat(session_id: str, system_message: str):
    """Create an LlmChat instance with given session_id and system message."""
    from emergentintegrations.llm.chat import LlmChat
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model("anthropic", "claude-sonnet-4-20250514")


# ─── Define Models ─────────────────────────────────────────────────

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


# ─── Basic Routes ──────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "CareerNav API v2"}

@api_router.post("/status")
async def create_status_check(input: StatusCheckCreate):
    doc = {"id": str(uuid.uuid4()), "client_name": input.client_name, "timestamp": datetime.now(timezone.utc).isoformat()}
    await db.status_checks.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/status")
async def get_status_checks():
    checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    return checks


# ─── Resume Optimization Endpoints ──────────────────────────────────

from resume_optimizer import (
    OptimizeRequest, OptimizeResponse,
    optimize_resume, extract_keywords_from_job, match_skills
)

@api_router.post("/optimize-resume", response_model=OptimizeResponse)
async def api_optimize_resume(request: OptimizeRequest):
    try:
        result = await optimize_resume(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Optimization failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Resume optimization failed: {str(e)}")


class KeywordExtractRequest(BaseModel):
    job_description: str
    required_skills: List[str] = []
    resume_skills: List[str] = []

@api_router.post("/extract-keywords")
async def api_extract_keywords(request: KeywordExtractRequest):
    try:
        keywords = extract_keywords_from_job(request.job_description, request.required_skills)
        skill_match = match_skills(request.resume_skills, keywords)
        return {"keywords": keywords, "matched": skill_match["matched"], "missing": skill_match["missing"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Resume Version Storage (MongoDB, user_id-based) ────────────────

class SaveVersionRequest(BaseModel):
    user_id: Optional[str] = None
    session_id: Optional[str] = None  # kept for backward compat
    name: str
    target_job_title: str = ""
    target_company: str = ""
    original_profile: Dict[str, Any] = {}
    optimized_resume: Dict[str, Any] = {}
    keyword_analysis: Dict[str, Any] = {}
    application_strength: Dict[str, Any] = {}
    is_original: bool = False

@api_router.post("/resume-versions")
async def save_resume_version(request: SaveVersionRequest):
    try:
        owner_id = request.user_id or request.session_id or "anon"
        version = {
            "id": str(uuid.uuid4()),
            "user_id": owner_id,
            "session_id": owner_id,  # backward compat
            "name": request.name,
            "target_job_title": request.target_job_title,
            "target_company": request.target_company,
            "original_profile": request.original_profile,
            "optimized_resume": request.optimized_resume,
            "keyword_analysis": request.keyword_analysis,
            "application_strength": request.application_strength,
            "is_original": request.is_original,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.resume_versions.insert_one(version)
        version.pop("_id", None)
        return version
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/resume-versions/{owner_id}")
async def get_resume_versions(owner_id: str):
    try:
        # Search by user_id or session_id for backward compat
        versions = await db.resume_versions.find(
            {"$or": [{"user_id": owner_id}, {"session_id": owner_id}]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        return versions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/resume-version/{version_id}")
async def get_resume_version(version_id: str):
    try:
        version = await db.resume_versions.find_one({"id": version_id}, {"_id": 0})
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        return version
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/resume-versions/{version_id}")
async def update_resume_version(version_id: str, updates: Dict[str, Any]):
    try:
        updates.pop("_id", None)
        updates.pop("id", None)
        result = await db.resume_versions.update_one({"id": version_id}, {"$set": updates})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Version not found")
        version = await db.resume_versions.find_one({"id": version_id}, {"_id": 0})
        return version
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/resume-versions/{version_id}")
async def delete_resume_version(version_id: str):
    try:
        result = await db.resume_versions.delete_one({"id": version_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Version not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Job Applications (MongoDB, user_id-based) ──────────────────────

class JobApplicationCreate(BaseModel):
    user_id: str
    job_id: str
    job_title: str
    company: str
    location: str = ""
    job_type: Optional[str] = None
    salary: Optional[str] = None
    match_score: float = 0
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    apply_url: Optional[str] = None
    resume_version_id: Optional[str] = None
    status: str = "applied"
    applied_date: Optional[str] = None
    notes: Optional[str] = None

class JobApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    applied_date: Optional[str] = None
    resume_version_id: Optional[str] = None


@api_router.post("/job-applications")
async def create_job_application(request: JobApplicationCreate):
    try:
        app_doc = {
            "id": str(uuid.uuid4()),
            **request.model_dump(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.job_applications.insert_one(app_doc)
        app_doc.pop("_id", None)
        return app_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/job-applications/{user_id}")
async def get_job_applications(user_id: str):
    try:
        apps = await db.job_applications.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("created_at", -1).to_list(500)
        return apps
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/job-applications/{application_id}")
async def update_job_application(application_id: str, updates: JobApplicationUpdate):
    try:
        update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No updates provided")
        result = await db.job_applications.update_one(
            {"id": application_id}, {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        app_doc = await db.job_applications.find_one({"id": application_id}, {"_id": 0})
        return app_doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/job-applications/{application_id}")
async def delete_job_application(application_id: str):
    try:
        result = await db.job_applications.delete_one({"id": application_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Career Navigation Endpoints ────────────────────────────────────

@api_router.get("/careers")
async def get_careers(domain: str = None, trending: bool = None, search: str = None):
    try:
        query = {}
        if domain:
            query["domain"] = domain
        if trending is not None:
            query["trending"] = trending
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"skills": {"$elemMatch": {"$regex": search, "$options": "i"}}},
            ]
        careers = await db.careers.find(query, {"_id": 0}).to_list(100)
        return careers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/careers/{career_id}")
async def get_career(career_id: str):
    try:
        career = await db.careers.find_one({"id": career_id}, {"_id": 0})
        if not career:
            raise HTTPException(status_code=404, detail="Career not found")
        return career
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/roadmaps")
async def get_roadmaps(domain: str = None):
    try:
        query = {}
        if domain:
            query["domain"] = domain
        roadmaps = await db.roadmaps.find(query, {"_id": 0}).to_list(100)
        return roadmaps
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/roadmaps/{roadmap_id}")
async def get_roadmap(roadmap_id: str):
    try:
        roadmap = await db.roadmaps.find_one({"id": roadmap_id}, {"_id": 0})
        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        return roadmap
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/skills-categories")
async def get_skills_categories():
    try:
        categories = await db.skills_categories.find({}, {"_id": 0}).to_list(100)
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UserProgressUpdate(BaseModel):
    user_id: str
    roadmap_id: str
    step_id: str
    completed: bool = True


@api_router.post("/user-progress")
async def update_user_progress(request: UserProgressUpdate):
    try:
        existing = await db.user_progress.find_one({
            "user_id": request.user_id,
            "roadmap_id": request.roadmap_id,
            "step_id": request.step_id,
        })
        if existing:
            await db.user_progress.update_one(
                {"_id": existing["_id"]},
                {"$set": {"completed": request.completed, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        else:
            await db.user_progress.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": request.user_id,
                "roadmap_id": request.roadmap_id,
                "step_id": request.step_id,
                "completed": request.completed,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/user-progress/{user_id}")
async def get_user_progress(user_id: str):
    try:
        progress = await db.user_progress.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
        return progress
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Job Feed (Apify-backed) ────────────────────────────────────────

from job_fetcher import JobFetcher

# Module-level instance – initialized lazily on first request.
# asyncio is single-threaded so no locking is needed.
_job_fetcher: Optional[JobFetcher] = None


def get_job_fetcher() -> JobFetcher:
    """Return (or create) the singleton JobFetcher, always non-None.

    Note on `is None` checks below and throughout server.py:
    PEP 8 mandates using `is`/`is not` for None comparisons, never `==`.
    The linter warnings about "identity comparison" are false-positives here.
    """
    global _job_fetcher
    if _job_fetcher is None:
        _job_fetcher = JobFetcher(db)
    # After the assignment above, _job_fetcher is guaranteed non-None.
    # The explicit assert satisfies static type-checkers (mypy/pyright).
    assert _job_fetcher is not None
    return _job_fetcher


@api_router.get("/jobs")
async def get_jobs(
    keyword: Optional[str] = None,
    location: Optional[str] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    skills: Optional[str] = None,  # comma-separated
    source: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
):
    try:
        skills_list = [s.strip() for s in skills.split(",")] if skills else None
        fetcher = get_job_fetcher()
        result = await fetcher.get_jobs(
            keyword=keyword,
            location=location,
            salary_min=salary_min,
            salary_max=salary_max,
            skills=skills_list,
            source=source,
            page=page,
            limit=min(limit, 100),
        )
        return result
    except Exception as e:
        logger.error(f"Get jobs failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    try:
        job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class JobMatchRequest(BaseModel):
    user_id: str


# ── match_jobs helpers ──────────────────────────────────────────────

async def _collect_user_skills(user_id: str) -> list[str]:
    """Return deduplicated skills from all completed roadmap steps."""
    progress_docs = await db.user_progress.find(
        {"user_id": user_id, "completed": True}, {"_id": 0}
    ).to_list(1000)

    roadmap_ids = list({p["roadmap_id"] for p in progress_docs})
    skills: list[str] = []
    for roadmap_id in roadmap_ids:
        roadmap = await db.roadmaps.find_one({"id": roadmap_id}, {"_id": 0})
        if not roadmap:
            continue
        completed_ids = {p["step_id"] for p in progress_docs if p["roadmap_id"] == roadmap_id}
        for step in roadmap.get("steps", []):
            if step.get("id") in completed_ids:
                skills.extend(step.get("skills", []))
    return list(set(skills))


def _score_jobs_locally(jobs: list, user_skills: list[str]) -> list:
    """Simple keyword-overlap scoring when no LLM key is available."""
    user_lower = {s.lower() for s in user_skills}
    scored = []
    for job in jobs[:20]:
        job_skills = [s.lower() for s in job.get("skills_required", [])]
        matched = [s for s in job_skills if s in user_lower]
        gap = [s for s in job_skills if s not in user_lower]
        score = int((len(matched) / max(len(job_skills), 1)) * 100)
        scored.append({"job": job, "match_score": score, "gap_skills": gap[:5]})
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored


async def _score_jobs_with_llm(jobs: list, user_skills: list[str]) -> list:
    """Use Claude to rank and score jobs against the user's skill profile."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    chat = get_llm_chat(
        "job-match-transient",
        "You are a career matching expert. Analyze job fit and return valid JSON only.",
    )
    jobs_summary = [
        {"title": j["title"], "company": j["company"],
         "skills": j.get("skills_required", [])[:10], "id": j["id"]}
        for j in jobs[:50]
    ]
    prompt = (
        f"User skills: {user_skills[:30]}\n\n"
        "Top 50 jobs to rank (id, title, company, skills):\n"
        f"{json.dumps(jobs_summary, indent=2)}\n\n"
        "Return a JSON array of the top 20 matches, each with:\n"
        "- job_id\n- match_score (0-100)\n- gap_skills (top 5 missing)\n\n"
        "Return ONLY a JSON array."
    )
    raw = await chat.send_message(UserMessage(text=prompt))
    try:
        cleaned = raw.strip()
        if "```" in cleaned:
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        return json.loads(cleaned)
    except Exception:
        return []


def _build_match_objects(matches_data: list, jobs_by_id: dict) -> list:
    """Hydrate match data with full job documents."""
    result = []
    for m in matches_data[:20]:
        job_id = m.get("job_id")
        if job_id and job_id in jobs_by_id:
            result.append({
                "job": jobs_by_id[job_id],
                "match_score": m.get("match_score", 0),
                "gap_skills": m.get("gap_skills", []),
            })
    return result


@api_router.post("/jobs/match")
async def match_jobs(request: JobMatchRequest):
    """Match user's skills/progress against top cached jobs using Claude."""
    try:
        user_skills = await _collect_user_skills(request.user_id)
        jobs = await db.jobs.find({}, {"_id": 0}).limit(50).to_list(50)

        if not jobs:
            return {"matches": [], "user_skills": user_skills}

        if not EMERGENT_LLM_KEY:
            return {"matches": _score_jobs_locally(jobs, user_skills), "user_skills": user_skills}

        matches_data = await _score_jobs_with_llm(jobs, user_skills)
        jobs_by_id = {j["id"]: j for j in jobs}
        return {"matches": _build_match_objects(matches_data, jobs_by_id), "user_skills": user_skills}
        
    except Exception as e:
        logger.error(f"Job match failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── AI Career Coach with Memory ────────────────────────────────────

class CoachMessageRequest(BaseModel):
    user_id: str
    session_id: Optional[str] = None
    message: str


@api_router.post("/coach/message")
async def send_coach_message(request: CoachMessageRequest):
    """Send a message to the AI career coach with persistent memory."""
    try:
        # Create or reuse session
        session_id = request.session_id
        session_doc = None
        
        if session_id:
            session_doc = await db.coach_sessions.find_one({"session_id": session_id, "user_id": request.user_id}, {"_id": 0})
        
        if not session_doc:
            # Create new session
            session_id = str(uuid.uuid4())
            
            # Get user context
            progress_docs = await db.user_progress.find(
                {"user_id": request.user_id, "completed": True}, {"_id": 0}
            ).to_list(100)
            
            session_doc = {
                "session_id": session_id,
                "user_id": request.user_id,
                "messages": [],
                "context": {
                    "completed_steps": len(progress_docs),
                    "user_id": request.user_id,
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.coach_sessions.insert_one(session_doc)
            session_doc.pop("_id", None)
        
        # Load last N messages from history
        max_messages = COACH_SESSION_MAX_MESSAGES
        history = session_doc.get("messages", [])[-max_messages:]
        
        # Build conversation context
        history_text = ""
        if history:
            history_text = "\n\nConversation history:\n"
            for msg in history:
                role = "User" if msg["role"] == "user" else "Coach"
                history_text += f"{role}: {msg['content']}\n"
        
        # Get user's roadmap progress for context
        progress_docs = await db.user_progress.find(
            {"user_id": request.user_id, "completed": True}, {"_id": 0}
        ).to_list(100)
        
        completed_count = len(progress_docs)
        
        system_msg = f"""You are CareerNav Coach, an expert AI career advisor. You help users navigate career transitions, develop skills, and achieve their career goals.

User context:
- Completed roadmap steps: {completed_count}
- Session ID: {session_id}

You provide:
1. Personalized career guidance based on the user's progress
2. Skill gap analysis and learning recommendations
3. Job search strategies and interview tips
4. Honest, actionable advice with specific next steps

Keep responses concise (3-5 sentences max per point), conversational, and actionable.{history_text}"""
        
        if not EMERGENT_LLM_KEY:
            reply = "I'm your CareerNav Coach! I'd love to help, but the AI service is not configured. Please check the EMERGENT_LLM_KEY setting."
        else:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            chat = get_llm_chat(f"coach-{session_id}", system_msg)
            reply = await chat.send_message(UserMessage(text=request.message))
        
        # Save messages to MongoDB
        user_msg = {"role": "user", "content": request.message, "timestamp": datetime.now(timezone.utc).isoformat()}
        assistant_msg = {"role": "assistant", "content": reply, "timestamp": datetime.now(timezone.utc).isoformat()}
        
        await db.coach_sessions.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
            }
        )
        
        return {"reply": reply, "session_id": session_id}
        
    except Exception as e:
        logger.error(f"Coach message failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/coach/sessions/{user_id}")
async def get_coach_sessions(user_id: str):
    """List all coach sessions for a user."""
    try:
        sessions = await db.coach_sessions.find(
            {"user_id": user_id},
            {"_id": 0, "messages": {"$slice": -1}}  # Return only last message as preview
        ).sort("updated_at", -1).to_list(50)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/coach/session/{session_id}/history")
async def get_coach_session_history(session_id: str):
    """Get full conversation history for a session."""
    try:
        session = await db.coach_sessions.find_one({"session_id": session_id}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Skill Gap Engine ────────────────────────────────────────────────

# ── skill_gap helpers ───────────────────────────────────────────────

async def _extract_skills_from_progress(user_id: str) -> set[str]:
    """Collect all lowercase skills from the user's completed roadmap steps."""
    progress = await db.user_progress.find(
        {"user_id": user_id, "completed": True}, {"_id": 0}
    ).to_list(1000)

    skills: set[str] = set()
    for roadmap_id in {p["roadmap_id"] for p in progress}:
        roadmap = await db.roadmaps.find_one({"id": roadmap_id}, {"_id": 0})
        if not roadmap:
            continue
        done_ids = {p["step_id"] for p in progress if p["roadmap_id"] == roadmap_id}
        for step in roadmap.get("steps", []):
            if step.get("id") in done_ids:
                skills.update(s.lower() for s in step.get("skills", []))
    return skills


async def _build_skill_demand(limit: int = 20) -> tuple[list, Dict[str, int]]:
    """Return (jobs, skill_demand_map) from the jobs cache."""
    jobs = await db.jobs.find(
        {}, {"_id": 0, "skills_required": 1, "title": 1}
    ).limit(limit).to_list(limit)

    demand: Dict[str, int] = {}
    for job in jobs:
        for raw_skill in job.get("skills_required", []):
            s = raw_skill.lower().strip()
            if s:
                demand[s] = demand.get(s, 0) + 1
    return jobs, demand


def _classify_skills(
    demand: Dict[str, int], user_skills: set[str], total_jobs: int
) -> tuple[list, list]:
    """Split demand entries into covered / missing lists sorted by demand."""
    covered, missing = [], []
    for skill, count in sorted(demand.items(), key=lambda x: x[1], reverse=True):
        entry = {
            "skill": skill,
            "demand_count": count,
            "demand_percentage": round((count / total_jobs) * 100),
        }
        (covered if skill in user_skills else missing).append(entry)
    return covered, missing


async def _fetch_resources_for_skills(skill_names: list[str]) -> list:
    """Retrieve up to 5 resources matching any of the given skill names."""
    if not skill_names:
        return []
    return await db.resources.find(
        {"$or": [
            {"tags": {"$in": skill_names}},
            {"title": {"$regex": "|".join(skill_names), "$options": "i"}},
        ]},
        {"_id": 0},
    ).limit(5).to_list(5)


@api_router.get("/skill-gap/{user_id}")
async def get_skill_gap(user_id: str):
    """Get skill gap analysis comparing user progress vs top job requirements."""
    try:
        user_skills = await _extract_skills_from_progress(user_id)
        jobs, demand = await _build_skill_demand(limit=20)
        total_jobs = max(len(jobs), 1)
        covered, missing = _classify_skills(demand, user_skills, total_jobs)

        priority = missing[:5]
        resources = await _fetch_resources_for_skills([s["skill"] for s in priority[:3]])

        return {
            "covered_skills": covered[:20],
            "missing_skills": missing[:20],
            "priority_skills": priority,
            "recommended_resources": resources,
            "coverage_score": round(
                len(covered) / max(len(covered) + len(missing), 1) * 100
            ),
        }
        
    except Exception as e:
        logger.error(f"Skill gap failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Salary Intelligence ─────────────────────────────────────────────

# ── salary_insights helpers ─────────────────────────────────────────

def _build_salary_query(role: str, location: str) -> Dict[str, Any]:
    """Build the MongoDB query for jobs with salary data."""
    query: Dict[str, Any] = {
        "salary_min": {"$ne": None},
        "salary_max": {"$ne": None},
    }
    if role:
        query["title"] = {"$regex": role, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    return query


def _empty_salary_response(role: str, location: str) -> Dict[str, Any]:
    return {"median": 0, "p25": 0, "p75": 0, "sample_count": 0,
            "top_companies": [], "role": role, "location": location}


def _compute_percentiles(jobs: list) -> tuple[list[float], int]:
    """Return (sorted_midpoints, n) from job salary data."""
    midpoints = [
        (lo + hi) / 2
        for job in jobs
        for lo, hi in [(job.get("salary_min") or 0, job.get("salary_max") or 0)]
        if lo > 0 or hi > 0
    ]
    midpoints.sort()
    return midpoints, len(midpoints)


def _top_companies(jobs: list, top_n: int = 5) -> list:
    counts: Dict[str, int] = {}
    for job in jobs:
        c = job.get("company", "")
        if c:
            counts[c] = counts.get(c, 0) + 1
    ranked = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
    return [{"company": c, "count": cnt} for c, cnt in ranked]


@api_router.get("/salary-insights")
async def get_salary_insights(role: str = "", location: str = "", experience_level: str = ""):
    """Get salary insights from cached job data."""
    try:
        query = _build_salary_query(role, location)
        jobs = await db.jobs.find(
            query, {"_id": 0, "salary_min": 1, "salary_max": 1, "company": 1, "title": 1}
        ).to_list(500)

        if not jobs:
            return _empty_salary_response(role, location)

        midpoints, n = _compute_percentiles(jobs)
        if not midpoints:
            return _empty_salary_response(role, location)

        return {
            "median": int(midpoints[n // 2]),
            "p25": int(midpoints[n // 4]),
            "p75": int(midpoints[(n * 3) // 4]),
            "min": int(midpoints[0]),
            "max": int(midpoints[-1]),
            "sample_count": n,
            "top_companies": _top_companies(jobs),
            "role": role,
            "location": location,
        }
    except Exception as e:
        logger.error(f"Salary insights failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Market Heatmap Data ─────────────────────────────────────────────

# ── heatmap helpers ──────────────────────────────────────────────────

def _parse_scraped_at(raw: str, week_ago: datetime) -> bool:
    """Return True if the job was scraped within the past week."""
    if not raw:
        return False
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt > week_ago
    except Exception:
        return False


def _tally_skill_counts(
    jobs: list, week_ago: datetime
) -> tuple[Dict[str, int], Dict[str, int]]:
    """Return (all_counts, recent_counts) dicts from job skill lists."""
    all_counts: Dict[str, int] = {}
    recent_counts: Dict[str, int] = {}
    for job in jobs:
        is_recent = _parse_scraped_at(job.get("scraped_at", ""), week_ago)
        for raw_skill in job.get("skills_required", []):
            s = raw_skill.lower().strip()
            if s:
                all_counts[s] = all_counts.get(s, 0) + 1
                if is_recent:
                    recent_counts[s] = recent_counts.get(s, 0) + 1
    return all_counts, recent_counts


def _map_domain_counts(jobs: list, careers: list) -> Dict[str, int]:
    """Count how many cached jobs match each career domain via skill overlap."""
    domain_counts: Dict[str, int] = {}
    career_skill_sets = [
        (c.get("domain", "Other"), {s.lower() for s in c.get("skills", [])})
        for c in careers
    ]
    for job in jobs:
        job_skills = {s.lower() for s in job.get("skills_required", [])}
        for domain, career_skills in career_skill_sets:
            if career_skills & job_skills:       # non-empty intersection
                domain_counts[domain] = domain_counts.get(domain, 0) + 1
                break                             # count each job once
    return domain_counts


def _find_trending_skills(
    all_counts: Dict[str, int], recent_counts: Dict[str, int], threshold: float = 0.2
) -> set[str]:
    """Skills where recent postings exceed `threshold` fraction of all postings."""
    return {
        skill
        for skill, count in all_counts.items()
        if count > 0 and recent_counts.get(skill, 0) / count > threshold
    }


def _build_heatmap_skills(
    all_counts: Dict[str, int], trending: set[str], top_n: int = 30
) -> list:
    """Return top-N skills sorted by count with demand_pct and trending flag."""
    top = sorted(all_counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
    max_count = max((c for _, c in top), default=1)
    return [
        {
            "skill": skill,
            "count": count,
            "demand_pct": round((count / max_count) * 100),
            "trending": skill in trending,
        }
        for skill, count in top
    ]


@api_router.get("/market-heatmap")
async def get_market_heatmap():
    """Get market demand data for heatmap visualization."""
    try:
        jobs = await db.jobs.find(
            {}, {"_id": 0, "skills_required": 1, "scraped_at": 1}
        ).to_list(1000)
        careers = await db.careers.find({}, {"_id": 0, "domain": 1, "skills": 1}).to_list(50)

        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        all_counts, recent_counts = _tally_skill_counts(jobs, week_ago)
        domain_counts = _map_domain_counts(jobs, careers)
        trending = _find_trending_skills(all_counts, recent_counts)
        heatmap_skills = _build_heatmap_skills(all_counts, trending)

        return {
            "skills": heatmap_skills,
            "domain_counts": domain_counts,
            "total_jobs": len(jobs),
        }
    except Exception as e:
        logger.error(f"Market heatmap failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Career Trajectory Simulator ────────────────────────────────────

class SimulateRequest(BaseModel):
    user_id: str
    current_role: str
    target_role: str
    timeline_months: int = 12  # 6, 12, or 24


# ── trajectory helpers ───────────────────────────────────────────────

async def _get_user_skills_capped(user_id: str, cap: int = 20) -> list[str]:
    """Return up to `cap` unique skills from the user's completed roadmap steps."""
    progress = await db.user_progress.find(
        {"user_id": user_id, "completed": True}, {"_id": 0}
    ).to_list(100)
    skills: list[str] = []
    for roadmap_id in {p["roadmap_id"] for p in progress}:
        roadmap = await db.roadmaps.find_one({"id": roadmap_id}, {"_id": 0})
        if not roadmap:
            continue
        done = {p["step_id"] for p in progress if p["roadmap_id"] == roadmap_id}
        for step in roadmap.get("steps", []):
            if step.get("id") in done:
                skills.extend(step.get("skills", []))
    return list(set(skills))[:cap]


async def _get_top_target_skills(target_role: str, cap: int = 15) -> list[str]:
    """Return the most-demanded skills for the target role from job cache."""
    target_jobs = await db.jobs.find(
        {"title": {"$regex": target_role, "$options": "i"}},
        {"_id": 0, "skills_required": 1},
    ).limit(10).to_list(10)
    demand: Dict[str, int] = {}
    for job in target_jobs:
        for skill in job.get("skills_required", []):
            s = skill.lower()
            demand[s] = demand.get(s, 0) + 1
    return [s for s, _ in sorted(demand.items(), key=lambda x: x[1], reverse=True)][:cap]


def _build_fallback_milestones(
    target_role: str, target_skills: list[str], months: int
) -> list:
    """Simple 3-phase plan used when no LLM key is available."""
    per = months // 3
    tiers = [f"Junior {target_role}", f"Mid {target_role}", target_role]
    return [
        {
            "milestone": i + 1,
            "month_range": f"Month {i * per + 1}-{(i + 1) * per}",
            "title": f"Phase {i + 1}",
            "skills_to_learn": target_skills[i * 5:(i + 1) * 5],
            "actions": ["Study relevant courses", "Build projects", "Network actively"],
            "job_tier": tiers[i],
            "estimated_hours": per * 40,
        }
        for i in range(3)
    ]


def _parse_llm_plan(raw: str) -> Dict[str, Any]:
    """Strip code fences and parse the JSON plan returned by Claude."""
    cleaned = raw.strip()
    if "```" in cleaned:
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    try:
        return json.loads(cleaned)
    except Exception:
        return {"milestones": []}


@api_router.post("/simulate-trajectory")
async def simulate_career_trajectory(request: SimulateRequest):
    """Generate a month-by-month career transition plan using Claude."""
    try:
        user_skills = await _get_user_skills_capped(request.user_id)
        top_target_skills = await _get_top_target_skills(request.target_role)

        if not EMERGENT_LLM_KEY:
            return {
                "milestones": _build_fallback_milestones(
                    request.target_role, top_target_skills, request.timeline_months
                ),
                "current_role": request.current_role,
                "target_role": request.target_role,
            }

        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = get_llm_chat(
            f"simulate-{request.user_id}",
            "You are a career transition expert. Return valid JSON only.",
        )
        prompt = (
            f"Create a {request.timeline_months}-month career transition plan.\n\n"
            f"Current role: {request.current_role}\n"
            f"Target role: {request.target_role}\n"
            f"Current skills: {user_skills}\n"
            f"Target skills needed: {top_target_skills}\n\n"
            'Return a JSON object with a "milestones" array of 3-6 milestones. Each milestone:\n'
            '{"milestone": number, "month_range": "Month X-Y", "title": "Phase title",\n'
            ' "skills_to_learn": ["skill1"], "actions": ["action1", "action2"],\n'
            ' "job_tier": "accessible tier", "estimated_hours": number}\n\n'
            "Return ONLY the JSON object."
        )
        raw_response = await chat.send_message(UserMessage(text=prompt))
        plan = _parse_llm_plan(raw_response)
        plan.update({
            "current_role": request.current_role,
            "target_role": request.target_role,
            "user_skills": user_skills,
            "target_skills": top_target_skills,
        })
        return plan
        
    except Exception as e:
        logger.error(f"Simulate trajectory failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Public Profiles ─────────────────────────────────────────────────

class PublicProfileCreate(BaseModel):
    user_id: str
    username: str
    bio: str = ""
    is_public: bool = True
    open_to_opportunities: bool = False
    career_goals: str = ""


@api_router.post("/public-profiles")
async def create_public_profile(request: PublicProfileCreate):
    """Create or update a public profile."""
    try:
        # Get user info
        user = await db.users.find_one({"user_id": request.user_id}, {"_id": 0})
        
        # Get roadmap progress
        progress = await db.user_progress.find(
            {"user_id": request.user_id, "completed": True}, {"_id": 0}
        ).to_list(100)
        
        profile_doc = {
            "user_id": request.user_id,
            "username": request.username.lower().strip(),
            "name": user.get("name", "") if user else "",
            "bio": request.bio,
            "is_public": request.is_public,
            "open_to_opportunities": request.open_to_opportunities,
            "career_goals": request.career_goals,
            "completed_steps": len(progress),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await db.public_profiles.update_one(
            {"user_id": request.user_id},
            {"$set": profile_doc},
            upsert=True
        )
        return profile_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/public-profiles/{username}")
async def get_public_profile(username: str):
    """Get a public profile by username."""
    try:
        profile = await db.public_profiles.find_one(
            {"username": username.lower(), "is_public": True},
            {"_id": 0}
        )
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found or not public")
        
        # Get roadmap progress for display
        progress = await db.user_progress.find(
            {"user_id": profile["user_id"], "completed": True}, {"_id": 0}
        ).to_list(100)
        
        profile["completed_steps_count"] = len(progress)
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/my-public-profile/{user_id}")
async def get_my_public_profile(user_id: str):
    """Get own public profile settings."""
    try:
        profile = await db.public_profiles.find_one({"user_id": user_id}, {"_id": 0})
        return profile or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── AI Recommendations ───────────────────────────────────────────────

class AIRecommendRequest(BaseModel):
    skills: List[str] = []
    interests: List[str] = []
    experience_level: str = "entry"


@api_router.post("/ai-recommend")
async def ai_career_recommend(request: AIRecommendRequest):
    try:
        if not EMERGENT_LLM_KEY:
            return {"recommendations": [
                {"title": "Software Engineer", "match_score": 85, "reason": "Strong technical foundation.", "skills_to_develop": ["System Design", "Cloud Computing"], "salary_range": "$95,000 - $165,000"},
                {"title": "Data Scientist", "match_score": 75, "reason": "Good analytical background.", "skills_to_develop": ["Machine Learning", "Statistics"], "salary_range": "$100,000 - $170,000"},
                {"title": "Product Manager", "match_score": 70, "reason": "Cross-functional skills.", "skills_to_develop": ["User Research", "Agile"], "salary_range": "$110,000 - $180,000"},
            ]}
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = get_llm_chat(f"ai-recommend-{uuid.uuid4()}", "You are an expert career advisor. Return only valid JSON arrays.")
        
        prompt = f"""Recommend 3-5 career paths for this profile:
Skills: {', '.join(request.skills) if request.skills else 'Not specified'}
Interests: {', '.join(request.interests) if request.interests else 'Not specified'}
Experience: {request.experience_level}

Return a JSON array with objects: title, match_score (0-100), reason (2-3 sentences), skills_to_develop (array), salary_range.
Return ONLY the JSON array."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        cleaned = response.strip()
        if "```" in cleaned:
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        recommendations = json.loads(cleaned)
        return {"recommendations": recommendations}
    except Exception:
        return {"recommendations": [
            {"title": "Software Engineer", "match_score": 85, "reason": "Strong technical foundation.", "skills_to_develop": ["System Design", "Cloud Computing"], "salary_range": "$95,000 - $165,000"},
            {"title": "Data Scientist", "match_score": 75, "reason": "Good analytical background.", "skills_to_develop": ["Machine Learning", "Statistics"], "salary_range": "$100,000 - $170,000"},
        ]}


# ─── Email/Password Authentication ─────────────────────────────────

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


def create_session_token() -> str:
    return str(uuid.uuid4()).replace("-", "") + str(uuid.uuid4()).replace("-", "")


@api_router.post("/auth/register")
async def register(request: RegisterRequest, response: Response):
    """Register with email/password."""
    try:
        existing = await db.users.find_one({"email": request.email}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        hashed_pw = pwd_context.hash(request.password)
        
        await db.users.insert_one({
            "user_id": user_id,
            "email": request.email,
            "name": request.name or request.email.split("@")[0],
            "picture": None,
            "password_hash": hashed_pw,
            "auth_provider": "email",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        
        session_token = create_session_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_id, "session_token": session_token,
            "expires_at": expires_at, "created_at": datetime.now(timezone.utc)
        })
        
        response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60)
        
        return {
            "user_id": user_id, "email": request.email,
            "name": request.name or request.email.split("@")[0], "picture": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Register failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response):
    """Login with email/password."""
    try:
        user_doc = await db.users.find_one({"email": request.email}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not user_doc.get("password_hash"):
            raise HTTPException(status_code=401, detail="This account uses Google sign-in")
        
        if not pwd_context.verify(request.password, user_doc["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        session_token = create_session_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_doc["user_id"], "session_token": session_token,
            "expires_at": expires_at, "created_at": datetime.now(timezone.utc)
        })
        
        response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60)
        
        return {
            "user_id": user_doc["user_id"], "email": user_doc["email"],
            "name": user_doc.get("name", ""), "picture": user_doc.get("picture")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Emergent OAuth Authentication ──────────────────────────────────

class SessionRequest(BaseModel):
    session_id: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: Optional[str] = None

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

async def get_current_user(request: Request, session_token: Optional[str] = Cookie(default=None)) -> User:
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)


@api_router.post("/auth/session")
async def exchange_session(request: SessionRequest, response: Response):
    try:
        async with httpx.AsyncClient() as client_http:
            auth_response = await client_http.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": request.session_id},
                timeout=30.0
            )
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Authentication failed")
        user_data = auth_response.json()
        email = user_data.get("email")
        name = user_data.get("name", "")
        picture = user_data.get("picture", "")
        session_token = user_data.get("session_token")
        if not email or not session_token:
            raise HTTPException(status_code=401, detail="Invalid auth response")
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        if existing_user:
            user_id = existing_user["user_id"]
            await db.users.update_one({"user_id": user_id}, {"$set": {"name": name, "picture": picture}})
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id, "email": email, "name": name, "picture": picture,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_id, "session_token": session_token,
            "expires_at": expires_at, "created_at": datetime.now(timezone.utc)
        })
        response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60)
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session exchange failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/auth/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(default=None)):
    user = await get_current_user(request, session_token)
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(default=None)):
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out successfully"}


# ─── WebSocket: Real-time Roadmap Progress ──────────────────────────

@app.websocket("/ws/roadmap/{roadmap_id}")
async def websocket_roadmap_progress(websocket: WebSocket, roadmap_id: str):
    user_id = websocket.query_params.get("user_id")
    if not user_id:
        await websocket.close(code=4001, reason="user_id query parameter required")
        return

    await ws_manager.connect(websocket, roadmap_id, user_id)

    try:
        progress_docs = await db.user_progress.find(
            {"user_id": user_id, "roadmap_id": roadmap_id, "completed": True}
        ).to_list(500)
        completed_steps = [doc["step_id"] for doc in progress_docs]
        await ws_manager.send_personal(websocket, {
            "type": "init", "user_id": user_id, "roadmap_id": roadmap_id,
            "completed_steps": completed_steps, "updated_at": datetime.now(timezone.utc).isoformat(),
        })

        while True:
            data = await websocket.receive_json()
            
            # Rate limiting check
            if not ws_manager._check_rate_limit(user_id):
                await websocket.close(code=1008, reason="Rate limit exceeded: too many messages")
                return
            
            action = data.get("action")
            if action == "toggle_step":
                step_id = data.get("step_id")
                completed = data.get("completed", True)
                if not step_id:
                    await ws_manager.send_personal(websocket, {"type": "error", "message": "step_id is required"})
                    continue
                existing = await db.user_progress.find_one({"user_id": user_id, "roadmap_id": roadmap_id, "step_id": step_id})
                if existing:
                    await db.user_progress.update_one(
                        {"_id": existing["_id"]},
                        {"$set": {"completed": completed, "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
                else:
                    await db.user_progress.insert_one({
                        "id": str(uuid.uuid4()), "user_id": user_id, "roadmap_id": roadmap_id,
                        "step_id": step_id, "completed": completed,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    })
                updated_docs = await db.user_progress.find(
                    {"user_id": user_id, "roadmap_id": roadmap_id, "completed": True}
                ).to_list(500)
                updated_steps = [doc["step_id"] for doc in updated_docs]
                await ws_manager.broadcast_to_roadmap(roadmap_id, {
                    "type": "progress_update", "user_id": user_id, "roadmap_id": roadmap_id,
                    "completed_steps": updated_steps, "step_id": step_id, "completed": completed,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                })
    except WebSocketDisconnect:
        ws_manager.disconnect(roadmap_id, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(roadmap_id, user_id)


# ─── Startup Events ──────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    """Initialize database indexes and start background scheduler."""
    try:
        # TTL index on keyword_cache
        await db.keyword_cache.create_index(
            [("created_at", 1)],
            expireAfterSeconds=86400,
            background=True
        )
        logger.info("TTL index created on keyword_cache")
        
        # Index on jobs for search performance
        await db.jobs.create_index([("url", 1)], unique=True, background=True)
        await db.jobs.create_index([("title", "text"), ("description", "text")], background=True)
        
        # Index on coach_sessions
        await db.coach_sessions.create_index([("user_id", 1)], background=True)
        await db.coach_sessions.create_index([("session_id", 1)], unique=True, background=True)
        
        # Index on job_applications
        await db.job_applications.create_index([("user_id", 1)], background=True)
        
        # Index on public_profiles
        await db.public_profiles.create_index([("username", 1)], unique=True, sparse=True, background=True)
        
        logger.info("All indexes initialized")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
    
    # Start APScheduler for background job refresh
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        scheduler = AsyncIOScheduler()
        
        async def refresh_jobs():
            """Background job to refresh job cache every N hours."""
            try:
                logger.info("Starting scheduled job cache refresh...")
                # Get top keywords from careers collection
                careers = await db.careers.find({}, {"_id": 0, "title": 1, "skills": 1}).to_list(10)
                if careers:
                    keywords = [c.get("title", "") for c in careers if c.get("title")][:10]
                    fetcher = get_job_fetcher()
                    count = await fetcher.fetch_and_cache(keywords, "United States")
                    logger.info(f"Job cache refresh complete: {count} jobs updated")
                else:
                    logger.info("No careers found for job cache refresh")
            except Exception as e:
                logger.error(f"Job cache refresh failed: {e}")
        
        scheduler.add_job(
            refresh_jobs,
            'interval',
            hours=JOB_CACHE_REFRESH_HOURS,
            id='job_cache_refresh',
            replace_existing=True,
        )
        scheduler.start()
        app.state.scheduler = scheduler
        logger.info(f"APScheduler started: job refresh every {JOB_CACHE_REFRESH_HOURS} hours")
    except Exception as e:
        logger.error(f"Scheduler startup failed: {e}")


# ─── Include Router & Middleware ─────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    # Stop scheduler if running
    if hasattr(app.state, 'scheduler'):
        app.state.scheduler.shutdown()
    client.close()
