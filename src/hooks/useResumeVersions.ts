import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import type { AnalysisProfile } from "@/types/analysis";
import type { ResumeOptimization } from "@/types/jobs";
import type { Json } from "@/integrations/supabase/types";

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
        id: v.id,
        name: v.name,
        target_job_title: v.target_job_title,
        target_company: v.target_company,
        profile_data: v.profile_data as unknown as AnalysisProfile,
        optimized_summary: v.optimized_summary,
        optimized_skills: v.optimized_skills || [],
        optimized_bullet_points: (v.optimized_bullet_points as unknown as Array<{ original: string; optimized: string }>) || [],
        application_strength: v.application_strength,
        is_original: v.is_original || false,
        created_at: v.created_at || "",
      })));
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const saveOriginalResume = async (profile: AnalysisProfile) => {
    // Check DB directly to prevent duplicates (not just in-memory state)
    const { data: existing } = await supabase
      .from("resume_versions")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_original", true)
      .maybeSingle();

    if (existing) {
      const mapped: ResumeVersion = {
        id: existing.id,
        name: existing.name,
        target_job_title: existing.target_job_title,
        target_company: existing.target_company,
        profile_data: existing.profile_data as unknown as AnalysisProfile,
        optimized_summary: existing.optimized_summary,
        optimized_skills: existing.optimized_skills || [],
        optimized_bullet_points: (existing.optimized_bullet_points as unknown as Array<{ original: string; optimized: string }>) || [],
        application_strength: existing.application_strength,
        is_original: existing.is_original || false,
        created_at: existing.created_at || "",
      };
      // Update in-memory state if not already there
      setVersions((prev) => {
        if (prev.some((v) => v.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
      return mapped;
    }

    const { data, error } = await supabase
      .from("resume_versions")
      .insert({
        session_id: sessionId,
        name: "Original Resume",
        profile_data: JSON.parse(JSON.stringify(profile)) as Json,
        optimized_skills: profile.skills,
        is_original: true,
      })
      .select()
      .single();

    if (!error && data) {
      const newVersion: ResumeVersion = {
        id: data.id,
        name: data.name,
        target_job_title: data.target_job_title,
        target_company: data.target_company,
        profile_data: data.profile_data as unknown as AnalysisProfile,
        optimized_summary: data.optimized_summary,
        optimized_skills: data.optimized_skills || [],
        optimized_bullet_points: (data.optimized_bullet_points as unknown as Array<{ original: string; optimized: string }>) || [],
        application_strength: data.application_strength,
        is_original: data.is_original || false,
        created_at: data.created_at || "",
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
        profile_data: JSON.parse(JSON.stringify(profile)) as Json,
        optimized_summary: optimization.optimizedSections.summary.optimized,
        optimized_skills: optimization.optimizedSections.skills.optimized,
        optimized_bullet_points: JSON.parse(JSON.stringify(optimization.optimizedSections.bulletPoints)) as Json,
        application_strength: optimization.applicationStrength.score,
        is_original: false,
      })
      .select()
      .single();

    if (!error && data) {
      const newVersion: ResumeVersion = {
        id: data.id,
        name: data.name,
        target_job_title: data.target_job_title,
        target_company: data.target_company,
        profile_data: data.profile_data as unknown as AnalysisProfile,
        optimized_summary: data.optimized_summary,
        optimized_skills: data.optimized_skills || [],
        optimized_bullet_points: (data.optimized_bullet_points as unknown as Array<{ original: string; optimized: string }>) || [],
        application_strength: data.application_strength,
        is_original: data.is_original || false,
        created_at: data.created_at || "",
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
