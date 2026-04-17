"""
Job Fetcher Module - Apify-powered job scraping from LinkedIn and Indeed.
"""

import os
import logging
import asyncio
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

import httpx

logger = logging.getLogger(__name__)

APIFY_TOKEN = os.environ.get("APIFY_TOKEN", "")
APIFY_BASE_URL = "https://api.apify.com/v2/acts"

# Actor IDs
LINKEDIN_ACTOR = "apify~linkedin-jobs-scraper"
INDEED_ACTOR = "bebity~indeed-scraper"


def normalize_salary(salary_str: Any) -> tuple[Optional[int], Optional[int]]:
    """Parse salary string to min/max integers."""
    if not salary_str:
        return None, None
    if isinstance(salary_str, (int, float)):
        val = int(salary_str)
        return val, val
    salary_str = str(salary_str).replace(",", "").replace("$", "").replace("K", "000")
    import re
    numbers = re.findall(r'\d+', salary_str)
    if len(numbers) >= 2:
        return int(numbers[0]), int(numbers[1])
    elif len(numbers) == 1:
        val = int(numbers[0])
        # If value looks like hourly (< 200), convert to annual
        if val < 200:
            val = val * 2080
        return val, val
    return None, None


def normalize_job(raw: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Normalize job data to common schema."""
    # Handle LinkedIn format
    if source == "linkedin":
        url = raw.get("jobUrl") or raw.get("url") or raw.get("applyUrl") or ""
        title = raw.get("title") or raw.get("jobTitle") or ""
        company = raw.get("company") or raw.get("companyName") or ""
        location = raw.get("location") or raw.get("jobLocation") or ""
        salary_raw = raw.get("salary") or raw.get("salaryRange") or ""
        skills = raw.get("skills") or raw.get("requiredSkills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]
    else:
        # Indeed format
        url = raw.get("url") or raw.get("jobUrl") or raw.get("externalApplyLink") or ""
        title = raw.get("positionName") or raw.get("title") or raw.get("jobTitle") or ""
        company = raw.get("company") or raw.get("companyName") or ""
        location = raw.get("location") or raw.get("jobLocation") or ""
        salary_raw = raw.get("salary") or raw.get("salaryRange") or ""
        skills = raw.get("skills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]

    salary_min, salary_max = normalize_salary(salary_raw)

    job_id = str(uuid.uuid4())
    return {
        "id": job_id,
        "title": title,
        "company": company,
        "location": location,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_raw": str(salary_raw) if salary_raw else "",
        "skills_required": skills[:20],  # cap at 20 skills
        "url": url,
        "source": source,
        "description": raw.get("description") or raw.get("jobDescription") or "",
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


async def fetch_actor(
    actor_id: str,
    input_data: Dict[str, Any],
    source: str,
    timeout: int = 120
) -> List[Dict[str, Any]]:
    """Fetch jobs from a single Apify actor."""
    if not APIFY_TOKEN:
        logger.warning(f"APIFY_TOKEN not set, skipping {source} job fetch")
        return []

    url = f"{APIFY_BASE_URL}/{actor_id}/run-sync-get-dataset-items?token={APIFY_TOKEN}"

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=input_data)
            if response.status_code == 200:
                raw_jobs = response.json()
                if isinstance(raw_jobs, list):
                    normalized = []
                    for raw in raw_jobs:
                        try:
                            job = normalize_job(raw, source)
                            if job["url"] and job["title"]:  # only keep jobs with URL and title
                                normalized.append(job)
                        except Exception as e:
                            logger.warning(f"Failed to normalize job from {source}: {e}")
                    logger.info(f"Fetched {len(normalized)} jobs from {source}")
                    return normalized
            else:
                logger.error(f"Apify {source} error: {response.status_code} - {response.text[:200]}")
    except httpx.TimeoutException:
        logger.warning(f"Apify {source} timed out after {timeout}s")
    except Exception as e:
        logger.error(f"Apify {source} fetch failed: {e}")
    return []


class JobFetcher:
    """Handles job fetching, caching, and deduplication."""

    def __init__(self, db):
        self.db = db

    async def fetch_and_cache(
        self,
        keywords: List[str],
        location: str = "United States"
    ) -> int:
        """
        Fetch jobs from Apify actors in parallel, deduplicate by URL,
        and upsert into MongoDB jobs collection.
        Returns the number of new/updated jobs.
        """
        keyword_str = " OR ".join(keywords[:5])  # Use top 5 keywords

        # Define inputs for each actor
        linkedin_input = {
            "queries": [keyword_str],
            "location": location,
            "maxResults": 25,
            "resultsPerPage": 25,
        }
        indeed_input = {
            "queries": [keyword_str],
            "location": location,
            "maxResults": 25,
        }

        # Fetch from both in parallel
        linkedin_jobs, indeed_jobs = await asyncio.gather(
            fetch_actor(LINKEDIN_ACTOR, linkedin_input, "linkedin"),
            fetch_actor(INDEED_ACTOR, indeed_input, "indeed"),
            return_exceptions=True
        )

        all_jobs = []
        if isinstance(linkedin_jobs, list):
            all_jobs.extend(linkedin_jobs)
        if isinstance(indeed_jobs, list):
            all_jobs.extend(indeed_jobs)

        if not all_jobs:
            logger.info(f"No jobs fetched for keywords: {keywords}")
            return 0

        # Deduplicate by URL
        seen_urls = set()
        unique_jobs = []
        for job in all_jobs:
            url = job.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_jobs.append(job)

        # Upsert into MongoDB
        upserted_count = 0
        for job in unique_jobs:
            try:
                result = await self.db.jobs.update_one(
                    {"url": job["url"]},
                    {"$set": job},
                    upsert=True
                )
                if result.upserted_id or result.modified_count > 0:
                    upserted_count += 1
            except Exception as e:
                logger.error(f"Failed to upsert job {job.get('url', '')}: {e}")

        logger.info(f"Upserted {upserted_count} jobs (from {len(unique_jobs)} unique)")
        return upserted_count

    async def get_jobs(
        self,
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        salary_min: Optional[int] = None,
        salary_max: Optional[int] = None,
        skills: Optional[List[str]] = None,
        source: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get cached jobs with filters."""
        query: Dict[str, Any] = {}

        if keyword:
            query["$or"] = [
                {"title": {"$regex": keyword, "$options": "i"}},
                {"company": {"$regex": keyword, "$options": "i"}},
                {"description": {"$regex": keyword, "$options": "i"}},
            ]
        if location:
            query["location"] = {"$regex": location, "$options": "i"}
        if salary_min is not None:
            query["salary_max"] = {"$gte": salary_min}
        if salary_max is not None:
            query["salary_min"] = {"$lte": salary_max}
        if skills:
            query["skills_required"] = {"$in": [s.lower() for s in skills]}
        if source:
            query["source"] = source

        total = await self.db.jobs.count_documents(query)
        skip = (page - 1) * limit
        jobs = await self.db.jobs.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)

        return {
            "jobs": jobs,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
