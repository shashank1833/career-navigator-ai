import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import type { JobListing } from "@/types/jobs";

export type ApplicationStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

export interface JobApplication {
  id: string;
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

export const useJobApplications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setApplications(data as JobApplication[]);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const addApplication = async (job: JobListing, status: ApplicationStatus = "applied", resumeVersionId?: string) => {
    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        session_id: sessionId,
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        location: job.location,
        job_type: job.type,
        salary: job.salary,
        match_score: job.matchScore,
        matching_skills: job.matchingSkills,
        missing_skills: job.missingSkills,
        apply_url: job.applyUrl,
        resume_version_id: resumeVersionId || null,
        status,
        applied_date: status === "applied" ? new Date().toISOString().split("T")[0] : null,
      })
      .select()
      .single();

    if (!error && data) {
      setApplications((prev) => [data as JobApplication, ...prev]);
      return data as JobApplication;
    }
    return null;
  };

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const updates: Partial<JobApplication> = { status };
    if (status === "applied") {
      updates.applied_date = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
      .from("job_applications")
      .update(updates)
      .eq("id", id);

    if (!error) {
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, ...updates } : app))
      );
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ notes })
      .eq("id", id);

    if (!error) {
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, notes } : app))
      );
    }
  };

  const removeApplication = async (id: string) => {
    const { error } = await supabase.from("job_applications").delete().eq("id", id);
    if (!error) {
      setApplications((prev) => prev.filter((app) => app.id !== id));
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
