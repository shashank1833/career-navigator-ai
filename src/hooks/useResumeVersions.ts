import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import type { AnalysisProfile, AnalysisResult } from "@/types/analysis";
import type { ResumeOptimization } from "@/types/jobs";
import type { Json } from "@/integrations/supabase/types";

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
  target_job_title: v.target_job_title,
  target_company: v.target_company,
  profile_data: v.profile_data as unknown as AnalysisProfile,
  analysis_data: (v.analysis_data as unknown as AnalysisResult) || null,
  optimized_summary: v.optimized_summary,
  optimized_skills: v.optimized_skills || [],
  optimized_bullet_points: (v.optimized_bullet_points as unknown as Array<{ original: string; optimized: string }>) || [],
  application_strength: v.application_strength,
  is_original: v.is_original || false,
  created_at: v.created_at || "",
});

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

      // Deduplicate by id
      const seen = new Set<string>();
      const deduped = data.map(mapRow).filter((v) => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });
      setVersions(deduped);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const saveOriginalResume = async (profile: AnalysisProfile, analysisResult?: AnalysisResult, rawText?: string, parsedResume?: any) => {
    // Check DB directly to prevent duplicates
    const { data: existing } = await supabase
      .from("resume_versions")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_original", true)
      .maybeSingle();

    if (existing) {
      // Update with latest analysis data
      const updates: any = {};
      if (analysisResult) {
        updates.analysis_data = JSON.parse(JSON.stringify(analysisResult));
        updates.profile_data = JSON.parse(JSON.stringify(profile));
        updates.optimized_skills = profile.skills;
      }
      if (rawText) updates.raw_text = rawText;
      if (parsedResume) updates.parsed_resume = JSON.parse(JSON.stringify(parsedResume));
      if (Object.keys(updates).length > 0) {
        await supabase
          .from("resume_versions")
          .update(updates)
          .eq("id", existing.id);
        Object.assign(existing, updates);
      }
      const mapped = mapRow(existing);
      setVersions((prev) => {
        const filtered = prev.filter((v) => v.id !== mapped.id);
        return [mapped, ...filtered];
      });
      return mapped;
    }

    const insertData: any = {
      session_id: sessionId,
      name: "Original Resume",
      profile_data: JSON.parse(JSON.stringify(profile)) as Json,
      optimized_skills: profile.skills,
      is_original: true,
      analysis_data: analysisResult ? JSON.parse(JSON.stringify(analysisResult)) as unknown as Json : null,
    };
    if (rawText) insertData.raw_text = rawText;
    if (parsedResume) insertData.parsed_resume = JSON.parse(JSON.stringify(parsedResume));

    const { data, error } = await supabase
      .from("resume_versions")
      .insert(insertData)
      .select()
      .single();

    if (!error && data) {
      const newVersion = mapRow(data);
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
      const newVersion = mapRow(data);
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
