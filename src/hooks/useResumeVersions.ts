import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import type { AnalysisProfile } from "@/types/analysis";
import type { ResumeOptimization } from "@/types/jobs";

export interface ResumeVersion {
  id: string;
  name: string;
  target_job_title: string | null;
  target_company: string | null;
  profile_data: AnalysisProfile;
  optimized_summary: string | null;
  optimized_skills: string[];
  optimized_bullet_points: Array<{ original: string; optimized: string }>;
  application_strength: number | null;
  is_original: boolean;
  created_at: string;
}

export const useResumeVersions = () => {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("resume_versions")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVersions(data.map(v => ({
        ...v,
        profile_data: v.profile_data as unknown as AnalysisProfile,
        optimized_bullet_points: (v.optimized_bullet_points as unknown as Array<{ original: string; optimized: string }>) || [],
      })));
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const saveOriginalResume = async (profile: AnalysisProfile) => {
    // Check if original already exists
    const existing = versions.find((v) => v.is_original);
    if (existing) return existing;

    const { data, error } = await supabase
      .from("resume_versions")
      .insert({
        session_id: sessionId,
        name: "Original Resume",
        profile_data: profile as unknown as Record<string, unknown>,
        optimized_skills: profile.skills,
        is_original: true,
      })
      .select()
      .single();

    if (!error && data) {
      const newVersion = {
        ...data,
        profile_data: data.profile_data as unknown as AnalysisProfile,
        optimized_bullet_points: (data.optimized_bullet_points as unknown as Array<{ original: string; optimized: string }>) || [],
      };
      setVersions((prev) => [newVersion, ...prev]);
      return newVersion;
    }
    return null;
  };

  const saveOptimizedVersion = async (
    profile: AnalysisProfile,
    jobTitle: string,
    company: string,
    optimization: ResumeOptimization
  ) => {
    const name = `${jobTitle} at ${company}`;
    
    const { data, error } = await supabase
      .from("resume_versions")
      .insert({
        session_id: sessionId,
        name,
        target_job_title: jobTitle,
        target_company: company,
        profile_data: profile as unknown as Record<string, unknown>,
        optimized_summary: optimization.optimizedSections.summary.optimized,
        optimized_skills: optimization.optimizedSections.skills.optimized,
        optimized_bullet_points: optimization.optimizedSections.bulletPoints,
        application_strength: optimization.applicationStrength.score,
        is_original: false,
      })
      .select()
      .single();

    if (!error && data) {
      const newVersion = {
        ...data,
        profile_data: data.profile_data as unknown as AnalysisProfile,
        optimized_bullet_points: (data.optimized_bullet_points as unknown as Array<{ original: string; optimized: string }>) || [],
      };
      setVersions((prev) => [newVersion, ...prev]);
      return newVersion;
    }
    return null;
  };

  const deleteVersion = async (id: string) => {
    const { error } = await supabase.from("resume_versions").delete().eq("id", id);
    if (!error) {
      setVersions((prev) => prev.filter((v) => v.id !== id));
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
