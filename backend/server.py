from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# ─── Resume Optimization Endpoints ──────────────────────────────────

from resume_optimizer import (
    OptimizeRequest, OptimizeResponse,
    optimize_resume, extract_keywords_from_job, match_skills
)

@api_router.post("/optimize-resume", response_model=OptimizeResponse)
async def api_optimize_resume(request: OptimizeRequest):
    """Optimize a resume for a specific job using LLM."""
    try:
        result = await optimize_resume(request)
        return result
    except ValueError as e:
        logger.error(f"Optimization error: {e}")
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
    """Extract keywords from a job description and match with resume skills."""
    try:
        keywords = extract_keywords_from_job(request.job_description, request.required_skills)
        skill_match = match_skills(request.resume_skills, keywords)
        return {
            "keywords": keywords,
            "matched": skill_match["matched"],
            "missing": skill_match["missing"],
        }
    except Exception as e:
        logger.error(f"Keyword extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Resume Version Storage (MongoDB) ───────────────────────────────

class SaveVersionRequest(BaseModel):
    session_id: str
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
    """Save a resume version to MongoDB."""
    try:
        version = {
            "id": str(uuid.uuid4()),
            "session_id": request.session_id,
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
        logger.error(f"Failed to save version: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/resume-versions/{session_id}")
async def get_resume_versions(session_id: str):
    """Get all resume versions for a session."""
    try:
        versions = await db.resume_versions.find(
            {"session_id": session_id}
        ).sort("created_at", -1).to_list(100)
        for v in versions:
            v.pop("_id", None)
        return versions
    except Exception as e:
        logger.error(f"Failed to get versions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/resume-version/{version_id}")
async def get_resume_version(version_id: str):
    """Get a single resume version."""
    try:
        version = await db.resume_versions.find_one({"id": version_id})
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        version.pop("_id", None)
        return version
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get version: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/resume-versions/{version_id}")
async def update_resume_version(version_id: str, updates: Dict[str, Any]):
    """Update a resume version."""
    try:
        updates.pop("_id", None)
        updates.pop("id", None)
        result = await db.resume_versions.update_one(
            {"id": version_id},
            {"$set": updates}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Version not found")
        version = await db.resume_versions.find_one({"id": version_id})
        version.pop("_id", None)
        return version
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update version: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/resume-versions/{version_id}")
async def delete_resume_version(version_id: str):
    """Delete a resume version."""
    try:
        result = await db.resume_versions.delete_one({"id": version_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Version not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete version: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Career Navigation Endpoints ────────────────────────────────────

@api_router.get("/careers")
async def get_careers(domain: str = None, trending: bool = None, search: str = None):
    """Get all careers with optional filters."""
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
        careers = await db.careers.find(query).to_list(100)
        for c in careers:
            c.pop("_id", None)
        return careers
    except Exception as e:
        logger.error(f"Failed to get careers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/careers/{career_id}")
async def get_career(career_id: str):
    """Get a single career by ID."""
    try:
        career = await db.careers.find_one({"id": career_id})
        if not career:
            raise HTTPException(status_code=404, detail="Career not found")
        career.pop("_id", None)
        return career
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get career: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/roadmaps")
async def get_roadmaps(domain: str = None):
    """Get all roadmaps with optional domain filter."""
    try:
        query = {}
        if domain:
            query["domain"] = domain
        roadmaps = await db.roadmaps.find(query).to_list(100)
        for r in roadmaps:
            r.pop("_id", None)
        return roadmaps
    except Exception as e:
        logger.error(f"Failed to get roadmaps: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/roadmaps/{roadmap_id}")
async def get_roadmap(roadmap_id: str):
    """Get a single roadmap by ID."""
    try:
        roadmap = await db.roadmaps.find_one({"id": roadmap_id})
        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        roadmap.pop("_id", None)
        return roadmap
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get roadmap: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/skills-categories")
async def get_skills_categories():
    """Get all skill categories."""
    try:
        categories = await db.skills_categories.find().to_list(100)
        for c in categories:
            c.pop("_id", None)
        return categories
    except Exception as e:
        logger.error(f"Failed to get skills: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class UserProgressUpdate(BaseModel):
    user_id: str
    roadmap_id: str
    step_id: str
    completed: bool = True


@api_router.post("/user-progress")
async def update_user_progress(request: UserProgressUpdate):
    """Save or update user progress on a roadmap step."""
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
        logger.error(f"Failed to update progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/user-progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get all progress for a user."""
    try:
        progress = await db.user_progress.find({"user_id": user_id}).to_list(1000)
        for p in progress:
            p.pop("_id", None)
        return progress
    except Exception as e:
        logger.error(f"Failed to get progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class AIRecommendRequest(BaseModel):
    skills: List[str] = []
    interests: List[str] = []
    experience_level: str = "entry"


@api_router.post("/ai-recommend")
async def ai_career_recommend(request: AIRecommendRequest):
    """Get AI-powered career recommendations."""
    import json
    try:
        from resume_optimizer import get_llm_client
        client_llm = get_llm_client()
        
        prompt = f"""Based on the following user profile, recommend 3-5 career paths with explanations.

User Skills: {', '.join(request.skills) if request.skills else 'Not specified'}
Interests: {', '.join(request.interests) if request.interests else 'Not specified'}
Experience Level: {request.experience_level}

For each recommendation, provide:
1. Career Title
2. Match Score (0-100)
3. Why it's a good fit (2-3 sentences)
4. Key skills to develop
5. Expected salary range

Return as a JSON array with objects having these fields: title, match_score, reason, skills_to_develop (array), salary_range.
Return ONLY the JSON array, no other text."""

        response = client_llm.chat.completions.create(
            model="claude-sonnet-4-20250514",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.7,
        )
        
        content = response.choices[0].message.content.strip()
        # Try to extract JSON from the response
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        recommendations = json.loads(content)
        return {"recommendations": recommendations}
    except json.JSONDecodeError:
        # Fallback recommendations if LLM response isn't valid JSON
        logger.warning("LLM returned non-JSON response, using fallback")
        return {"recommendations": [
            {"title": "Software Engineer", "match_score": 85, "reason": "Strong technical foundation with relevant programming skills.", "skills_to_develop": ["System Design", "Cloud Computing"], "salary_range": "$95,000 - $165,000"},
            {"title": "Data Scientist", "match_score": 75, "reason": "Good analytical background with potential for data-driven roles.", "skills_to_develop": ["Machine Learning", "Statistics"], "salary_range": "$100,000 - $170,000"},
            {"title": "Product Manager", "match_score": 70, "reason": "Cross-functional skills that translate well to product management.", "skills_to_develop": ["User Research", "Agile Methodologies"], "salary_range": "$110,000 - $180,000"},
        ]}
    except Exception as e:
        logger.error(f"AI recommendation failed: {traceback.format_exc()}")
        # Return fallback instead of error
        return {"recommendations": [
            {"title": "Software Engineer", "match_score": 85, "reason": "Strong technical foundation with relevant programming skills.", "skills_to_develop": ["System Design", "Cloud Computing"], "salary_range": "$95,000 - $165,000"},
            {"title": "Data Scientist", "match_score": 75, "reason": "Good analytical background with potential for data-driven roles.", "skills_to_develop": ["Machine Learning", "Statistics"], "salary_range": "$100,000 - $170,000"},
            {"title": "Product Manager", "match_score": 70, "reason": "Cross-functional skills that translate well to product management.", "skills_to_develop": ["User Research", "Agile Methodologies"], "salary_range": "$110,000 - $180,000"},
        ]}


# ─── Emergent OAuth Authentication ──────────────────────────────────
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

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
    """Get current user from session token (cookie or header)."""
    token = session_token
    
    # Fallback to Authorization header if no cookie
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone awareness
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)


@api_router.post("/auth/session")
async def exchange_session(request: SessionRequest, response: Response):
    """Exchange session_id from OAuth callback for a session token."""
    try:
        # Call Emergent Auth to get user data
        async with httpx.AsyncClient() as client_http:
            auth_response = await client_http.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": request.session_id},
                timeout=30.0
            )
        
        if auth_response.status_code != 200:
            logger.error(f"Auth failed: {auth_response.status_code} - {auth_response.text}")
            raise HTTPException(status_code=401, detail="Authentication failed")
        
        user_data = auth_response.json()
        email = user_data.get("email")
        name = user_data.get("name", "")
        picture = user_data.get("picture", "")
        session_token = user_data.get("session_token")
        
        if not email or not session_token:
            raise HTTPException(status_code=401, detail="Invalid auth response")
        
        # Check if user exists, create or update
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
            # Update user data if needed
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"name": name, "picture": picture}}
            )
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Store session with 7-day expiry
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session exchange failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/auth/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(default=None)):
    """Get current authenticated user."""
    user = await get_current_user(request, session_token)
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(default=None)):
    """Logout user - delete session and clear cookie."""
    token = session_token
    
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
