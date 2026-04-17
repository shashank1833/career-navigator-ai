#!/usr/bin/env python3
"""
Comprehensive backend API testing for CareerNav
Tests all major endpoints including auth, career data, job applications, AI coach, etc.
"""

import requests
import json
import sys
import os
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://market-heatmap.preview.emergentagent.com/api"

# Test credentials
TEST_EMAIL = "testbackend@test.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Backend Test"

class CareerNavTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_id = None
        self.session_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_auth_register(self) -> bool:
        """Test user registration"""
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            })
            
            if response.status_code == 200:
                data = response.json()
                self.user_id = data.get("user_id")
                # Extract session token from cookies
                if 'session_token' in response.cookies:
                    self.session_token = response.cookies['session_token']
                self.log_test("Auth Register", True, f"User ID: {self.user_id}")
                return True
            elif response.status_code == 400 and "already registered" in response.text:
                self.log_test("Auth Register", True, "User already exists (expected)")
                return True
            else:
                self.log_test("Auth Register", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Auth Register", False, f"Exception: {str(e)}")
            return False
            
    def test_auth_login(self) -> bool:
        """Test user login"""
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.user_id = data.get("user_id")
                # Extract session token from cookies
                if 'session_token' in response.cookies:
                    self.session_token = response.cookies['session_token']
                self.log_test("Auth Login", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_test("Auth Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Auth Login", False, f"Exception: {str(e)}")
            return False
            
    def test_auth_me(self) -> bool:
        """Test getting current user info"""
        try:
            response = self.session.get(f"{BACKEND_URL}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                user_id = data.get("user_id")
                email = data.get("email")
                self.log_test("Auth Me", True, f"User: {email} (ID: {user_id})")
                return True
            else:
                self.log_test("Auth Me", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Auth Me", False, f"Exception: {str(e)}")
            return False
            
    def test_careers_endpoint(self) -> bool:
        """Test careers endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/careers")
            
            if response.status_code == 200:
                data = response.json()
                count = len(data)
                self.log_test("Get Careers", True, f"Retrieved {count} careers")
                return True
            else:
                self.log_test("Get Careers", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Careers", False, f"Exception: {str(e)}")
            return False
            
    def test_roadmaps_endpoint(self) -> bool:
        """Test roadmaps endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/roadmaps")
            
            if response.status_code == 200:
                data = response.json()
                count = len(data)
                self.log_test("Get Roadmaps", True, f"Retrieved {count} roadmaps")
                return True
            else:
                self.log_test("Get Roadmaps", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Roadmaps", False, f"Exception: {str(e)}")
            return False
            
    def test_skills_categories_endpoint(self) -> bool:
        """Test skills categories endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/skills-categories")
            
            if response.status_code == 200:
                data = response.json()
                count = len(data)
                self.log_test("Get Skills Categories", True, f"Retrieved {count} categories")
                return True
            else:
                self.log_test("Get Skills Categories", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Skills Categories", False, f"Exception: {str(e)}")
            return False
            
    def test_job_applications_crud(self) -> bool:
        """Test job applications CRUD operations"""
        if not self.user_id:
            self.log_test("Job Applications CRUD", False, "No user_id available")
            return False
            
        application_id = None
        
        try:
            # CREATE
            create_data = {
                "user_id": self.user_id,
                "job_id": "test_job_123",
                "job_title": "Senior Software Engineer",
                "company": "Test Company",
                "location": "San Francisco, CA",
                "job_type": "Full-time",
                "salary": "$120,000 - $150,000",
                "match_score": 85.5,
                "matching_skills": ["Python", "React", "AWS"],
                "missing_skills": ["Kubernetes", "GraphQL"],
                "apply_url": "https://example.com/apply",
                "status": "applied",
                "notes": "Test application"
            }
            
            response = self.session.post(f"{BACKEND_URL}/job-applications", json=create_data)
            if response.status_code != 200:
                self.log_test("Job Applications CREATE", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
            app_data = response.json()
            application_id = app_data.get("id")
            self.log_test("Job Applications CREATE", True, f"Created application ID: {application_id}")
            
            # READ
            response = self.session.get(f"{BACKEND_URL}/job-applications/{self.user_id}")
            if response.status_code != 200:
                self.log_test("Job Applications READ", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
            apps = response.json()
            found_app = next((app for app in apps if app.get("id") == application_id), None)
            if not found_app:
                self.log_test("Job Applications READ", False, "Created application not found in list")
                return False
                
            self.log_test("Job Applications READ", True, f"Retrieved {len(apps)} applications")
            
            # UPDATE
            update_data = {
                "status": "interview_scheduled",
                "notes": "Updated test notes"
            }
            
            response = self.session.put(f"{BACKEND_URL}/job-applications/{application_id}", json=update_data)
            if response.status_code != 200:
                self.log_test("Job Applications UPDATE", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
            updated_app = response.json()
            if updated_app.get("status") != "interview_scheduled":
                self.log_test("Job Applications UPDATE", False, "Status not updated correctly")
                return False
                
            self.log_test("Job Applications UPDATE", True, "Status updated successfully")
            
            # DELETE
            response = self.session.delete(f"{BACKEND_URL}/job-applications/{application_id}")
            if response.status_code != 200:
                self.log_test("Job Applications DELETE", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
            self.log_test("Job Applications DELETE", True, "Application deleted successfully")
            
            return True
            
        except Exception as e:
            self.log_test("Job Applications CRUD", False, f"Exception: {str(e)}")
            return False
            
    def test_ai_coach(self) -> bool:
        """Test AI coach endpoints"""
        if not self.user_id:
            self.log_test("AI Coach", False, "No user_id available")
            return False
            
        try:
            # Send message to coach
            message_data = {
                "user_id": self.user_id,
                "message": "What career path should I take?"
            }
            
            response = self.session.post(f"{BACKEND_URL}/coach/message", json=message_data)
            if response.status_code != 200:
                self.log_test("AI Coach Message", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
            coach_response = response.json()
            session_id = coach_response.get("session_id")
            reply = coach_response.get("reply", "")
            
            if not session_id or not reply:
                self.log_test("AI Coach Message", False, "Missing session_id or reply in response")
                return False
                
            self.log_test("AI Coach Message", True, f"Session: {session_id}, Reply length: {len(reply)} chars")
            
            # Get coach sessions
            response = self.session.get(f"{BACKEND_URL}/coach/sessions/{self.user_id}")
            if response.status_code != 200:
                self.log_test("AI Coach Sessions", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
            sessions = response.json()
            self.log_test("AI Coach Sessions", True, f"Retrieved {len(sessions)} sessions")
            
            return True
            
        except Exception as e:
            self.log_test("AI Coach", False, f"Exception: {str(e)}")
            return False
            
    def test_career_trajectory_simulator(self) -> bool:
        """Test career trajectory simulator"""
        if not self.user_id:
            self.log_test("Career Trajectory Simulator", False, "No user_id available")
            return False
            
        try:
            simulate_data = {
                "user_id": self.user_id,
                "current_role": "Frontend Developer",
                "target_role": "Data Scientist",
                "timeline_months": 12
            }
            
            response = self.session.post(f"{BACKEND_URL}/simulate-trajectory", json=simulate_data)
            if response.status_code != 200:
                self.log_test("Career Trajectory Simulator", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
            trajectory = response.json()
            milestones = trajectory.get("milestones", [])
            
            if not milestones:
                self.log_test("Career Trajectory Simulator", False, "No milestones in response")
                return False
                
            self.log_test("Career Trajectory Simulator", True, f"Generated {len(milestones)} milestones")
            return True
            
        except Exception as e:
            self.log_test("Career Trajectory Simulator", False, f"Exception: {str(e)}")
            return False
            
    def test_jobs_endpoint(self) -> bool:
        """Test jobs endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/jobs")
            
            if response.status_code == 200:
                data = response.json()
                jobs = data.get("jobs", [])
                self.log_test("Get Jobs", True, f"Retrieved {len(jobs)} jobs (may be empty if no Apify cache)")
                return True
            else:
                self.log_test("Get Jobs", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Jobs", False, f"Exception: {str(e)}")
            return False
            
    def test_skill_gap_endpoint(self) -> bool:
        """Test skill gap endpoint"""
        if not self.user_id:
            self.log_test("Skill Gap", False, "No user_id available")
            return False
            
        try:
            response = self.session.get(f"{BACKEND_URL}/skill-gap/{self.user_id}")
            
            if response.status_code == 200:
                data = response.json()
                covered = data.get("covered_skills", [])
                missing = data.get("missing_skills", [])
                self.log_test("Skill Gap", True, f"Covered: {len(covered)}, Missing: {len(missing)} skills")
                return True
            else:
                self.log_test("Skill Gap", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Skill Gap", False, f"Exception: {str(e)}")
            return False
            
    def test_salary_insights_endpoint(self) -> bool:
        """Test salary insights endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/salary-insights?role=Software+Engineer")
            
            if response.status_code == 200:
                data = response.json()
                median = data.get("median", 0)
                sample_count = data.get("sample_count", 0)
                self.log_test("Salary Insights", True, f"Median: ${median}, Sample: {sample_count} jobs")
                return True
            else:
                self.log_test("Salary Insights", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Salary Insights", False, f"Exception: {str(e)}")
            return False
            
    def test_market_heatmap_endpoint(self) -> bool:
        """Test market heatmap endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/market-heatmap")
            
            if response.status_code == 200:
                data = response.json()
                skills = data.get("skills", [])
                total_jobs = data.get("total_jobs", 0)
                self.log_test("Market Heatmap", True, f"Skills: {len(skills)}, Total jobs: {total_jobs}")
                return True
            else:
                self.log_test("Market Heatmap", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Market Heatmap", False, f"Exception: {str(e)}")
            return False
            
    def test_auth_logout(self) -> bool:
        """Test user logout"""
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/logout")
            
            if response.status_code == 200:
                self.log_test("Auth Logout", True, "Logged out successfully")
                return True
            else:
                self.log_test("Auth Logout", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Auth Logout", False, f"Exception: {str(e)}")
            return False
            
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting CareerNav Backend API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test credentials: {TEST_EMAIL} / {TEST_PASSWORD}")
        print("=" * 60)
        
        # Auth flow
        self.test_auth_register()
        self.test_auth_login()
        self.test_auth_me()
        
        # Career data endpoints
        self.test_careers_endpoint()
        self.test_roadmaps_endpoint()
        self.test_skills_categories_endpoint()
        
        # Job applications CRUD
        self.test_job_applications_crud()
        
        # AI features
        self.test_ai_coach()
        self.test_career_trajectory_simulator()
        
        # New data endpoints
        self.test_jobs_endpoint()
        self.test_skill_gap_endpoint()
        self.test_salary_insights_endpoint()
        self.test_market_heatmap_endpoint()
        
        # Logout
        self.test_auth_logout()
        
        # Summary
        print("=" * 60)
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed < total:
            print("\n❌ Failed tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        else:
            print("\n✅ All tests passed!")
            
        return passed == total

if __name__ == "__main__":
    tester = CareerNavTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)