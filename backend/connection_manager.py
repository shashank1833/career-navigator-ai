"""
WebSocket Connection Manager for real-time roadmap progress synchronization.
Tracks active WebSocket connections per roadmap_id and broadcasts progress updates
to all connected clients.
"""
from fastapi import WebSocket
from typing import Dict, List, Set
import logging
import json

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by roadmap_id."""

    def __init__(self):
        # { roadmap_id: { user_id: WebSocket } }
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, roadmap_id: str, user_id: str):
        """Accept a WebSocket connection and register it under the given roadmap."""
        await websocket.accept()
        if roadmap_id not in self.active_connections:
            self.active_connections[roadmap_id] = {}
        self.active_connections[roadmap_id][user_id] = websocket
        logger.info(f"WS connected: user={user_id} roadmap={roadmap_id} "
                     f"(total connections for roadmap: {len(self.active_connections[roadmap_id])})")

    def disconnect(self, roadmap_id: str, user_id: str):
        """Remove a WebSocket connection from the manager."""
        if roadmap_id in self.active_connections:
            self.active_connections[roadmap_id].pop(user_id, None)
            if not self.active_connections[roadmap_id]:
                del self.active_connections[roadmap_id]
        logger.info(f"WS disconnected: user={user_id} roadmap={roadmap_id}")

    async def broadcast_to_roadmap(self, roadmap_id: str, message: dict):
        """Send a JSON message to ALL connections watching the given roadmap."""
        if roadmap_id not in self.active_connections:
            return

        disconnected = []
        for user_id, ws in self.active_connections[roadmap_id].items():
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.warning(f"WS send failed for user={user_id}: {e}")
                disconnected.append(user_id)

        # Clean up broken connections
        for uid in disconnected:
            self.active_connections[roadmap_id].pop(uid, None)
        if roadmap_id in self.active_connections and not self.active_connections[roadmap_id]:
            del self.active_connections[roadmap_id]

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send a JSON message to a single WebSocket connection."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.warning(f"WS personal send failed: {e}")

    def get_connection_count(self, roadmap_id: str) -> int:
        """Get the number of active connections for a roadmap."""
        return len(self.active_connections.get(roadmap_id, {}))


# Singleton instance
manager = ConnectionManager()
