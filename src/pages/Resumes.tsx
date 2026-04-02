import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Trash2, Eye, Sparkles, Calendar, Award, Code2, Loader2,
  Download, Edit3, Target, MoreHorizontal, Copy, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useResumeVersions, type ResumeVersion } from "@/hooks/useResumeVersions";
import ResumeEditor from "@/components/ResumeEditor";
import { exportVersionAsPdf } from "@/lib/version-pdf-export";
import { toast } from "sonner";
import { format } from "date-fns";

const Resumes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { versions, loading, deleteVersion, refresh } = useResumeVersions();
  const [editingVersion, setEditingVersion] = useState<ResumeVersion | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteVersion(id);
    toast.success("Resume version deleted");
  };

  const handleViewAnalysis = (version: ResumeVersion) => {
    if (version.analysis_data) {
      navigate("/analyze", { state: { analysisData: version.analysis_data } });
    } else {
      navigate("/analyze", { state: { profileData: version.profile_data } });
    }
  };

  const handleOptimizeForJob = (version: ResumeVersion) => {
    navigate("/analyze", { state: { profileData: version.profile_data, initialTab: "jobs" } });
  };

  const handleDownload = (version: ResumeVersion) => {
    exportVersionAsPdf(version);
    toast.success("PDF downloaded");
  };

  const handleDuplicate = (version: ResumeVersion) => {
    navigate("/analyze", { state: { profileData: version.profile_data } });
    toast.info("Create a new version by running a fresh analysis");
  };

  const handleEditorSaved = () => { refresh(); };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const originals = versions.filter((v) => v.is_original);
  const optimized = versions.filter((v) => !v.is_original);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">My Resumes</h1>
          <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">
            {versions.length} version{versions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => navigate("/analyze")} className="ed-btn">
          <Plus className="w-4 h-4" strokeWidth={1.5} /> New Analysis
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-[15px] font-semibold text-foreground mb-2">No resumes yet</h2>
          <p className="text-[13px] text-muted-foreground mb-6 max-w-sm mx-auto">
            Upload your resume to get AI-powered analysis, then optimize it for specific jobs.
          </p>
          <button onClick={() => navigate("/analyze")} className="ed-btn">
            <Sparkles className="w-4 h-4" strokeWidth={1.5} /> Analyze Resume
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {optimized.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <h2 className="ed-label">Job-Optimized Versions</h2>
                <span className="ed-label bg-muted px-1.5 py-0.5 rounded">{optimized.length}</span>
              </div>
              <div className="space-y-3">
                {optimized.map((version, i) => (
                  <VersionCard key={version.id} version={version} index={i}
                    onView={handleViewAnalysis} onEdit={() => setEditingVersion(version)}
                    onOptimize={() => handleOptimizeForJob(version)} onDownload={() => handleDownload(version)}
                    onDuplicate={() => handleDuplicate(version)} onDelete={() => handleDelete(version.id, version.name)} />
                ))}
              </div>
            </div>
          )}

          {originals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <h2 className="ed-label">Original Resumes</h2>
                <span className="ed-label bg-muted px-1.5 py-0.5 rounded">{originals.length}</span>
              </div>
              <div className="space-y-3">
                {originals.map((version, i) => (
                  <VersionCard key={version.id} version={version} index={i}
                    onView={handleViewAnalysis} onEdit={() => setEditingVersion(version)}
                    onOptimize={() => handleOptimizeForJob(version)} onDownload={() => handleDownload(version)}
                    onDuplicate={() => handleDuplicate(version)}
                    onDelete={version.is_original ? undefined : () => handleDelete(version.id, version.name)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {editingVersion && (
        <ResumeEditor version={editingVersion} open={!!editingVersion} onClose={() => setEditingVersion(null)} onSaved={handleEditorSaved} />
      )}
    </div>
  );
};

interface VersionCardProps {
  version: ResumeVersion;
  index: number;
  onView: (v: ResumeVersion) => void;
  onEdit: () => void;
  onOptimize: () => void;
  onDownload: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
}

const VersionCard = ({ version, onView, onEdit, onOptimize, onDownload, onDuplicate, onDelete }: VersionCardProps) => (
  <div className="ed-card">
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="p-2.5 rounded-lg bg-muted shrink-0">
          <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground text-[13px] truncate">{version.name}</h3>
            {version.is_original && (
              <span className="ed-skill-pill text-[10px]">Original</span>
            )}
          </div>
          {version.target_job_title && (
            <p className="text-[11px] text-muted-foreground mb-1.5">
              <Target className="w-3 h-3 inline mr-1 text-primary" strokeWidth={1.5} />
              {version.target_job_title}
              {version.target_company && <> at <span className="text-foreground">{version.target_company}</span></>}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" strokeWidth={1.5} />
              {version.created_at ? format(new Date(version.created_at), "MMM d, yyyy") : "—"}
            </span>
            {version.application_strength != null && (
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3 text-primary" strokeWidth={1.5} />
                <span className="font-mono text-primary font-medium">{version.application_strength}%</span>
              </span>
            )}
            {version.optimized_skills.length > 0 && (
              <span className="flex items-center gap-1">
                <Code2 className="w-3 h-3" strokeWidth={1.5} />
                {version.optimized_skills.length} skills
              </span>
            )}
          </div>
          {version.optimized_skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {version.optimized_skills.slice(0, 6).map((skill) => (
                <span key={skill} className="ed-skill-pill text-[10px]">{skill}</span>
              ))}
              {version.optimized_skills.length > 6 && (
                <span className="ed-skill-pill text-[10px]">+{version.optimized_skills.length - 6} more</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => onView(version)} className="ed-btn text-[11px] py-1.5 px-3">
          <Eye className="w-3.5 h-3.5" strokeWidth={1.5} /> View
        </button>
        <button onClick={onDownload} className="ed-btn text-[11px] py-1.5 px-3">
          <Download className="w-3.5 h-3.5" strokeWidth={1.5} /> PDF
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem onClick={onEdit} className="gap-2 text-[13px]">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOptimize} className="gap-2 text-[13px]">
              <Sparkles className="w-3.5 h-3.5" /> Optimize for Job
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate} className="gap-2 text-[13px]">
              <Copy className="w-3.5 h-3.5" /> New Version
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="gap-2 text-[13px] text-destructive focus:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
);

export default Resumes;
