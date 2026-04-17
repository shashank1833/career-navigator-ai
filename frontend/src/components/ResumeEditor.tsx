import { useState } from "react";
import { motion } from "framer-motion";
import { Save, X, Plus, Trash2, FileText, Sparkles, Code2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardCard from "./DashboardCard";
import type { ResumeVersion } from "@/hooks/useResumeVersions";
import { toast } from "sonner";

const BACKEND_URL_EDITOR = import.meta.env.REACT_APP_BACKEND_URL || "";
const API_EDITOR = `${BACKEND_URL_EDITOR}/api`;

interface ResumeEditorProps {
  version: ResumeVersion;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: ResumeVersion) => void;
}

const ResumeEditor = ({ version, open, onClose, onSaved }: ResumeEditorProps) => {
  const [name, setName] = useState(version.name);
  const [summary, setSummary] = useState(version.optimized_summary || "");
  const [skills, setSkills] = useState<string[]>([...version.optimized_skills]);
  const [newSkill, setNewSkill] = useState("");
  const [bulletPoints, setBulletPoints] = useState(
    version.optimized_bullet_points.map((bp) => ({ ...bp }))
  );
  const [saving, setSaving] = useState(false);

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const updateBullet = (index: number, field: "original" | "optimized", value: string) => {
    const updated = [...bulletPoints];
    updated[index] = { ...updated[index], [field]: value };
    setBulletPoints(updated);
  };

  const addBullet = () => {
    setBulletPoints([...bulletPoints, { original: "", optimized: "" }]);
  };

  const removeBullet = (index: number) => {
    setBulletPoints(bulletPoints.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_EDITOR}/resume-versions/${version.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          optimized_summary: summary || null,
          optimized_skills: skills,
          optimized_bullet_points: bulletPoints,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");

      const updated: ResumeVersion = {
        ...version,
        name,
        optimized_summary: summary || null,
        optimized_skills: skills,
        optimized_bullet_points: bulletPoints,
      };
      onSaved(updated);
      toast.success("Resume version updated");
      onClose();
    } catch (e) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Edit Resume Version
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Version Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/30" />
          </div>

          {/* Summary */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Professional Summary
            </label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="bg-muted/30 resize-none"
              placeholder="Write a professional summary tailored to the target role..."
            />
          </div>

          {/* Skills */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Skills
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  className="text-xs bg-primary/10 text-primary border-primary/30 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  onClick={() => removeSkill(skill)}
                >
                  {skill} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add a skill..."
                className="bg-muted/30 flex-1"
              />
              <Button size="sm" variant="outline" onClick={addSkill} disabled={!newSkill.trim()}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Experience Bullet Points */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Experience Bullet Points
              </label>
              <Button size="sm" variant="ghost" onClick={addBullet} className="text-xs text-primary">
                <Plus className="w-3 h-3 mr-1" /> Add Bullet
              </Button>
            </div>
            <div className="space-y-3">
              {bulletPoints.map((bp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-muted-foreground font-medium">Bullet #{i + 1}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-6 h-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeBullet(i)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <Textarea
                    value={bp.optimized}
                    onChange={(e) => updateBullet(i, "optimized", e.target.value)}
                    rows={2}
                    className="bg-background/50 resize-none text-sm"
                    placeholder="Optimized bullet point..."
                  />
                </motion.div>
              ))}
              {bulletPoints.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No bullet points yet. Click "Add Bullet" to start.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeEditor;
