#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Career Navigation Platform
Tests all endpoints with proper validation and error handling.
"""

import requests
import json
import time
from typing import Dict, List, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://career-compass-1048.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.failed_tests = []
        self.passed_tests = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result with details."""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        
        if success:
            self.passed_tests.append(test_name)
            print(f"✅ {test_name}: {details}")
        else:
            self.failed_tests.append(test_name)
            print(f"❌ {test_name}: {details}")
    
    def test_root_endpoint(self):
        """Test GET /api/ - Root endpoint."""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Hello World":
                    self.log_test("GET /api/ - Root", True, "Returns Hello World correctly")
                else:
                    self.log_test("GET /api/ - Root", False, f"Unexpected message: {data}")
            else:
                self.log_test("GET /api/ - Root", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/ - Root", False, f"Exception: {str(e)}")
    
    def test_careers_endpoints(self):
        """Test all career-related endpoints."""
        # Test 1: Get all careers
        try:
            response = self.session.get(f"{BACKEND_URL}/careers")
            if response.status_code == 200:
                careers = response.json()
                career_count = len(careers)
                self.log_test("GET /api/careers - All", True, f"Returns {career_count} careers")
                
                # Store a career ID for single career test
                career_id = careers[0]["id"] if careers else None
                
                # Test 2: Filter by IT domain
                response = self.session.get(f"{BACKEND_URL}/careers?domain=IT")
                if response.status_code == 200:
                    it_careers = response.json()
                    self.log_test("GET /api/careers?domain=IT", True, f"Returns {len(it_careers)} IT careers")
                else:
                    self.log_test("GET /api/careers?domain=IT", False, f"Status {response.status_code}")
                
                # Test 3: Filter by Business domain
                response = self.session.get(f"{BACKEND_URL}/careers?domain=Business")
                if response.status_code == 200:
                    business_careers = response.json()
                    self.log_test("GET /api/careers?domain=Business", True, f"Returns {len(business_careers)} Business careers")
                else:
                    self.log_test("GET /api/careers?domain=Business", False, f"Status {response.status_code}")
                
                # Test 4: Filter by Core domain
                response = self.session.get(f"{BACKEND_URL}/careers?domain=Core")
                if response.status_code == 200:
                    core_careers = response.json()
                    self.log_test("GET /api/careers?domain=Core", True, f"Returns {len(core_careers)} Core careers")
                else:
                    self.log_test("GET /api/careers?domain=Core", False, f"Status {response.status_code}")
                
                # Test 5: Filter by trending
                response = self.session.get(f"{BACKEND_URL}/careers?trending=true")
                if response.status_code == 200:
                    trending_careers = response.json()
                    self.log_test("GET /api/careers?trending=true", True, f"Returns {len(trending_careers)} trending careers")
                else:
                    self.log_test("GET /api/careers?trending=true", False, f"Status {response.status_code}")
                
                # Test 6: Search careers
                response = self.session.get(f"{BACKEND_URL}/careers?search=Engineer")
                if response.status_code == 200:
                    search_results = response.json()
                    self.log_test("GET /api/careers?search=Engineer", True, f"Returns {len(search_results)} results for 'Engineer'")
                else:
                    self.log_test("GET /api/careers?search=Engineer", False, f"Status {response.status_code}")
                
                # Test 7: Get single career (valid ID)
                if career_id:
                    response = self.session.get(f"{BACKEND_URL}/careers/{career_id}")
                    if response.status_code == 200:
                        career = response.json()
                        self.log_test("GET /api/careers/{career_id} - Valid", True, f"Returns career: {career.get('title', 'Unknown')}")
                    else:
                        self.log_test("GET /api/careers/{career_id} - Valid", False, f"Status {response.status_code}")
                
                # Test 8: Get single career (invalid ID)
                response = self.session.get(f"{BACKEND_URL}/careers/nonexistent-id")
                if response.status_code == 404:
                    self.log_test("GET /api/careers/nonexistent-id - Invalid", True, "Correctly returns 404")
                else:
                    self.log_test("GET /api/careers/nonexistent-id - Invalid", False, f"Expected 404, got {response.status_code}")
                    
            else:
                self.log_test("GET /api/careers - All", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/careers - All", False, f"Exception: {str(e)}")
    
    def test_roadmaps_endpoints(self):
        """Test all roadmap-related endpoints."""
        try:
            # Test 1: Get all roadmaps
            response = self.session.get(f"{BACKEND_URL}/roadmaps")
            if response.status_code == 200:
                roadmaps = response.json()
                roadmap_count = len(roadmaps)
                self.log_test("GET /api/roadmaps - All", True, f"Returns {roadmap_count} roadmaps")
                
                # Store a roadmap ID for single roadmap test
                roadmap_id = roadmaps[0]["id"] if roadmaps else None
                
                # Test 2: Filter by IT domain
                response = self.session.get(f"{BACKEND_URL}/roadmaps?domain=IT")
                if response.status_code == 200:
                    it_roadmaps = response.json()
                    self.log_test("GET /api/roadmaps?domain=IT", True, f"Returns {len(it_roadmaps)} IT roadmaps")
                else:
                    self.log_test("GET /api/roadmaps?domain=IT", False, f"Status {response.status_code}")
                
                # Test 3: Get single roadmap (valid ID)
                if roadmap_id:
                    response = self.session.get(f"{BACKEND_URL}/roadmaps/{roadmap_id}")
                    if response.status_code == 200:
                        roadmap = response.json()
                        steps_count = len(roadmap.get("steps", []))
                        self.log_test("GET /api/roadmaps/{roadmap_id} - Valid", True, f"Returns roadmap '{roadmap.get('title', 'Unknown')}' with {steps_count} steps")
                    else:
                        self.log_test("GET /api/roadmaps/{roadmap_id} - Valid", False, f"Status {response.status_code}")
                
                # Test 4: Get single roadmap (invalid ID)
                response = self.session.get(f"{BACKEND_URL}/roadmaps/nonexistent-id")
                if response.status_code == 404:
                    self.log_test("GET /api/roadmaps/nonexistent-id - Invalid", True, "Correctly returns 404")
                else:
                    self.log_test("GET /api/roadmaps/nonexistent-id - Invalid", False, f"Expected 404, got {response.status_code}")
                    
            else:
                self.log_test("GET /api/roadmaps - All", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/roadmaps - All", False, f"Exception: {str(e)}")
    
    def test_skills_categories(self):
        """Test skills categories endpoint."""
        try:
            response = self.session.get(f"{BACKEND_URL}/skills-categories")
            if response.status_code == 200:
                categories = response.json()
                category_count = len(categories)
                total_skills = sum(len(cat.get("skills", [])) for cat in categories)
                self.log_test("GET /api/skills-categories", True, f"Returns {category_count} categories with {total_skills} total skills")
            else:
                self.log_test("GET /api/skills-categories", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/skills-categories", False, f"Exception: {str(e)}")
    
    def test_user_progress(self):
        """Test user progress endpoints."""
        test_user_id = "test-user-123"
        test_roadmap_id = "test-rm-1"
        test_step_id = "test-step-1"
        
        try:
            # Test 1: Save progress (completed)
            progress_data = {
                "user_id": test_user_id,
                "roadmap_id": test_roadmap_id,
                "step_id": test_step_id,
                "completed": True
            }
            response = self.session.post(f"{BACKEND_URL}/user-progress", json=progress_data)
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.log_test("POST /api/user-progress - Save Complete", True, "Progress saved successfully")
                else:
                    self.log_test("POST /api/user-progress - Save Complete", False, f"Unexpected response: {result}")
            else:
                self.log_test("POST /api/user-progress - Save Complete", False, f"Status {response.status_code}: {response.text}")
            
            # Test 2: Get user progress
            response = self.session.get(f"{BACKEND_URL}/user-progress/{test_user_id}")
            if response.status_code == 200:
                progress_list = response.json()
                self.log_test("GET /api/user-progress/{user_id}", True, f"Returns {len(progress_list)} progress items")
            else:
                self.log_test("GET /api/user-progress/{user_id}", False, f"Status {response.status_code}: {response.text}")
            
            # Test 3: Toggle to incomplete
            progress_data["completed"] = False
            response = self.session.post(f"{BACKEND_URL}/user-progress", json=progress_data)
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.log_test("POST /api/user-progress - Toggle Incomplete", True, "Progress toggled to incomplete")
                else:
                    self.log_test("POST /api/user-progress - Toggle Incomplete", False, f"Unexpected response: {result}")
            else:
                self.log_test("POST /api/user-progress - Toggle Incomplete", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST /api/user-progress", False, f"Exception: {str(e)}")
    
    def test_ai_recommend(self):
        """Test AI recommendations endpoint."""
        try:
            ai_request = {
                "skills": ["Python", "React", "SQL"],
                "interests": ["AI", "Web Development"],
                "experience_level": "mid"
            }
            
            # Allow up to 30 seconds for AI processing
            response = self.session.post(f"{BACKEND_URL}/ai-recommend", json=ai_request, timeout=30)
            if response.status_code == 200:
                result = response.json()
                recommendations = result.get("recommendations", [])
                if recommendations:
                    avg_score = sum(r.get("match_score", 0) for r in recommendations) / len(recommendations)
                    self.log_test("POST /api/ai-recommend", True, f"Returns {len(recommendations)} recommendations with avg score {avg_score:.1f}")
                    
                    # Validate structure of first recommendation
                    first_rec = recommendations[0]
                    required_fields = ["title", "match_score", "reason", "skills_to_develop", "salary_range"]
                    missing_fields = [field for field in required_fields if field not in first_rec]
                    if not missing_fields:
                        self.log_test("AI Recommendation Structure", True, "All required fields present")
                    else:
                        self.log_test("AI Recommendation Structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("POST /api/ai-recommend", False, "No recommendations returned")
            else:
                self.log_test("POST /api/ai-recommend", False, f"Status {response.status_code}: {response.text}")
        except requests.exceptions.Timeout:
            self.log_test("POST /api/ai-recommend", False, "Request timed out after 30 seconds")
        except Exception as e:
            self.log_test("POST /api/ai-recommend", False, f"Exception: {str(e)}")
    
    def test_extract_keywords(self):
        """Test keyword extraction endpoint."""
        try:
            keyword_request = {
                "job_description": "Looking for a senior software engineer with Python, React, AWS experience",
                "required_skills": [],
                "resume_skills": ["Python", "JavaScript", "React"]
            }
            
            response = self.session.post(f"{BACKEND_URL}/extract-keywords", json=keyword_request)
            if response.status_code == 200:
                result = response.json()
                keywords = result.get("keywords", [])
                matched = result.get("matched", [])
                missing = result.get("missing", [])
                
                self.log_test("POST /api/extract-keywords", True, 
                            f"Extracted {len(keywords)} keywords, {len(matched)} matched, {len(missing)} missing")
            else:
                self.log_test("POST /api/extract-keywords", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /api/extract-keywords", False, f"Exception: {str(e)}")
    
    def test_resume_versions(self):
        """Test resume version CRUD operations."""
        test_session_id = "test-session-1"
        created_version_id = None
        
        try:
            # Test 1: Create resume version
            version_data = {
                "session_id": test_session_id,
                "name": "Test Resume v1",
                "target_job_title": "Software Engineer"
            }
            
            response = self.session.post(f"{BACKEND_URL}/resume-versions", json=version_data)
            if response.status_code == 200:
                version = response.json()
                created_version_id = version.get("id")
                self.log_test("POST /api/resume-versions - Create", True, f"Created version: {version.get('name')}")
            else:
                self.log_test("POST /api/resume-versions - Create", False, f"Status {response.status_code}: {response.text}")
            
            # Test 2: Get resume versions
            response = self.session.get(f"{BACKEND_URL}/resume-versions/{test_session_id}")
            if response.status_code == 200:
                versions = response.json()
                self.log_test("GET /api/resume-versions/{session_id}", True, f"Returns {len(versions)} versions")
            else:
                self.log_test("GET /api/resume-versions/{session_id}", False, f"Status {response.status_code}: {response.text}")
            
            # Test 3: Delete the created version
            if created_version_id:
                response = self.session.delete(f"{BACKEND_URL}/resume-versions/{created_version_id}")
                if response.status_code == 200:
                    result = response.json()
                    if result.get("deleted"):
                        self.log_test("DELETE /api/resume-versions/{version_id}", True, "Version deleted successfully")
                    else:
                        self.log_test("DELETE /api/resume-versions/{version_id}", False, f"Unexpected response: {result}")
                else:
                    self.log_test("DELETE /api/resume-versions/{version_id}", False, f"Status {response.status_code}: {response.text}")
                    
        except Exception as e:
            self.log_test("Resume Versions CRUD", False, f"Exception: {str(e)}")
    
    def test_auth_endpoints(self):
        """Test authentication endpoints."""
        try:
            # Test 1: GET /api/auth/me (should return 401)
            response = self.session.get(f"{BACKEND_URL}/auth/me")
            if response.status_code == 401:
                self.log_test("GET /api/auth/me - No Session", True, "Correctly returns 401 (not authenticated)")
            else:
                self.log_test("GET /api/auth/me - No Session", False, f"Expected 401, got {response.status_code}")
            
            # Test 2: POST /api/auth/logout (should work even without session)
            response = self.session.post(f"{BACKEND_URL}/auth/logout")
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("POST /api/auth/logout - No Session", True, "Logout works without session")
                else:
                    self.log_test("POST /api/auth/logout - No Session", False, f"Unexpected response: {result}")
            else:
                self.log_test("POST /api/auth/logout - No Session", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Auth Endpoints", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests."""
        print(f"🚀 Starting comprehensive backend testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_root_endpoint()
        self.test_careers_endpoints()
        self.test_roadmaps_endpoints()
        self.test_skills_categories()
        self.test_user_progress()
        self.test_ai_recommend()
        self.test_extract_keywords()
        self.test_resume_versions()
        self.test_auth_endpoints()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        print("=" * 80)
        print(f"🏁 Testing completed in {duration:.2f} seconds")
        print(f"✅ Passed: {len(self.passed_tests)}")
        print(f"❌ Failed: {len(self.failed_tests)}")
        print(f"📊 Success Rate: {len(self.passed_tests)}/{len(self.test_results)} ({len(self.passed_tests)/len(self.test_results)*100:.1f}%)")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)