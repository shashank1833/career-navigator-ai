#!/usr/bin/env python3
"""
Backend API Testing for Career Intelligence Platform Resume Optimization
Tests the 3 main endpoints: extract-keywords, resume-versions CRUD, and optimize-resume
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
        
        # Test in order of complexity
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