import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, GitCompare, Trash2, Star, Calendar, Target, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardCard from "./DashboardCard";
import type { ResumeVersion } from "@/hooks/useResumeVersions";

interface ResumeVersionsProps {
  versions: ResumeVersion[];
  loading: boolean;
  onDelete: (id: string) => void;
  onSelect?: (version: ResumeVersion) => void;
}

const ResumeVersions = ({ versions, loading, onDelete, onSelect }: ResumeVersionsProps) => {
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<ResumeVersion[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleSelect = (version: ResumeVersion) => {
    if (selected.find(v => v.id === version.id)) {
      setSelected(selected.filter(v => v.id !== version.id));
    } else if (selected.length < 2) {
      setSelected([...selected, version]);
    }
  };

  const handleCompare = () => {
    if (selected.length === 2) {
      setShowCompare(true);
    }
  };

  if (loading) {
    return (
      <DashboardCard title="Resume Versions" icon={FileText} accentColor="secondary">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading resume versions...</p>
        </div>
      </DashboardCard>
    );
  }

  if (versions.length === 0) {
    return (
      <DashboardCard title="Resume Versions" icon={FileText} accentColor="secondary">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No resume versions yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Optimize your resume for specific jobs to create versions
          </p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Resume Versions" icon={FileText} accentColor="secondary">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{versions.length} version{versions.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          {compareMode ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setCompareMode(false); setSelected([]); }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCompare}
                disabled={selected.length !== 2}
                className="text-xs"
              >
                <GitCompare className="w-3 h-3 mr-1" />
                Compare ({selected.length}/2)
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCompareMode(true)}
              className="text-xs text-muted-foreground"
              disabled={versions.length < 2}
            >
              <GitCompare className="w-3 h-3 mr-1" />
              Compare Versions
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {versions.map((version, i) => (
          <motion.div
            key={version.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card-hover p-4 mb-3 cursor-pointer transition-all ${
              compareMode && selected.find(v => v.id === version.id)
                ? "ring-2 ring-primary"
                : ""
            }`}
            onClick={() => compareMode ? toggleSelect(version) : onSelect?.(version)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {version.is_original && (
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  )}
                  <h4 className="font-semibold text-foreground text-sm truncate">
                    {version.name}
                  </h4>
                </div>
                
                {version.target_job_title && (
                  <div className="flex items-center gap-1.5 text-xs text-primary mb-1">
                    <Target className="w-3 h-3" />
                    <span>Optimized for {version.target_job_title}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(version.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {version.application_strength && (
                  <Badge variant="outline" className="text-[10px]">
                    {version.application_strength}% strength
                  </Badge>
                )}
                {!compareMode && !version.is_original && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(version.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                {!compareMode && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {version.optimized_skills.slice(0, 5).map((skill) => (
                <Badge key={skill} className="text-[10px] bg-secondary/15 text-secondary border-secondary/30">
                  {skill}
                </Badge>
              ))}
              {version.optimized_skills.length > 5 && (
                <Badge variant="outline" className="text-[10px]">
                  +{version.optimized_skills.length - 5} more
                </Badge>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Compare Dialog */}
      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Resume Versions</DialogTitle>
          </DialogHeader>
          
          {selected.length === 2 && (
            <div className="grid grid-cols-2 gap-4">
              {selected.map((version) => (
                <div key={version.id} className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">{version.name}</h4>
                    {version.application_strength && (
                      <Badge className="text-xs bg-primary/10 text-primary">
                        {version.application_strength}% strength
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">SKILLS</h5>
                    <div className="flex flex-wrap gap-1">
                      {version.optimized_skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-[10px]">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {version.optimized_summary && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-2">SUMMARY</h5>
                      <p className="text-xs text-foreground/80">{version.optimized_summary}</p>
                    </div>
                  )}

                  {version.optimized_bullet_points.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-2">
                        EXPERIENCE BULLETS
                      </h5>
                      <ul className="space-y-1">
                        {version.optimized_bullet_points.slice(0, 3).map((bp, idx) => (
                          <li key={idx} className="text-xs text-foreground/80">
                            • {bp.optimized}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardCard>
  );
};

export default ResumeVersions;
