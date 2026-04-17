import { useState, useEffect, useRef, useCallback } from "react";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

// Declared outside the hook so it's a stable reference (never triggers re-renders)
const MAX_RECONNECT_ATTEMPTS = 10;

interface ProgressUpdate {
  type: "init" | "progress_update" | "error";
  user_id: string;
  roadmap_id: string;
  completed_steps: string[];
  step_id?: string;
  completed?: boolean;
  updated_at: string;
  message?: string;
}

interface UseRoadmapProgressOptions {
  roadmapId: string | null;
  userId: string | null;
  enabled?: boolean;
}

/**
 * React hook for real-time roadmap progress via WebSocket.
 * Connects to WS /ws/roadmap/{roadmap_id}?user_id={user_id}
 * Automatically reconnects on disconnect.
 */
export function useRoadmapProgress({ roadmapId, userId, enabled = true }: UseRoadmapProgressOptions) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  // enabledRef lets the reconnect closure read the latest value without being a dep
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Build WebSocket URL from the backend URL
  const getWsUrl = useCallback(() => {
    if (!roadmapId || !userId) return null;
    // Convert http(s) to ws(s)
    let wsBase = BACKEND_URL.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
    // Remove trailing slash
    wsBase = wsBase.replace(/\/$/, "");
    return `${wsBase}/ws/roadmap/${roadmapId}?user_id=${userId}`;
  }, [roadmapId, userId]);

  const connect = useCallback(() => {
    const url = getWsUrl();
    if (!url || !enabledRef.current) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: ProgressUpdate = JSON.parse(event.data);

          if (data.type === "init" || data.type === "progress_update") {
            setCompletedSteps(data.completed_steps);
            setLastUpdate(data.updated_at);
          } else if (data.type === "error") {
            if (import.meta.env.DEV) console.warn("[WS] server error:", data.message);
          }
        } catch (e) {
          if (import.meta.env.DEV) console.warn("[WS] failed to parse message:", e);
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        wsRef.current = null;

        // Auto-reconnect with exponential backoff
        if (enabledRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current += 1;
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        // onerror is always followed by onclose, which handles reconnect
        if (import.meta.env.DEV) console.warn("[WS] connection error");
      };
    } catch (e) {
      if (import.meta.env.DEV) console.warn("[WS] failed to create WebSocket:", e);
    }
  }, [getWsUrl]);

  // Connect/disconnect when params change
  useEffect(() => {
    if (enabled && roadmapId && userId) {
      connect();
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [enabled, roadmapId, userId, connect]);

  /**
   * Toggle a step's completion status via WebSocket.
   * Sends { action: "toggle_step", step_id, completed } to the server.
   * The server persists to MongoDB and broadcasts to all clients.
   */
  const toggleStep = useCallback((stepId: string, completed: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (import.meta.env.DEV) console.warn("[WS] not connected, falling back to REST");
      // Fallback: use REST API
      if (!userId || !roadmapId) return;
      fetch(`${BACKEND_URL}/api/user-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          roadmap_id: roadmapId,
          step_id: stepId,
          completed,
        }),
      }).then(() => {
        // Optimistic update
        setCompletedSteps((prev) =>
          completed
            ? [...prev.filter((s) => s !== stepId), stepId]
            : prev.filter((s) => s !== stepId)
        );
      }).catch(err => {
        if (import.meta.env.DEV) console.warn("[WS] REST fallback failed:", err);
      });
      return;
    }

    // Optimistic update (will be corrected by broadcast)
    setCompletedSteps((prev) =>
      completed
        ? [...prev.filter((s) => s !== stepId), stepId]
        : prev.filter((s) => s !== stepId)
    );

    // Send via WebSocket
    wsRef.current.send(JSON.stringify({
      action: "toggle_step",
      step_id: stepId,
      completed,
    }));
  }, [userId, roadmapId]);

  const isStepCompleted = useCallback(
    (stepId: string) => completedSteps.includes(stepId),
    [completedSteps]
  );

  return {
    completedSteps,
    connected,
    lastUpdate,
    toggleStep,
    isStepCompleted,
  };
}
