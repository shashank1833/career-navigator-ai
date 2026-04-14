#!/usr/bin/env python3
"""
Specific Backend API Tests for Review Request
Tests the exact endpoints mentioned in the review request
"""

import asyncio
import httpx
import json
import uuid
from datetime import datetime

# Use the production backend URL from frontend/.env
BASE_URL = "https://career-compass-1048.preview.emergentagent.com"

async def test_specific_endpoints():
    """Test the specific endpoints mentioned in the review request"""
    print("🔍 Testing Specific Endpoints from Review Request")
    print(f"📍 Base URL: {BASE_URL}")
    print("=" * 60)
    
    results = []
    
    # 1. Test basic health endpoint: GET /api/
    print("1️⃣ Testing GET /api/ - Health endpoint")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{BASE_URL}/api/")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Hello World":
                    print("   ✅ PASS - Returns correct message: 'Hello World'")
                    results.append(("GET /api/", True, "Returns 'Hello World'"))
                else:
                    print(f"   ❌ FAIL - Unexpected response: {data}")
                    results.append(("GET /api/", False, f"Unexpected response: {data}"))
            else:
                print(f"   ❌ FAIL - Status {response.status_code}: {response.text}")
                results.append(("GET /api/", False, f"Status {response.status_code}"))
                
    except Exception as e:
        print(f"   ❌ FAIL - Request failed: {str(e)}")
        results.append(("GET /api/", False, f"Request failed: {str(e)}"))
    
    print()
    
    # 2. Test resume optimization endpoint
    print("2️⃣ Testing POST /api/optimize-resume")
    try:
        test_data = {
            "profile": {
                "name": "John Doe",
                "email": "john@example.com",
                "summary": "Experienced software engineer",
                "skills": ["Python", "React", "AWS"],
                "experiences": [],
                "projects": []
            },
            "job": {
                "title": "Senior Software Engineer",
                "company": "TechCorp",
                "description": "We need a senior engineer with Python, React, and cloud experience"
            }
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{BASE_URL}/api/optimize-resume",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "optimized_resume" in data and "application_strength" in data:
                    score = data.get("application_strength", {}).get("score", "N/A")
                    print(f"   ✅ PASS - LLM optimization successful (Score: {score})")
                    results.append(("POST /api/optimize-resume", True, f"LLM optimization successful (Score: {score})"))
                else:
                    print(f"   ❌ FAIL - Missing required fields in response")
                    results.append(("POST /api/optimize-resume", False, "Missing required fields"))
            else:
                print(f"   ❌ FAIL - Status {response.status_code}: {response.text}")
                results.append(("POST /api/optimize-resume", False, f"Status {response.status_code}"))
                
    except Exception as e:
        print(f"   ❌ FAIL - Request failed: {str(e)}")
        results.append(("POST /api/optimize-resume", False, f"Request failed: {str(e)}"))
    
    print()
    
    # 3. Test auth endpoints
    print("3️⃣ Testing GET /api/auth/me - Should return 401 when not authenticated")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{BASE_URL}/api/auth/me")
            
            if response.status_code == 401:
                print("   ✅ PASS - Correctly returns 401 when not authenticated")
                results.append(("GET /api/auth/me", True, "Returns 401 when not authenticated"))
            else:
                print(f"   ❌ FAIL - Expected 401, got {response.status_code}")
                results.append(("GET /api/auth/me", False, f"Expected 401, got {response.status_code}"))
                
    except Exception as e:
        print(f"   ❌ FAIL - Request failed: {str(e)}")
        results.append(("GET /api/auth/me", False, f"Request failed: {str(e)}"))
    
    print()
    
    print("4️⃣ Testing POST /api/auth/logout")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{BASE_URL}/api/auth/logout")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Logged out successfully":
                    print("   ✅ PASS - Logout endpoint working correctly")
                    results.append(("POST /api/auth/logout", True, "Logout successful"))
                else:
                    print(f"   ❌ FAIL - Unexpected response: {data}")
                    results.append(("POST /api/auth/logout", False, f"Unexpected response: {data}"))
            else:
                print(f"   ❌ FAIL - Status {response.status_code}: {response.text}")
                results.append(("POST /api/auth/logout", False, f"Status {response.status_code}"))
                
    except Exception as e:
        print(f"   ❌ FAIL - Request failed: {str(e)}")
        results.append(("POST /api/auth/logout", False, f"Request failed: {str(e)}"))
    
    print()
    
    # 5. Test resume versions endpoints
    session_id = str(uuid.uuid4())
    
    print("5️⃣ Testing GET /api/resume-versions/{session_id}")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{BASE_URL}/api/resume-versions/{session_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"   ✅ PASS - Returns array with {len(data)} versions")
                    results.append(("GET /api/resume-versions/{session_id}", True, f"Returns array with {len(data)} versions"))
                else:
                    print(f"   ❌ FAIL - Expected array, got: {type(data)}")
                    results.append(("GET /api/resume-versions/{session_id}", False, f"Expected array, got: {type(data)}"))
            else:
                print(f"   ❌ FAIL - Status {response.status_code}: {response.text}")
                results.append(("GET /api/resume-versions/{session_id}", False, f"Status {response.status_code}"))
                
    except Exception as e:
        print(f"   ❌ FAIL - Request failed: {str(e)}")
        results.append(("GET /api/resume-versions/{session_id}", False, f"Request failed: {str(e)}"))
    
    print()
    
    print("6️⃣ Testing POST /api/resume-versions - Create new version")
    try:
        test_version = {
            "session_id": session_id,
            "name": "Test Resume v1",
            "target_job_title": "Senior Software Engineer",
            "target_company": "TechCorp",
            "original_profile": {
                "name": "John Doe",
                "email": "john@example.com",
                "skills": ["Python", "React"]
            },
            "optimized_resume": {
                "name": "John Doe",
                "email": "john@example.com", 
                "summary": "Optimized summary for TechCorp position",
                "skills": ["Python", "React", "AWS"]
            },
            "keyword_analysis": {
                "keywords": ["Python", "React", "AWS"],
                "matched": ["Python", "React"],
                "missing": ["AWS"]
            },
            "application_strength": {
                "score": 85,
                "feedback": "Strong match for the position"
            },
            "is_original": False
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/api/resume-versions",
                json=test_version,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data.get("name") == "Test Resume v1":
                    print(f"   ✅ PASS - Created version with ID: {data['id']}")
                    results.append(("POST /api/resume-versions", True, f"Created version with ID: {data['id']}"))
                else:
                    print(f"   ❌ FAIL - Missing ID or incorrect data")
                    results.append(("POST /api/resume-versions", False, "Missing ID or incorrect data"))
            else:
                print(f"   ❌ FAIL - Status {response.status_code}: {response.text}")
                results.append(("POST /api/resume-versions", False, f"Status {response.status_code}"))
                
    except Exception as e:
        print(f"   ❌ FAIL - Request failed: {str(e)}")
        results.append(("POST /api/resume-versions", False, f"Request failed: {str(e)}"))
    
    print()
    
    # Summary
    print("=" * 60)
    print("📊 REVIEW REQUEST TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    print(f"🎯 Success Rate: {(passed/total)*100:.1f}%")
    
    print("\n📋 DETAILED RESULTS:")
    for endpoint, success, details in results:
        status = "✅" if success else "❌"
        print(f"   {status} {endpoint}: {details}")
    
    return passed == total

if __name__ == "__main__":
    asyncio.run(test_specific_endpoints())