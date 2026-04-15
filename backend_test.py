#!/usr/bin/env python3
"""
Backend API Testing Suite for Career Navigation App
Tests WebSocket real-time roadmap progress and all existing REST endpoints
"""

import asyncio
import websockets
import json
import requests
import uuid
from datetime import datetime
import sys
import traceback

# Backend URL from environment configuration
BACKEND_URL = "https://career-compass-1048.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"
# Use internal URL for WebSocket since external ingress doesn't support WebSocket
WS_BASE = "ws://localhost:8001"

class BackendTester:
    def __init__(self):
        self.test_results = []
        self.failed_tests = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status} {test_name}"
        if details:
            result += f" - {details}"
        print(result)
        self.test_results.append((test_name, success, details))
        if not success:
            self.failed_tests.append((test_name, details))
    
    def test_rest_endpoints(self):
        """Test all existing REST API endpoints"""
        print("\n=== Testing REST API Endpoints ===")
        
        # Test 1: GET /api/ (Hello World)
        try:
            response = requests.get(f"{API_BASE}/", timeout=10)
            if response.status_code == 200 and "Hello World" in response.json().get("message", ""):
                self.log_result("GET /api/ (Hello World)", True, "Returns Hello World message")
            else:
                self.log_result("GET /api/ (Hello World)", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("GET /api/ (Hello World)", False, f"Exception: {str(e)}")
        
        # Test 2: GET /api/careers (12 careers)
        try:
            response = requests.get(f"{API_BASE}/careers", timeout=10)
            if response.status_code == 200:
                careers = response.json()
                if len(careers) == 12:
                    self.log_result("GET /api/careers", True, f"Returns {len(careers)} careers")
                else:
                    self.log_result("GET /api/careers", False, f"Expected 12 careers, got {len(careers)}")
            else:
                self.log_result("GET /api/careers", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/careers", False, f"Exception: {str(e)}")
        
        # Test 3: GET /api/roadmaps (5 roadmaps)
        try:
            response = requests.get(f"{API_BASE}/roadmaps", timeout=10)
            if response.status_code == 200:
                roadmaps = response.json()
                if len(roadmaps) == 5:
                    self.log_result("GET /api/roadmaps", True, f"Returns {len(roadmaps)} roadmaps")
                else:
                    self.log_result("GET /api/roadmaps", False, f"Expected 5 roadmaps, got {len(roadmaps)}")
            else:
                self.log_result("GET /api/roadmaps", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/roadmaps", False, f"Exception: {str(e)}")
        
        # Test 4: GET /api/skills-categories (5 categories)
        try:
            response = requests.get(f"{API_BASE}/skills-categories", timeout=10)
            if response.status_code == 200:
                categories = response.json()
                if len(categories) == 5:
                    self.log_result("GET /api/skills-categories", True, f"Returns {len(categories)} categories")
                else:
                    self.log_result("GET /api/skills-categories", False, f"Expected 5 categories, got {len(categories)}")
            else:
                self.log_result("GET /api/skills-categories", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/skills-categories", False, f"Exception: {str(e)}")
        
        # Test 5: POST /api/user-progress (REST still works)
        try:
            test_user_id = f"test-user-{uuid.uuid4().hex[:8]}"
            test_roadmap_id = "test-roadmap-rest"
            test_step_id = "test-step-rest"
            
            payload = {
                "user_id": test_user_id,
                "roadmap_id": test_roadmap_id,
                "step_id": test_step_id,
                "completed": True
            }
            response = requests.post(f"{API_BASE}/user-progress", json=payload, timeout=10)
            if response.status_code == 200 and response.json().get("success"):
                self.log_result("POST /api/user-progress", True, "Progress saved successfully")
            else:
                self.log_result("POST /api/user-progress", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("POST /api/user-progress", False, f"Exception: {str(e)}")
        
        # Test 6: GET /api/user-progress/{user_id}
        try:
            response = requests.get(f"{API_BASE}/user-progress/{test_user_id}", timeout=10)
            if response.status_code == 200:
                progress = response.json()
                if isinstance(progress, list):
                    self.log_result("GET /api/user-progress/{user_id}", True, f"Returns progress array with {len(progress)} items")
                else:
                    self.log_result("GET /api/user-progress/{user_id}", False, "Response is not an array")
            else:
                self.log_result("GET /api/user-progress/{user_id}", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/user-progress/{user_id}", False, f"Exception: {str(e)}")

    async def test_websocket_endpoint(self):
        """Test WebSocket endpoint for real-time roadmap progress"""
        print("\n=== Testing WebSocket Endpoint ===")
        
        test_roadmap_id = "test-rm-ws"
        test_user_id = "test-user-ws"
        ws_url = f"{WS_BASE}/ws/roadmap/{test_roadmap_id}?user_id={test_user_id}"
        
        try:
            # Test 1: Connection without user_id should be rejected
            try:
                ws_url_no_user = f"{WS_BASE}/ws/roadmap/{test_roadmap_id}"
                async with websockets.connect(ws_url_no_user) as ws:
                    # Should not reach here
                    self.log_result("WS Connection without user_id rejection", False, "Connection was accepted when it should be rejected")
            except websockets.exceptions.ConnectionClosedError as e:
                if e.code == 4001:
                    self.log_result("WS Connection without user_id rejection", True, f"Correctly rejected with code {e.code}")
                else:
                    self.log_result("WS Connection without user_id rejection", False, f"Wrong close code: {e.code}")
            except websockets.exceptions.InvalidStatus as e:
                if e.response.status_code == 403:
                    self.log_result("WS Connection without user_id rejection", True, f"Correctly rejected with HTTP {e.response.status_code}")
                else:
                    self.log_result("WS Connection without user_id rejection", False, f"Unexpected HTTP status: {e.response.status_code}")
            except Exception as e:
                error_str = str(e)
                if "HTTP 403" in error_str:
                    self.log_result("WS Connection without user_id rejection", True, "Correctly rejected with HTTP 403")
                else:
                    self.log_result("WS Connection without user_id rejection", False, f"Unexpected error: {error_str}")
            
            # Test 2: Valid connection and init message
            try:
                async with websockets.connect(ws_url) as ws:
                    # Should receive init message on connect
                    init_msg = await asyncio.wait_for(ws.recv(), timeout=5)
                    init_data = json.loads(init_msg)
                    
                    if init_data.get("type") == "init":
                        self.log_result("WS Init message on connect", True, f"Received init with {len(init_data.get('completed_steps', []))} completed steps")
                    else:
                        self.log_result("WS Init message on connect", False, f"Expected init message, got: {init_data}")
                    
                    # Test 3: Toggle step ON
                    toggle_on_msg = {
                        "action": "toggle_step",
                        "step_id": "step-1",
                        "completed": True
                    }
                    await ws.send(json.dumps(toggle_on_msg))
                    
                    response_msg = await asyncio.wait_for(ws.recv(), timeout=5)
                    response_data = json.loads(response_msg)
                    
                    if (response_data.get("type") == "progress_update" and 
                        "step-1" in response_data.get("completed_steps", [])):
                        self.log_result("WS Toggle step ON", True, "Step-1 added to completed_steps")
                    else:
                        self.log_result("WS Toggle step ON", False, f"Unexpected response: {response_data}")
                    
                    # Test 4: Toggle step OFF
                    toggle_off_msg = {
                        "action": "toggle_step",
                        "step_id": "step-1",
                        "completed": False
                    }
                    await ws.send(json.dumps(toggle_off_msg))
                    
                    response_msg2 = await asyncio.wait_for(ws.recv(), timeout=5)
                    response_data2 = json.loads(response_msg2)
                    
                    if (response_data2.get("type") == "progress_update" and 
                        "step-1" not in response_data2.get("completed_steps", [])):
                        self.log_result("WS Toggle step OFF", True, "Step-1 removed from completed_steps")
                    else:
                        self.log_result("WS Toggle step OFF", False, f"Unexpected response: {response_data2}")
                    
                    # Test 5: Multiple steps
                    await ws.send(json.dumps({
                        "action": "toggle_step",
                        "step_id": "step-a",
                        "completed": True
                    }))
                    
                    await ws.send(json.dumps({
                        "action": "toggle_step",
                        "step_id": "step-b",
                        "completed": True
                    }))
                    
                    # Receive both responses
                    msg3 = json.loads(await asyncio.wait_for(ws.recv(), timeout=5))
                    msg4 = json.loads(await asyncio.wait_for(ws.recv(), timeout=5))
                    
                    # Check if both steps are in completed_steps
                    final_steps = msg4.get("completed_steps", [])
                    if "step-a" in final_steps and "step-b" in final_steps:
                        self.log_result("WS Multiple steps", True, f"Both step-a and step-b in completed_steps: {final_steps}")
                    else:
                        self.log_result("WS Multiple steps", False, f"Missing steps in final list: {final_steps}")
                        
            except asyncio.TimeoutError:
                self.log_result("WS Basic functionality", False, "Timeout waiting for WebSocket response")
            except Exception as e:
                self.log_result("WS Basic functionality", False, f"Exception: {str(e)}")
                
        except Exception as e:
            self.log_result("WS Connection", False, f"Failed to connect: {str(e)}")
    
    async def test_websocket_broadcast(self):
        """Test WebSocket broadcast to multiple clients"""
        print("\n=== Testing WebSocket Broadcast ===")
        
        test_roadmap_id = "test-rm-broadcast"
        user1_id = "test-user-1"
        user2_id = "test-user-2"
        
        try:
            ws1_url = f"{WS_BASE}/ws/roadmap/{test_roadmap_id}?user_id={user1_id}"
            ws2_url = f"{WS_BASE}/ws/roadmap/{test_roadmap_id}?user_id={user2_id}"
            
            async with websockets.connect(ws1_url) as ws1, \
                       websockets.connect(ws2_url) as ws2:
                
                # Consume init messages
                await ws1.recv()
                await ws2.recv()
                
                # User 1 toggles a step
                await ws1.send(json.dumps({
                    "action": "toggle_step",
                    "step_id": "broadcast-step",
                    "completed": True
                }))
                
                # Both clients should receive the broadcast
                msg1 = json.loads(await asyncio.wait_for(ws1.recv(), timeout=5))
                msg2 = json.loads(await asyncio.wait_for(ws2.recv(), timeout=5))
                
                if (msg1.get("type") == "progress_update" and 
                    msg2.get("type") == "progress_update" and
                    "broadcast-step" in msg1.get("completed_steps", []) and
                    "broadcast-step" in msg2.get("completed_steps", [])):
                    self.log_result("WS Broadcast to multiple clients", True, "Both clients received the update")
                else:
                    self.log_result("WS Broadcast to multiple clients", False, f"Broadcast failed - msg1: {msg1}, msg2: {msg2}")
                    
        except Exception as e:
            self.log_result("WS Broadcast to multiple clients", False, f"Exception: {str(e)}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("BACKEND TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for _, success, _ in self.test_results if success)
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if self.failed_tests:
            print("\nFAILED TESTS:")
            for test_name, details in self.failed_tests:
                print(f"❌ {test_name}: {details}")
        
        print(f"\nSuccess Rate: {(passed_tests/total_tests)*100:.1f}%")
        return failed_tests == 0

async def main():
    """Run all backend tests"""
    print("Starting Backend API Testing Suite")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"WebSocket URL: {WS_BASE} (internal - external ingress doesn't support WebSocket)")
    
    tester = BackendTester()
    
    # Test REST endpoints
    tester.test_rest_endpoints()
    
    # Test WebSocket endpoints
    await tester.test_websocket_endpoint()
    await tester.test_websocket_broadcast()
    
    # Print summary
    success = tester.print_summary()
    
    return success

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nTest suite failed with exception: {e}")
        traceback.print_exc()
        sys.exit(1)