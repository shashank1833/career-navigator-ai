import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import type { JobListing } from "@/types/jobs";
import type { TablesInsert } from "@/integrations/supabase/types";

export const useSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();

  const fetchSavedJobs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_jobs")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSavedJobs(data.map((row) => row.job_data as unknown as JobListing));
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const saveJob = async (job: JobListing) => {
    // Check if already saved
    if (savedJobs.find((j) => j.id === job.id)) return false;

    const insertData: TablesInsert<"saved_jobs"> = {
      session_id: sessionId,
      job_data: job as unknown as Record<string, unknown>,
    };

    const { error } = await supabase.from("saved_jobs").insert(insertData);

    if (!error) {
      setSavedJobs((prev) => [job, ...prev]);
      return true;
    }
    return false;
  };

  const unsaveJob = async (jobId: string) => {
    // We need to find the saved job first
    const { data } = await supabase
      .from("saved_jobs")
      .select("id, job_data")
      .eq("session_id", sessionId);

    const savedRow = data?.find((row) => (row.job_data as unknown as JobListing).id === jobId);
    if (savedRow) {
      const { error } = await supabase.from("saved_jobs").delete().eq("id", savedRow.id);
      if (!error) {
        setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
        return true;
      }
    }
    return false;
  };

  const isJobSaved = (jobId: string) => savedJobs.some((j) => j.id === jobId);

  return {
    savedJobs,
    loading,
    saveJob,
    unsaveJob,
    isJobSaved,
    refresh: fetchSavedJobs,
  };
};
