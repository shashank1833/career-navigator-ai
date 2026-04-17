import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AnalysisProfile, AnalysisResult } from "@/types/analysis";
import type { ResumeOptimization } from "@/types/jobs";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export interface ResumeVersion {
  id: string;
  name: string;
  target_job_title: string | null;
  target_company: string | null;
  profile_data: AnalysisProfile;
  analysis_data: AnalysisResult | null;
  optimized_summary: string | null;
  optimized_skills: string[];
  optimized_bullet_points: Array<{ original: string; optimized: string }>;
  application_strength: number | null;
  is_original: boolean;
  created_at: string;
}

const mapRow = (v: any): ResumeVersion => ({
  id: v.id,
  name: v.name,
  target_job_title: v.target_job_title || null,
  target_company: v.target_company || null,
  profile_data: v.original_profile || v.profile_data || {} as AnalysisProfile,
  analysis_data: v.analysis_data || null,
  optimized_summary: v.optimized_resume?.summary || v.optimized_summary || null,
  optimized_skills: v.optimized_resume?.skills || v.optimized_skills || [],
  optimized_bullet_points: v.optimized_resume?.experiences
    ? v.optimized_resume.experiences.flatMap((exp: any) =>
        (exp.bullets || []).map((b: string) => ({ original: b, optimized: b }))
      )
    : v.optimized_bullet_points || [],
  application_strength: v.application_strength?.score || v.application_strength || null,
  is_original: v.is_original || false,
  created_at: v.created_at || "",
});

export const useResumeVersions = () => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const ownerId = user?.user_id;

  const fetchVersions = useCallback(async () => {
    if (!ownerId) {
      setVersions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/resume-versions/${ownerId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const seen = new Set<string>();
        const deduped = data.map(mapRow).filter((v: ResumeVersion) => {
          if (seen.has(v.id)) return false;
          seen.add(v.id);
          return true;
        });
        setVersions(deduped);
      }
    } catch (e) {
      console.error("Failed to fetch resume versions", e);
    }
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const saveOriginalResume = async (profile: AnalysisProfile, analysisResult?: AnalysisResult) => {
    if (!ownerId) return null;
    try {
      // Check if original already exists
      const existing = versions.find((v) => v.is_original);
      if (existing) {
        const res = await fetch(`${API}/resume-versions/${existing.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original_profile: profile,
            analysis_data: analysisResult || null,
          }),
        });
        if (res.ok) {
          const updated = mapRow(await res.json());
          setVersions((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
          return updated;
        }
        return existing;
      }

      const res = await fetch(`${API}/resume-versions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: ownerId,
          name: "Original Resume",
          original_profile: profile,
          is_original: true,
        }),
      });
      if (res.ok) {
        const data = mapRow(await res.json());
        setVersions((prev) => [data, ...prev]);
        return data;
      }
    } catch (e) {
      console.error("Failed to save original resume", e);
    }
    return null;
  };

  const saveOptimizedVersion = async (
    profile: AnalysisProfile,
    jobTitle: string,
    company: string,
    optimization: ResumeOptimization
  ) => {
    if (!ownerId) return null;
    try {
      const res = await fetch(`${API}/resume-versions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: ownerId,
          name: `${jobTitle} at ${company}`,
          target_job_title: jobTitle,
          target_company: company,
          original_profile: profile,
          optimized_resume: {
            summary: optimization.optimizedSections.summary.optimized,
            skills: optimization.optimizedSections.skills.optimized,
          },
          application_strength: { score: optimization.applicationStrength.score },
          is_original: false,
        }),
      });
      if (res.ok) {
        const data = mapRow(await res.json());
        setVersions((prev) => [data, ...prev]);
        return data;
      }
    } catch (e) {
      console.error("Failed to save optimized version", e);
    }
    return null;
  };

  const deleteVersion = async (id: string) => {
    try {
      const res = await fetch(`${API}/resume-versions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setVersions((prev) => prev.filter((v) => v.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete version", e);
    }
  };

  return {
    versions,
    loading,
    saveOriginalResume,
    saveOptimizedVersion,
    deleteVersion,
    refresh: fetchVersions,
  };
};
