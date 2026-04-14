#!/usr/bin/env python3
"""
Backend API Testing for Career Navigation Platform
Tests all endpoints including new Career Navigation features:
- Career listing and details
- Roadmap listing and details  
- Skills categories
- User progress tracking
- AI career recommendations
- Legacy resume optimization endpoints
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://career-compass-1048.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    async def test_root_endpoint(self):
        """Test GET /api/ root endpoint"""
        print("🏠 Testing Root Endpoint...")
        
        try:
            async with self.session.get(f"{BACKEND_URL}/") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("message") == "Hello World":
                        self.log_result(
                            "Root Endpoint",
                            True,
                            "Root endpoint responding correctly"
                        )
                    else:
                        self.log_result(
                            "Root Endpoint",
                            False,
                            f"Unexpected response: {data}",
                            data
                        )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Root Endpoint",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
        except Exception as e:
            self.log_result(
                "Root Endpoint",
                False,
                f"Request failed: {str(e)}"
            )

    async def test_careers_endpoint(self):
        """Test GET /api/careers endpoint with various filters"""
        print("💼 Testing Careers Endpoint...")
        
        # Test 1: Get all careers (should return 12 careers)
        try:
            async with self.session.get(f"{BACKEND_URL}/careers") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if not isinstance(data, list):
                        self.log_result(
                            "Careers - List All",
                            False,
                            "Response should be a list",
                            data
                        )
                        return
                    
                    if len(data) != 12:
                        self.log_result(
                            "Careers - List All",
                            False,
                            f"Expected 12 careers, got {len(data)}",
                            {"count": len(data)}
                        )
                    else:
                        self.log_result(
                            "Careers - List All",
                            True,
                            f"Retrieved {len(data)} careers successfully"
                        )
                        
                        # Store first career ID for individual career test
                        if data:
                            self.test_career_id = data[0].get("id")
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Careers - List All",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    return
        except Exception as e:
            self.log_result(
                "Careers - List All",
                False,
                f"Request failed: {str(e)}"
            )
            return
        
        # Test 2: Filter by domain=IT
        try:
            async with self.session.get(f"{BACKEND_URL}/careers?domain=IT") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if not isinstance(data, list):
                        self.log_result(
                            "Careers - Filter IT",
                            False,
                            "Response should be a list",
                            data
                        )
                    else:
                        # Check if all returned careers are IT domain
                        non_it_careers = [c for c in data if c.get("domain") != "IT"]
                        if non_it_careers:
                            self.log_result(
                                "Careers - Filter IT",
                                False,
                                f"Found {len(non_it_careers)} non-IT careers in IT filter",
                                {"non_it_count": len(non_it_careers)}
                            )
                        else:
                            self.log_result(
                                "Careers - Filter IT",
                                True,
                                f"IT filter returned {len(data)} IT careers"
                            )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Careers - Filter IT",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
        except Exception as e:
            self.log_result(
                "Careers - Filter IT",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 3: Filter by domain=Business
        try:
            async with self.session.get(f"{BACKEND_URL}/careers?domain=Business") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list):
                        business_careers = [c for c in data if c.get("domain") == "Business"]
                        if len(business_careers) == len(data):
                            self.log_result(
                                "Careers - Filter Business",
                                True,
                                f"Business filter returned {len(data)} Business careers"
                            )
                        else:
                            self.log_result(
                                "Careers - Filter Business",
                                False,
                                f"Filter inconsistency: {len(data)} total, {len(business_careers)} Business",
                                {"total": len(data), "business": len(business_careers)}
                            )
                    else:
                        self.log_result(
                            "Careers - Filter Business",
                            False,
                            "Response should be a list",
                            data
                        )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Careers - Filter Business",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
        except Exception as e:
            self.log_result(
                "Careers - Filter Business",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 4: Filter by trending=true
        try:
            async with self.session.get(f"{BACKEND_URL}/careers?trending=true") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list):
                        trending_careers = [c for c in data if c.get("trending") == True]
                        if len(trending_careers) == len(data):
                            self.log_result(
                                "Careers - Filter Trending",
                                True,
                                f"Trending filter returned {len(data)} trending careers"
                            )
                        else:
                            self.log_result(
                                "Careers - Filter Trending",
                                False,
                                f"Filter inconsistency: {len(data)} total, {len(trending_careers)} trending",
                                {"total": len(data), "trending": len(trending_careers)}
                            )
                    else:
                        self.log_result(
                            "Careers - Filter Trending",
                            False,
                            "Response should be a list",
                            data
                        )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Careers - Filter Trending",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
        except Exception as e:
            self.log_result(
                "Careers - Filter Trending",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 5: Search for "Engineer"
        try:
            async with self.session.get(f"{BACKEND_URL}/careers?search=Engineer") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list):
                        # Check if results contain "Engineer" in title, description, or skills
                        matching_careers = []
                        for career in data:
                            title = career.get("title", "").lower()
                            description = career.get("description", "").lower()
                            skills = [s.lower() for s in career.get("skills", [])]
                            
                            if ("engineer" in title or "engineer" in description or 
                                any("engineer" in skill for skill in skills)):
                                matching_careers.append(career)
                        
                        if len(matching_careers) > 0:
                            self.log_result(
                                "Careers - Search Engineer",
                                True,
                                f"Search returned {len(data)} results, {len(matching_careers)} contain 'Engineer'"
                            )
                        else:
                            self.log_result(
                                "Careers - Search Engineer",
                                False,
                                f"Search returned {len(data)} results but none contain 'Engineer'",
                                {"results_count": len(data)}
                            )
                    else:
                        self.log_result(
                            "Careers - Search Engineer",
                            False,
                            "Response should be a list",
                            data
                        )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Careers - Search Engineer",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
        except Exception as e:
            self.log_result(
                "Careers - Search Engineer",
                False,
                f"Request failed: {str(e)}"
            )

    async def test_career_detail_endpoint(self):
        """Test GET /api/careers/{career_id} endpoint"""
        print("🔍 Testing Career Detail Endpoint...")
        
        # First get a career ID from the careers list
        career_id = None
        try:
            async with self.session.get(f"{BACKEND_URL}/careers") as response:
                if response.status == 200:
                    data = await response.json()
                    if data and len(data) > 0:
                        career_id = data[0].get("id")
                    else:
                        self.log_result(
                            "Career Detail - Get ID",
                            False,
                            "No careers found to test detail endpoint"
                        )
                        return
                else:
                    self.log_result(
                        "Career Detail - Get ID",
                        False,
                        f"Failed to get careers list: HTTP {response.status}"
                    )
                    return
        except Exception as e:
            self.log_result(
                "Career Detail - Get ID",
                False,
                f"Failed to get career ID: {str(e)}"
            )
            return
        
        # Test valid career ID
        if career_id:
            try:
                async with self.session.get(f"{BACKEND_URL}/careers/{career_id}") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Validate response structure
                        required_fields = ["id", "title", "domain"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if missing_fields:
                            self.log_result(
                                "Career Detail - Valid ID",
                                False,
                                f"Missing fields: {missing_fields}",
                                data
                            )
                        elif data.get("id") != career_id:
                            self.log_result(
                                "Career Detail - Valid ID",
                                False,
                                f"ID mismatch: requested {career_id}, got {data.get('id')}",
                                data
                            )
                        else:
                            self.log_result(
                                "Career Detail - Valid ID",
                                True,
                                f"Retrieved career details for {data.get('title')}"
                            )
                    else:
                        error_text = await response.text()
                        self.log_result(
                            "Career Detail - Valid ID",
                            False,
                            f"HTTP {response.status}: {error_text}"
                        )
            except Exception as e:
                self.log_result(
                    "Career Detail - Valid ID",
                    False,
                    f"Request failed: {str(e)}"
                )
        
        # Test invalid career ID (should return 404)
        try:
            invalid_id = "non-existent-career-id"
            async with self.session.get(f"{BACKEND_URL}/careers/{invalid_id}") as response:
                if response.status == 404:
                    self.log_result(
                        "Career Detail - Invalid ID",
                        True,
                        "Correctly returned 404 for non-existent career"
                    )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Career Detail - Invalid ID",
                        False,
                        f"Expected 404, got HTTP {response.status}: {error_text}"
                    )
        except Exception as e:
            self.log_result(
                "Career Detail - Invalid ID",
                False,
                f"Request failed: {str(e)}"
            )

    async def test_roadmaps_endpoint(self):
        """Test GET /api/roadmaps endpoint"""
        print("🗺️ Testing Roadmaps Endpoint...")
        
        # Test 1: Get all roadmaps (should return 5 roadmaps)
        try:
            async with self.session.get(f"{BACKEND_URL}/roadmaps") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if not isinstance(data, list):
                        self.log_result(
                            "Roadmaps - List All",
                            False,
                            "Response should be a list",
                            data
                        )
                        return
                    
                    if len(data) != 5:
                        self.log_result(
                            "Roadmaps - List All",
                            False,
                            f"Expected 5 roadmaps, got {len(data)}",
                            {"count": len(data)}
                        )
                    else:
                        self.log_result(
                            "Roadmaps - List All",
                            True,
                            f"Retrieved {len(data)} roadmaps successfully"
                        )
                        
                        # Store first roadmap ID for detail test
                        if data:
                            self.test_roadmap_id = data[0].get("id")
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Roadmaps - List All",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    return
        except Exception as e:
            self.log_result(
                "Roadmaps - List All",
                False,
                f"Request failed: {str(e)}"
            )
            return
        
        # Test 2: Filter by domain=IT
        try:
            async with self.session.get(f"{BACKEND_URL}/roadmaps?domain=IT") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list):
                        # Check if all returned roadmaps are IT domain
                        non_it_roadmaps = [r for r in data if r.get("domain") != "IT"]
                        if non_it_roadmaps:
                            self.log_result(
                                "Roadmaps - Filter IT",
                                False,
                                f"Found {len(non_it_roadmaps)} non-IT roadmaps in IT filter",
                                {"non_it_count": len(non_it_roadmaps)}
                            )
                        else:
                            self.log_result(
                                "Roadmaps - Filter IT",
                                True,
                                f"IT filter returned {len(data)} IT roadmaps"
                            )
                    else:
                        self.log_result(
                            "Roadmaps - Filter IT",
                            False,
                            "Response should be a list",
                            data
                        )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Roadmaps - Filter IT",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
        except Exception as e:
            self.log_result(
                "Roadmaps - Filter IT",
                False,
                f"Request failed: {str(e)}"
            )

    async def test_roadmap_detail_endpoint(self):
        """Test GET /api/roadmaps/{roadmap_id} endpoint"""
        print("📋 Testing Roadmap Detail Endpoint...")
        
        # First get a roadmap ID from the roadmaps list
        roadmap_id = None
        try:
            async with self.session.get(f"{BACKEND_URL}/roadmaps") as response:
                if response.status == 200:
                    data = await response.json()
                    if data and len(data) > 0:
                        roadmap_id = data[0].get("id")
                    else:
                        self.log_result(
                            "Roadmap Detail - Get ID",
                            False,
                            "No roadmaps found to test detail endpoint"
                        )
                        return
                else:
                    self.log_result(
                        "Roadmap Detail - Get ID",
                        False,
                        f"Failed to get roadmaps list: HTTP {response.status}"
                    )
                    return
        except Exception as e:
            self.log_result(
                "Roadmap Detail - Get ID",
                False,
                f"Failed to get roadmap ID: {str(e)}"
            )
            return
        
        # Test valid roadmap ID
        if roadmap_id:
            try:
                async with self.session.get(f"{BACKEND_URL}/roadmaps/{roadmap_id}") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Validate response structure
                        required_fields = ["id", "title", "steps"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if missing_fields:
                            self.log_result(
                                "Roadmap Detail - Valid ID",
                                False,
                                f"Missing fields: {missing_fields}",
                                data
                            )
                        elif data.get("id") != roadmap_id:
                            self.log_result(
                                "Roadmap Detail - Valid ID",
                                False,
                                f"ID mismatch: requested {roadmap_id}, got {data.get('id')}",
                                data
                            )
                        elif not isinstance(data.get("steps"), list):
                            self.log_result(
                                "Roadmap Detail - Valid ID",
                                False,
                                "Steps should be an array",
                                {"steps_type": type(data.get("steps"))}
                            )
                        else:
                            steps_count = len(data.get("steps", []))
                            self.log_result(
                                "Roadmap Detail - Valid ID",
                                True,
                                f"Retrieved roadmap '{data.get('title')}' with {steps_count} steps"
                            )
                    else:
                        error_text = await response.text()
                        self.log_result(
                            "Roadmap Detail - Valid ID",
                            False,
                            f"HTTP {response.status}: {error_text}"
                        )
            except Exception as e:
                self.log_result(
                    "Roadmap Detail - Valid ID",
                    False,
                    f"Request failed: {str(e)}"
                )
        
        # Test invalid roadmap ID (should return 404)
        try:
            invalid_id = "non-existent-roadmap-id"
            async with self.session.get(f"{BACKEND_URL}/roadmaps/{invalid_id}") as response:
                if response.status == 404:
                    self.log_result(
                        "Roadmap Detail - Invalid ID",
                        True,
                        "Correctly returned 404 for non-existent roadmap"
                    )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Roadmap Detail - Invalid ID",
                        False,
                        f"Expected 404, got HTTP {response.status}: {error_text}"
                    )
        except Exception as e:
            self.log_result(
                "Roadmap Detail - Invalid ID",
                False,
                f"Request failed: {str(e)}"
            )

    async def test_skills_categories_endpoint(self):
        """Test GET /api/skills-categories endpoint"""
        print("🎯 Testing Skills Categories Endpoint...")
        
        try:
            async with self.session.get(f"{BACKEND_URL}/skills-categories") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if not isinstance(data, list):
                        self.log_result(
                            "Skills Categories",
                            False,
                            "Response should be a list",
                            data
                        )
                        return
                    
                    if len(data) != 5:
                        self.log_result(
                            "Skills Categories",
                            False,
                            f"Expected 5 categories, got {len(data)}",
                            {"count": len(data)}
                        )
                        return
                    
                    # Validate structure of each category
                    for i, category in enumerate(data):
                        required_fields = ["id", "category", "skills"]  # Changed from "name" to "category"
                        missing_fields = [field for field in required_fields if field not in category]
                        
                        if missing_fields:
                            self.log_result(
                                "Skills Categories",
                                False,
                                f"Category {i} missing fields: {missing_fields}",
                                category
                            )
                            return
                        
                        if not isinstance(category.get("skills"), list):
                            self.log_result(
                                "Skills Categories",
                                False,
                                f"Category {i} skills should be an array",
                                {"skills_type": type(category.get("skills"))}
                            )
                            return
                    
                    total_skills = sum(len(cat.get("skills", [])) for cat in data)
                    self.log_result(
                        "Skills Categories",
                        True,
                        f"Retrieved {len(data)} categories with {total_skills} total skills"
                    )
                    
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Skills Categories",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
        except Exception as e:
            self.log_result(
                "Skills Categories",
                False,
                f"Request failed: {str(e)}"
            )

    async def test_user_progress_endpoints(self):
        """Test POST /api/user-progress and GET /api/user-progress/{user_id} endpoints"""
        print("📈 Testing User Progress Endpoints...")
        
        test_user_id = "test-user-1"
        test_roadmap_id = "test-roadmap-1"
        test_step_id = "test-step-1"
        
        # Test POST /api/user-progress
        progress_payload = {
            "user_id": test_user_id,
            "roadmap_id": test_roadmap_id,
            "step_id": test_step_id,
            "completed": True
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/user-progress",
                json=progress_payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get("success") != True:
                        self.log_result(
                            "User Progress - Save",
                            False,
                            "Response should contain 'success': true",
                            data
                        )
                        return
                    
                    self.log_result(
                        "User Progress - Save",
                        True,
                        "Progress saved successfully"
                    )
                    
                else:
                    error_text = await response.text()
                    self.log_result(
                        "User Progress - Save",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    return
                    
        except Exception as e:
            self.log_result(
                "User Progress - Save",
                False,
                f"Request failed: {str(e)}"
            )
            return
        
        # Test GET /api/user-progress/{user_id}
        try:
            async with self.session.get(f"{BACKEND_URL}/user-progress/{test_user_id}") as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    if not isinstance(data, list):
                        self.log_result(
                            "User Progress - Get",
                            False,
                            "Response should be a list",
                            data
                        )
                        return
                    
                    # Look for the progress we just saved
                    matching_progress = [
                        p for p in data 
                        if (p.get("user_id") == test_user_id and 
                            p.get("roadmap_id") == test_roadmap_id and 
                            p.get("step_id") == test_step_id)
                    ]
                    
                    if not matching_progress:
                        self.log_result(
                            "User Progress - Get",
                            False,
                            f"Saved progress not found in response. Got {len(data)} progress items",
                            {"progress_count": len(data)}
                        )
                    else:
                        progress_item = matching_progress[0]
                        if progress_item.get("completed") != True:
                            self.log_result(
                                "User Progress - Get",
                                False,
                                f"Progress completed status incorrect: {progress_item.get('completed')}",
                                progress_item
                            )
                        else:
                            self.log_result(
                                "User Progress - Get",
                                True,
                                f"Retrieved progress for user {test_user_id} - found saved step"
                            )
                    
                else:
                    error_text = await response.text()
                    self.log_result(
                        "User Progress - Get",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    
        except Exception as e:
            self.log_result(
                "User Progress - Get",
                False,
                f"Request failed: {str(e)}"
            )

    async def test_ai_recommend_endpoint(self):
        """Test POST /api/ai-recommend endpoint (AI career recommendations)"""
        print("🤖 Testing AI Career Recommendations Endpoint...")
        
        test_payload = {
            "skills": ["Python", "React", "SQL"],
            "interests": ["AI", "Web Development"],
            "experience_level": "mid"
        }
        
        try:
            print("   Sending request to AI recommendation endpoint (may take 10-30 seconds)...")
            
            # Set longer timeout for AI request
            timeout = aiohttp.ClientTimeout(total=60)
            
            async with self.session.post(
                f"{BACKEND_URL}/ai-recommend",
                json=test_payload,
                headers={"Content-Type": "application/json"},
                timeout=timeout
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Validate response structure
                    if "recommendations" not in data:
                        self.log_result(
                            "AI Recommendations",
                            False,
                            "Response should contain 'recommendations' field",
                            data
                        )
                        return
                    
                    recommendations = data["recommendations"]
                    if not isinstance(recommendations, list):
                        self.log_result(
                            "AI Recommendations",
                            False,
                            "Recommendations should be a list",
                            data
                        )
                        return
                    
                    if len(recommendations) == 0:
                        self.log_result(
                            "AI Recommendations",
                            False,
                            "No recommendations returned",
                            data
                        )
                        return
                    
                    # Validate structure of each recommendation
                    required_fields = ["title", "match_score", "reason", "skills_to_develop", "salary_range"]
                    for i, rec in enumerate(recommendations):
                        missing_fields = [field for field in required_fields if field not in rec]
                        
                        if missing_fields:
                            self.log_result(
                                "AI Recommendations",
                                False,
                                f"Recommendation {i} missing fields: {missing_fields}",
                                rec
                            )
                            return
                        
                        # Validate match_score is a number between 0-100
                        score = rec.get("match_score")
                        if not isinstance(score, (int, float)) or score < 0 or score > 100:
                            self.log_result(
                                "AI Recommendations",
                                False,
                                f"Recommendation {i} invalid match_score: {score} (should be 0-100)",
                                rec
                            )
                            return
                        
                        # Validate skills_to_develop is a list
                        if not isinstance(rec.get("skills_to_develop"), list):
                            self.log_result(
                                "AI Recommendations",
                                False,
                                f"Recommendation {i} skills_to_develop should be a list",
                                rec
                            )
                            return
                    
                    avg_score = sum(r.get("match_score", 0) for r in recommendations) / len(recommendations)
                    self.log_result(
                        "AI Recommendations",
                        True,
                        f"AI returned {len(recommendations)} recommendations, avg score: {avg_score:.1f}"
                    )
                    
                else:
                    error_text = await response.text()
                    self.log_result(
                        "AI Recommendations",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    
        except asyncio.TimeoutError:
            self.log_result(
                "AI Recommendations",
                False,
                "Request timed out (AI took too long to respond)"
            )
        except Exception as e:
            self.log_result(
                "AI Recommendations",
                False,
                f"Request failed: {str(e)}"
            )

    async def test_extract_keywords(self):
        """Test POST /api/extract-keywords endpoint"""
        print("🔍 Testing Keyword Extraction Endpoint...")
        
        test_payload = {
            "job_description": "We are looking for a Senior Python Developer with experience in FastAPI, Docker, Kubernetes, and AWS. Must have strong SQL and NoSQL database skills. Experience with React or Vue.js frontend is a plus. 3+ years of experience in microservices architecture.",
            "required_skills": ["Python", "FastAPI", "Docker"],
            "resume_skills": ["Python", "Django", "React", "PostgreSQL", "AWS", "Git"]
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/extract-keywords",
                json=test_payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Validate response structure
                    required_fields = ["keywords", "matched", "missing"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_result(
                            "Extract Keywords - Response Structure",
                            False,
                            f"Missing fields: {missing_fields}",
                            data
                        )
                        return
                    
                    # Validate data types
                    if not all(isinstance(data[field], list) for field in required_fields):
                        self.log_result(
                            "Extract Keywords - Data Types",
                            False,
                            "All response fields should be lists",
                            data
                        )
                        return
                    
                    # Check if keywords were extracted
                    if len(data["keywords"]) == 0:
                        self.log_result(
                            "Extract Keywords - Keyword Extraction",
                            False,
                            "No keywords extracted from job description",
                            data
                        )
                        return
                    
                    # Check if matching worked
                    expected_matches = ["python", "aws"]  # Should match from resume_skills
                    actual_matches = [m.lower() for m in data["matched"]]
                    found_expected = any(exp in actual_matches for exp in expected_matches)
                    
                    if not found_expected:
                        self.log_result(
                            "Extract Keywords - Skill Matching",
                            False,
                            f"Expected to find matches for {expected_matches}, got: {data['matched']}",
                            data
                        )
                        return
                    
                    self.log_result(
                        "Extract Keywords",
                        True,
                        f"Extracted {len(data['keywords'])} keywords, {len(data['matched'])} matched, {len(data['missing'])} missing"
                    )
                    
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Extract Keywords",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    
        except Exception as e:
            self.log_result(
                "Extract Keywords",
                False,
                f"Request failed: {str(e)}"
            )

    async def test_resume_versions_crud(self):
        """Test full CRUD cycle for /api/resume-versions"""
        print("📝 Testing Resume Versions CRUD...")
        
        session_id = f"test-session-{uuid.uuid4()}"
        version_id = None
        
        # Test CREATE (POST)
        create_payload = {
            "session_id": session_id,
            "name": "Test Resume Version",
            "target_job_title": "Senior Backend Developer",
            "target_company": "TechCorp",
            "original_profile": {
                "name": "Jane Smith",
                "skills": ["Python", "FastAPI", "PostgreSQL"]
            },
            "optimized_resume": {
                "summary": "Experienced backend developer with expertise in Python and FastAPI",
                "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"]
            },
            "keyword_analysis": {
                "matched": ["Python", "FastAPI"],
                "missing": ["Kubernetes"]
            },
            "application_strength": {
                "score": 85,
                "strong_areas": ["Backend Development", "API Design"]
            },
            "is_original": False
        }
        
        try:
            # CREATE
            async with self.session.post(
                f"{BACKEND_URL}/resume-versions",
                json=create_payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    version_id = data.get("id")
                    
                    if not version_id:
                        self.log_result(
                            "Resume Versions - CREATE",
                            False,
                            "No ID returned in create response",
                            data
                        )
                        return
                    
                    # Validate created data
                    if data.get("session_id") != session_id:
                        self.log_result(
                            "Resume Versions - CREATE",
                            False,
                            f"Session ID mismatch: expected {session_id}, got {data.get('session_id')}",
                            data
                        )
                        return
                    
                    self.log_result(
                        "Resume Versions - CREATE",
                        True,
                        f"Created version with ID: {version_id}"
                    )
                    
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Resume Versions - CREATE",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    return
                    
        except Exception as e:
            self.log_result(
                "Resume Versions - CREATE",
                False,
                f"Request failed: {str(e)}"
            )
            return
        
        # Test READ (GET by session_id)
        try:
            async with self.session.get(f"{BACKEND_URL}/resume-versions/{session_id}") as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    if not isinstance(data, list):
                        self.log_result(
                            "Resume Versions - READ (List)",
                            False,
                            "Response should be a list",
                            data
                        )
                    elif len(data) == 0:
                        self.log_result(
                            "Resume Versions - READ (List)",
                            False,
                            "No versions found for session",
                            data
                        )
                    elif data[0].get("id") != version_id:
                        self.log_result(
                            "Resume Versions - READ (List)",
                            False,
                            f"Version ID mismatch: expected {version_id}, got {data[0].get('id')}",
                            data
                        )
                    else:
                        self.log_result(
                            "Resume Versions - READ (List)",
                            True,
                            f"Found {len(data)} version(s) for session"
                        )
                        
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Resume Versions - READ (List)",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    
        except Exception as e:
            self.log_result(
                "Resume Versions - READ (List)",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test UPDATE (PUT)
        update_payload = {
            "name": "Updated Test Resume",
            "target_job_title": "Lead Backend Engineer"
        }
        
        try:
            async with self.session.put(
                f"{BACKEND_URL}/resume-versions/{version_id}",
                json=update_payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get("name") != update_payload["name"]:
                        self.log_result(
                            "Resume Versions - UPDATE",
                            False,
                            f"Name not updated: expected '{update_payload['name']}', got '{data.get('name')}'",
                            data
                        )
                    else:
                        self.log_result(
                            "Resume Versions - UPDATE",
                            True,
                            "Version updated successfully"
                        )
                        
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Resume Versions - UPDATE",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    
        except Exception as e:
            self.log_result(
                "Resume Versions - UPDATE",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test DELETE
        try:
            async with self.session.delete(f"{BACKEND_URL}/resume-versions/{version_id}") as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get("deleted") != True:
                        self.log_result(
                            "Resume Versions - DELETE",
                            False,
                            "Delete response should contain 'deleted': true",
                            data
                        )
                    else:
                        self.log_result(
                            "Resume Versions - DELETE",
                            True,
                            "Version deleted successfully"
                        )
                        
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Resume Versions - DELETE",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    
        except Exception as e:
            self.log_result(
                "Resume Versions - DELETE",
                False,
                f"Request failed: {str(e)}"
            )

    async def test_optimize_resume(self):
        """Test POST /api/optimize-resume endpoint (LLM-powered)"""
        print("🤖 Testing Resume Optimization Endpoint (LLM)...")
        
        test_payload = {
            "profile": {
                "name": "Alex Johnson",
                "email": "alex@example.com",
                "phone": "+1-555-0123",
                "location": "San Francisco, CA",
                "linkedin": "linkedin.com/in/alexjohnson",
                "tagline": "Full-stack developer with 4 years of experience",
                "summary": "Experienced software engineer focused on building scalable web applications",
                "skills": ["Python", "JavaScript", "React", "Django", "PostgreSQL", "Git", "Docker", "AWS"],
                "experience_text": "4 years in full-stack web development",
                "education": "BS Computer Science, UC Berkeley",
                "experiences": [
                    {
                        "title": "Software Engineer",
                        "company": "StartupCorp",
                        "duration": "2021 - Present",
                        "bullets": [
                            "Built REST APIs using Django and PostgreSQL",
                            "Developed responsive frontend components with React",
                            "Deployed applications on AWS using Docker containers",
                            "Collaborated with cross-functional teams in Agile environment"
                        ]
                    },
                    {
                        "title": "Junior Developer",
                        "company": "WebSolutions",
                        "duration": "2020 - 2021",
                        "bullets": [
                            "Maintained legacy PHP applications",
                            "Implemented new features using JavaScript and jQuery",
                            "Optimized database queries for better performance"
                        ]
                    }
                ],
                "projects": [
                    {
                        "name": "E-commerce Platform",
                        "description": "Full-stack e-commerce application with payment processing",
                        "technologies": ["React", "Django", "PostgreSQL", "Stripe", "AWS"]
                    },
                    {
                        "name": "Task Management App",
                        "description": "Real-time collaborative task management tool",
                        "technologies": ["Vue.js", "Node.js", "MongoDB", "Socket.io"]
                    }
                ]
            },
            "job": {
                "title": "Senior Backend Engineer",
                "company": "Google",
                "location": "Mountain View, CA",
                "description": "We are looking for a Senior Backend Engineer to join our Cloud Platform team. You will design and build scalable microservices using Python, Go, or Java. Experience with Kubernetes, Docker, CI/CD pipelines, and distributed systems is essential. Knowledge of gRPC, Protocol Buffers, and cloud-native architectures is preferred. You should have 5+ years of experience in backend development and be comfortable working with large-scale systems serving millions of users.",
                "required_skills": ["Python", "Kubernetes", "Docker", "CI/CD", "Microservices", "Distributed Systems"]
            }
        }
        
        try:
            print("   Sending request to LLM endpoint (this may take 15-30 seconds)...")
            
            # Set longer timeout for LLM request
            timeout = aiohttp.ClientTimeout(total=60)
            
            async with self.session.post(
                f"{BACKEND_URL}/optimize-resume",
                json=test_payload,
                headers={"Content-Type": "application/json"},
                timeout=timeout
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Validate response structure
                    required_fields = [
                        "id", "original_profile", "optimized_resume", 
                        "keyword_analysis", "application_strength", "timestamp"
                    ]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_result(
                            "Optimize Resume - Response Structure",
                            False,
                            f"Missing fields: {missing_fields}",
                            data
                        )
                        return
                    
                    # Validate optimized_resume structure
                    opt_resume = data.get("optimized_resume", {})
                    opt_required = ["summary", "skills", "experiences", "projects"]
                    opt_missing = [field for field in opt_required if field not in opt_resume]
                    
                    if opt_missing:
                        self.log_result(
                            "Optimize Resume - Optimized Resume Structure",
                            False,
                            f"Missing optimized_resume fields: {opt_missing}",
                            opt_resume
                        )
                        return
                    
                    # Validate keyword_analysis structure
                    keyword_analysis = data.get("keyword_analysis", {})
                    kw_required = ["extracted_keywords", "matched_keywords", "missing_keywords"]
                    kw_missing = [field for field in kw_required if field not in keyword_analysis]
                    
                    if kw_missing:
                        self.log_result(
                            "Optimize Resume - Keyword Analysis Structure",
                            False,
                            f"Missing keyword_analysis fields: {kw_missing}",
                            keyword_analysis
                        )
                        return
                    
                    # Validate application_strength structure
                    app_strength = data.get("application_strength", {})
                    app_required = ["score", "strong_areas", "weak_areas", "suggestions"]
                    app_missing = [field for field in app_required if field not in app_strength]
                    
                    if app_missing:
                        self.log_result(
                            "Optimize Resume - Application Strength Structure",
                            False,
                            f"Missing application_strength fields: {app_missing}",
                            app_strength
                        )
                        return
                    
                    # Check if optimization actually happened
                    original_summary = test_payload["profile"]["summary"]
                    optimized_summary = opt_resume.get("summary", "")
                    
                    if original_summary == optimized_summary:
                        self.log_result(
                            "Optimize Resume - Content Optimization",
                            False,
                            "Summary was not optimized (identical to original)",
                            {"original": original_summary, "optimized": optimized_summary}
                        )
                        return
                    
                    # Check if score is reasonable
                    score = app_strength.get("score", 0)
                    if not isinstance(score, (int, float)) or score < 0 or score > 100:
                        self.log_result(
                            "Optimize Resume - Application Score",
                            False,
                            f"Invalid application strength score: {score} (should be 0-100)",
                            app_strength
                        )
                        return
                    
                    # Check if keywords were extracted
                    extracted_count = len(keyword_analysis.get("extracted_keywords", []))
                    if extracted_count == 0:
                        self.log_result(
                            "Optimize Resume - Keyword Extraction",
                            False,
                            "No keywords extracted from job description",
                            keyword_analysis
                        )
                        return
                    
                    self.log_result(
                        "Optimize Resume",
                        True,
                        f"LLM optimization successful. Score: {score}, Keywords: {extracted_count}, Summary optimized"
                    )
                    
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Optimize Resume",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    
        except asyncio.TimeoutError:
            self.log_result(
                "Optimize Resume",
                False,
                "Request timed out (LLM took too long to respond)"
            )
        except Exception as e:
            self.log_result(
                "Optimize Resume",
                False,
                f"Request failed: {str(e)}"
            )

    async def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests for: {BACKEND_URL}")
        print("=" * 60)
        
        # Test new Career Navigation endpoints first (high priority)
        await self.test_root_endpoint()
        await self.test_careers_endpoint()
        await self.test_career_detail_endpoint()
        await self.test_roadmaps_endpoint()
        await self.test_roadmap_detail_endpoint()
        await self.test_skills_categories_endpoint()
        await self.test_user_progress_endpoints()
        await self.test_ai_recommend_endpoint()
        
        # Test legacy resume optimization endpoints
        await self.test_extract_keywords()
        await self.test_resume_versions_crud()
        await self.test_optimize_resume()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)
        return passed_tests, failed_tests

async def main():
    """Main test runner"""
    async with BackendTester() as tester:
        passed, failed = await tester.run_all_tests()
        return passed, failed

if __name__ == "__main__":
    passed, failed = asyncio.run(main())
    exit(0 if failed == 0 else 1)