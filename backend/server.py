from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import traceback

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
