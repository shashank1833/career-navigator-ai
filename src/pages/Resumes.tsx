import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, ArrowLeft, FileText, Trash2, Eye, Sparkles, Download, Calendar, Award, Code2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useResumeVersions, type ResumeVersion } from "@/hooks/useResumeVersions";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { format } from "date-fns";

const Resumes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { versions, loading, deleteVersion } = useResumeVersions();

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
      // Fallback: navigate with profile data only
      navigate("/analyze", { state: { profileData: version.profile_data } });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="floating-orb w-96 h-96 bg-primary -top-48 -right-48 animate-pulse-glow" />
      <div className="floating-orb w-80 h-80 bg-secondary top-1/3 -left-40 animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Brain className="w-7 h-7 glow-text-primary" />
            <h1 className="text-2xl font-extrabold gradient-text">Resume History</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button onClick={() => navigate("/analyze")} size="sm">
              <Sparkles className="w-4 h-4 mr-2" /> New Analysis
            </Button>
          </div>
        </motion.header>

        {versions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No resumes analyzed yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Upload and analyze a resume to see it here.</p>
            <Button onClick={() => navigate("/analyze")}>
              <Sparkles className="w-4 h-4 mr-2" /> Analyze Resume
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {versions.map((version, i) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-card/80 backdrop-blur border-border hover:border-primary/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Icon & Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">{version.name}</h3>
                            {version.is_original && (
                              <Badge variant="secondary" className="text-xs shrink-0">Original</Badge>
                            )}
                          </div>

                          {version.target_job_title && (
                            <p className="text-xs text-muted-foreground mb-1.5">
                              Optimized for: <span className="text-foreground">{version.target_job_title}</span>
                              {version.target_company && <> at <span className="text-foreground">{version.target_company}</span></>}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {version.created_at ? format(new Date(version.created_at), "MMM d, yyyy") : "—"}
                            </span>
                            {version.application_strength != null && (
                              <span className="flex items-center gap-1">
                                <Award className="w-3 h-3 text-primary" />
                                Score: <span className="text-primary font-medium">{version.application_strength}%</span>
                              </span>
                            )}
                            {version.optimized_skills.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Code2 className="w-3 h-3" />
                                {version.optimized_skills.length} skills
                              </span>
                            )}
                            {version.profile_data?.technologies && (
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {Array.isArray(version.profile_data.technologies) ? version.profile_data.technologies.length : 0} projects
                              </span>
                            )}
                          </div>

                          {/* Skills preview */}
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
                          onClick={() => handleViewAnalysis(version)}
                          className="gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate("/analyze")}
                          className="gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Optimize
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(version.id, version.name)}
                          className="text-destructive hover:text-destructive gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resumes;
