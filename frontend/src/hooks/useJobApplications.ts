import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export type ApplicationStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  job_title: string;
  company: string;
  location: string;
  job_type: string | null;
  salary: string | null;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  apply_url: string | null;
  resume_version_id: string | null;
  status: ApplicationStatus;
  applied_date: string | null;
  notes: string | null;
  created_at: string;
}

interface JobForApplication {
  id: string;
  title: string;
  company: string;
  location?: string;
  type?: string;
  salary?: string;
  matchScore?: number;
  matchingSkills?: string[];
  missingSkills?: string[];
  applyUrl?: string;
}

export const useJobApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    if (!user?.user_id) {
      setApplications([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/job-applications/${user.user_id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Failed to fetch applications", e);
    }
    setLoading(false);
  }, [user?.user_id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const addApplication = async (
    job: JobForApplication,
    status: ApplicationStatus = "applied",
    resumeVersionId?: string
  ) => {
    if (!user?.user_id) return null;
    try {
      const res = await fetch(`${API}/job-applications`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          job_id: job.id,
          job_title: job.title,
          company: job.company,
          location: job.location || "",
          job_type: job.type || null,
          salary: job.salary || null,
          match_score: job.matchScore || 0,
          matching_skills: job.matchingSkills || [],
          missing_skills: job.missingSkills || [],
          apply_url: job.applyUrl || null,
          resume_version_id: resumeVersionId || null,
          status,
          applied_date: status === "applied" ? new Date().toISOString().split("T")[0] : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setApplications((prev) => [data, ...prev]);
        return data as JobApplication;
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Failed to add application", e);
    }
    return null;
  };

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    try {
      const updates: Record<string, string | null> = { status };
      if (status === "applied") {
        updates.applied_date = new Date().toISOString().split("T")[0];
      }
      const res = await fetch(`${API}/job-applications/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, ...updates } : app))
        );
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Failed to update status", e);
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`${API}/job-applications/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, notes } : app))
        );
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Failed to update notes", e);
    }
  };

  const removeApplication = async (id: string) => {
    try {
      const res = await fetch(`${API}/job-applications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setApplications((prev) => prev.filter((app) => app.id !== id));
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Failed to remove application", e);
    }
  };

  return {
    applications,
    loading,
    addApplication,
    updateStatus,
    updateNotes,
    removeApplication,
    refresh: fetchApplications,
  };
};
