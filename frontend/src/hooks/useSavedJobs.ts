import { useState } from "react";
import type { JobListing } from "@/types/jobs";

// In-memory saved jobs (replaces Supabase-based persistence)
// TODO: Connect to backend saved jobs API when available
export const useSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState<JobListing[]>([]);

  const saveJob = async (job: JobListing): Promise<boolean> => {
    if (savedJobs.find((j) => j.id === job.id)) return false;
    setSavedJobs((prev) => [job, ...prev]);
    return true;
  };

  const unsaveJob = async (jobId: string): Promise<boolean> => {
    setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
    return true;
  };

  const isJobSaved = (jobId: string) => savedJobs.some((j) => j.id === jobId);

  return {
    savedJobs,
    loading: false,
    saveJob,
    unsaveJob,
    isJobSaved,
    refresh: () => {},
  };
};
