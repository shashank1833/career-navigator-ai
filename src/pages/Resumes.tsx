import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Trash2, Eye, Sparkles, Calendar, Award, Code2, Loader2,
  Download, Edit3, Target, MoreHorizontal, Copy, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

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
    navigate("/analyze", {
      state: { profileData: version.profile_data, initialTab: "jobs" },
    });
  };

  const handleDownload = (version: ResumeVersion) => {
    exportVersionAsPdf(version);
    toast.success("PDF downloaded");
  };

  const handleDuplicate = (version: ResumeVersion) => {
    // Navigate to analysis with the version's profile so they can re-optimize
    navigate("/analyze", { state: { profileData: version.profile_data } });
    toast.info("Create a new version by running a fresh analysis");
  };

  const handleEditorSaved = (updated: ResumeVersion) => {
    refresh();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const originals = versions.filter((v) => v.is_original);
  const optimized = versions.filter((v) => !v.is_original);

  return (
    <div className="relative">
      <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-6xl mx-auto px-6 py-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Resumes</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {versions.length} version{versions.length !== 1 ? "s" : ""} — edit, optimize, and download your resumes
            </p>
          </div>
          <Button onClick={() => navigate("/analyze")} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> New Analysis
          </Button>
        </div>

        {versions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No resumes yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Upload your resume to get AI-powered analysis, then optimize it for specific jobs.
            </p>
            <Button onClick={() => navigate("/analyze")} className="gap-1.5">
              <Sparkles className="w-4 h-4" /> Analyze Resume
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Optimized Versions */}
            {optimized.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Job-Optimized Versions
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {optimized.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {optimized.map((version, i) => (
                    <VersionCard
                      key={version.id}
                      version={version}
                      index={i}
                      onView={handleViewAnalysis}
                      onEdit={() => setEditingVersion(version)}
                      onOptimize={() => handleOptimizeForJob(version)}
                      onDownload={() => handleDownload(version)}
                      onDuplicate={() => handleDuplicate(version)}
                      onDelete={() => handleDelete(version.id, version.name)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Original Resumes */}
            {originals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Original Resumes
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {originals.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {originals.map((version, i) => (
                    <VersionCard
                      key={version.id}
                      version={version}
                      index={i}
                      onView={handleViewAnalysis}
                      onEdit={() => setEditingVersion(version)}
                      onOptimize={() => handleOptimizeForJob(version)}
                      onDownload={() => handleDownload(version)}
                      onDuplicate={() => handleDuplicate(version)}
                      onDelete={
                        version.is_original
                          ? undefined
                          : () => handleDelete(version.id, version.name)
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Edit Dialog */}
      {editingVersion && (
        <ResumeEditor
          version={editingVersion}
          open={!!editingVersion}
          onClose={() => setEditingVersion(null)}
          onSaved={handleEditorSaved}
        />
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

const VersionCard = ({
  version, index, onView, onEdit, onOptimize, onDownload, onDuplicate, onDelete,
}: VersionCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <Card className="glass-card-hover group">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {version.name}
                </h3>
                {version.is_original && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    Original
                  </Badge>
                )}
              </div>
              {version.target_job_title && (
                <p className="text-xs text-muted-foreground mb-1.5">
                  <Target className="w-3 h-3 inline mr-1 text-primary" />
                  {version.target_job_title}
                  {version.target_company && (
                    <> at <span className="text-foreground">{version.target_company}</span></>
                  )}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {version.created_at
                    ? format(new Date(version.created_at), "MMM d, yyyy")
                    : "—"}
                </span>
                {version.application_strength != null && (
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-primary" />
                    Score:{" "}
                    <span className="text-primary font-medium">
                      {version.application_strength}%
                    </span>
                  </span>
                )}
                {version.optimized_skills.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    {version.optimized_skills.length} skills
                  </span>
                )}
              </div>
              {version.optimized_skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {version.optimized_skills.slice(0, 6).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0">
                      {skill}
                    </Badge>
                  ))}
                  {version.optimized_skills.length > 6 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      +{version.optimized_skills.length - 6} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="default"
              onClick={() => onView(version)}
              className="gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDownload}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} className="gap-2">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOptimize} className="gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Optimize for Job
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate} className="gap-2">
                  <Copy className="w-3.5 h-3.5" /> New Version
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default Resumes;
