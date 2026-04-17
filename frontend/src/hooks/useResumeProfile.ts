/**
 * useResumeProfile — global source-of-truth for the user's analyzed resume.
 *
 * Persistence strategy:
 *  1. Writes to localStorage immediately (zero-latency reads on every page)
 *  2. Syncs to backend so the profile persists across devices/sessions
 *
 * Consumers (Dashboard, Coach, Simulate, Market Insights, AI Recs) all call
 * `useResumeProfile()` and get the same data without prop-drilling.
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;
const LS_KEY = "career_nav_resume_profile";

export interface ResumeProfile {
  name: string;
  tagline: string;       // current role / position
  experience: string;    // e.g. "3 years"
  education: string;
  skills: string[];
  technologies: string[];
  analyzedAt: string;    // ISO timestamp
}

const EMPTY: ResumeProfile = {
  name: "", tagline: "", experience: "", education: "",
  skills: [], technologies: [], analyzedAt: "",
};

// ── localStorage helpers ─────────────────────────────────────────────

function readLocal(): ResumeProfile | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ResumeProfile) : null;
  } catch {
    return null;
  }
}

function writeLocal(p: ResumeProfile) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    // quota exceeded – ignore
  }
}

// ── hook ─────────────────────────────────────────────────────────────

export function useResumeProfile() {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<ResumeProfile>(() => readLocal() ?? EMPTY);
  const [loading, setLoading] = useState(false);

  // On mount + whenever user changes: try to load from backend (may be newer)
  useEffect(() => {
    if (!user?.user_id) return;
    setLoading(true);
    fetch(`${API}/user-profile/${user.user_id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.skills?.length) {
          const remote: ResumeProfile = {
            name:         data.name        ?? "",
            tagline:      data.tagline     ?? "",
            experience:   data.experience  ?? "",
            education:    data.education   ?? "",
            skills:       data.skills      ?? [],
            technologies: data.technologies ?? [],
            analyzedAt:   data.updated_at  ?? "",
          };
          // Use backend version if it was updated more recently
          const local = readLocal();
          if (!local?.analyzedAt || remote.analyzedAt > local.analyzedAt) {
            setProfileState(remote);
            writeLocal(remote);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  /** Save a new profile (from resume analysis) — updates localStorage and backend */
  const saveProfile = useCallback(async (raw: {
    name?: string;
    tagline?: string;
    experience?: string;
    education?: string;
    skills?: string[];
    technologies?: string[];
  }) => {
    const updated: ResumeProfile = {
      name:         raw.name         ?? "",
      tagline:      raw.tagline      ?? "",
      experience:   raw.experience   ?? "",
      education:    raw.education    ?? "",
      skills:       raw.skills       ?? [],
      technologies: raw.technologies ?? [],
      analyzedAt:   new Date().toISOString(),
    };

    // 1. Write to localStorage immediately
    writeLocal(updated);
    setProfileState(updated);

    // 2. Sync to backend if authenticated
    if (user?.user_id) {
      try {
        await fetch(`${API}/user-profile/${user.user_id}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:         updated.name,
            tagline:      updated.tagline,
            experience:   updated.experience,
            education:    updated.education,
            skills:       updated.skills,
            technologies: updated.technologies,
          }),
        });
      } catch {
        // Backend sync failure is non-fatal — localStorage copy still works
        if (import.meta.env.DEV) console.warn("[useResumeProfile] backend sync failed");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  const hasProfile = Boolean(profile.skills.length > 0 || profile.tagline);

  return { profile, saveProfile, loading, hasProfile };
}
