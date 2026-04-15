#!/usr/bin/env python3
"""
Simple WebSocket test to debug connection issues
"""

import asyncio
import websockets
import json

async def test_simple_ws():
    """Simple WebSocket connection test"""
    # Try internal URL first
    ws_url = "ws://localhost:8001/ws/roadmap/test-rm?user_id=test-user"
    
    print(f"Connecting to: {ws_url}")
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✅ Connected successfully!")
            
            # Wait for init message
            init_msg = await asyncio.wait_for(websocket.recv(), timeout=10)
            print(f"📨 Received init: {init_msg}")
            
            # Send a test message
            test_msg = {
                "action": "toggle_step",
                "step_id": "test-step",
                "completed": True
            }
            await websocket.send(json.dumps(test_msg))
            print(f"📤 Sent: {test_msg}")
            
            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=10)
            print(f"📨 Received response: {response}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_simple_ws())