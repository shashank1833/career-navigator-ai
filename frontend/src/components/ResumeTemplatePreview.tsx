import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Linkedin, Briefcase,
  GraduationCap, Code2, FolderGit2, FileText, Edit3,
  Save, X, Plus, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export interface TemplateData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  skills: string[];
  experiences: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  education: string;
}

interface ResumeTemplatePreviewProps {
  data: TemplateData;
  editable?: boolean;
  onChange?: (data: TemplateData) => void;
  highlightChanges?: boolean;
  originalData?: TemplateData | null;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/20">
    <Icon className="w-4 h-4 text-primary" />
    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">{title}</h3>
  </div>
);

const ResumeTemplatePreview = ({
  data,
  editable = false,
  onChange,
  highlightChanges = false,
  originalData,
}: ResumeTemplatePreviewProps) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<any>(null);
  const [newSkill, setNewSkill] = useState("");

  const startEdit = (section: string, value: any) => {
    if (!editable) return;
    setEditingSection(section);
    setEditBuffer(JSON.parse(JSON.stringify(value)));
  };

  const saveEdit = (section: string) => {
    if (!onChange) return;
    const updated = { ...data };
    switch (section) {
      case "summary":
        updated.summary = editBuffer;
        break;
      case "skills":
        updated.skills = editBuffer;
        break;
      case "experiences":
        updated.experiences = editBuffer;
        break;
      case "projects":
        updated.projects = editBuffer;
        break;
      case "education":
        updated.education = editBuffer;
        break;
    }
    onChange(updated);
    setEditingSection(null);
    setEditBuffer(null);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditBuffer(null);
  };

  const isChanged = (section: string, index?: number, field?: string): boolean => {
    if (!highlightChanges || !originalData) return false;
    switch (section) {
      case "summary":
        return data.summary !== originalData.summary;
      case "skills":
        return JSON.stringify(data.skills) !== JSON.stringify(originalData.skills);
      default:
        return false;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-xl border border-border shadow-sm overflow-hidden">
      {/* ── Name & Contact ── */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 px-6 py-5">
        <h1 className="text-2xl font-bold text-foreground mb-1">{data.name || "Your Name"}</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {data.email && (
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{data.email}</span>
          )}
          {data.phone && (
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{data.phone}</span>
          )}
          {data.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{data.location}</span>
          )}
          {data.linkedin && (
            <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" />{data.linkedin}</span>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* ── Summary ── */}
        <div className="group relative">
          <SectionHeader icon={FileText} title="Professional Summary" />
          {editingSection === "summary" ? (
            <div className="space-y-2">
              <Textarea
                value={editBuffer}
                onChange={(e) => setEditBuffer(e.target.value)}
                rows={4}
                className="bg-muted/30 resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit("summary")} className="gap-1">
                  <Save className="w-3 h-3" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <p className={`text-sm text-foreground/90 leading-relaxed ${isChanged("summary") ? "bg-accent/10 rounded px-2 py-1 border-l-2 border-accent" : ""}`}>
                {data.summary || "No summary provided."}
              </p>
              {editable && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -top-1 right-0 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => startEdit("summary", data.summary)}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Skills ── */}
        <div className="group relative">
          <SectionHeader icon={Code2} title="Skills" />
          {editingSection === "skills" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {editBuffer.map((skill: string, i: number) => (
                  <Badge
                    key={i}
                    className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => setEditBuffer(editBuffer.filter((_: string, idx: number) => idx !== i))}
                  >
                    {skill} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSkill.trim()) {
                      e.preventDefault();
                      setEditBuffer([...editBuffer, newSkill.trim()]);
                      setNewSkill("");
                    }
                  }}
                  placeholder="Add skill..."
                  className="bg-muted/30 flex-1 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (newSkill.trim()) {
                      setEditBuffer([...editBuffer, newSkill.trim()]);
                      setNewSkill("");
                    }
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit("skills")} className="gap-1">
                  <Save className="w-3 h-3" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className={`flex flex-wrap gap-1.5 ${isChanged("skills") ? "bg-accent/10 rounded px-2 py-1.5 border-l-2 border-accent" : ""}`}>
                {data.skills.map((skill, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs bg-primary/10 text-primary border-primary/20"
                  >
                    {skill}
                  </Badge>
                ))}
                {data.skills.length === 0 && (
                  <span className="text-xs text-muted-foreground">No skills listed.</span>
                )}
              </div>
              {editable && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -top-1 right-0 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => startEdit("skills", data.skills)}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Experience ── */}
        <div className="group relative">
          <SectionHeader icon={Briefcase} title="Experience" />
          {editingSection === "experiences" ? (
            <div className="space-y-3">
              {editBuffer.map((exp: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-muted-foreground font-medium">Position #{i + 1}</span>
                    <Button
                      size="icon" variant="ghost"
                      className="w-6 h-6 text-muted-foreground hover:text-destructive"
                      onClick={() => setEditBuffer(editBuffer.filter((_: any, idx: number) => idx !== i))}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={exp.title}
                      onChange={(e) => {
                        const u = [...editBuffer]; u[i] = { ...u[i], title: e.target.value }; setEditBuffer(u);
                      }}
                      placeholder="Title"
                      className="bg-background/50 text-sm"
                    />
                    <Input
                      value={exp.company}
                      onChange={(e) => {
                        const u = [...editBuffer]; u[i] = { ...u[i], company: e.target.value }; setEditBuffer(u);
                      }}
                      placeholder="Company"
                      className="bg-background/50 text-sm"
                    />
                    <Input
                      value={exp.duration}
                      onChange={(e) => {
                        const u = [...editBuffer]; u[i] = { ...u[i], duration: e.target.value }; setEditBuffer(u);
                      }}
                      placeholder="Duration"
                      className="bg-background/50 text-sm"
                    />
                  </div>
                  {exp.bullets.map((b: string, bi: number) => (
                    <div key={bi} className="flex gap-2">
                      <Textarea
                        value={b}
                        onChange={(e) => {
                          const u = [...editBuffer];
                          const bullets = [...u[i].bullets];
                          bullets[bi] = e.target.value;
                          u[i] = { ...u[i], bullets };
                          setEditBuffer(u);
                        }}
                        rows={1}
                        className="bg-background/50 resize-none text-xs flex-1"
                      />
                      <Button
                        size="icon" variant="ghost"
                        className="w-6 h-6 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => {
                          const u = [...editBuffer];
                          u[i] = { ...u[i], bullets: u[i].bullets.filter((_: string, idx: number) => idx !== bi) };
                          setEditBuffer(u);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm" variant="ghost" className="text-xs text-primary"
                    onClick={() => {
                      const u = [...editBuffer];
                      u[i] = { ...u[i], bullets: [...u[i].bullets, ""] };
                      setEditBuffer(u);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Bullet
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit("experiences")} className="gap-1">
                  <Save className="w-3 h-3" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative space-y-4">
              {data.experiences.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{exp.title}</h4>
                    <span className="text-xs text-muted-foreground">{exp.duration}</span>
                  </div>
                  <p className="text-xs text-primary mb-1.5">{exp.company}</p>
                  <ul className="space-y-1 ml-4">
                    {exp.bullets.map((bullet, bi) => (
                      <li key={bi} className="text-xs text-foreground/80 list-disc">{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {data.experiences.length === 0 && (
                <span className="text-xs text-muted-foreground">No experience entries.</span>
              )}
              {editable && (
                <Button
                  size="icon" variant="ghost"
                  className="absolute -top-1 right-0 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => startEdit("experiences", data.experiences)}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Projects ── */}
        <div className="group relative">
          <SectionHeader icon={FolderGit2} title="Projects" />
          {editingSection === "projects" ? (
            <div className="space-y-3">
              {editBuffer.map((proj: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-muted-foreground font-medium">Project #{i + 1}</span>
                    <Button
                      size="icon" variant="ghost"
                      className="w-6 h-6 text-muted-foreground hover:text-destructive"
                      onClick={() => setEditBuffer(editBuffer.filter((_: any, idx: number) => idx !== i))}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <Input
                    value={proj.name}
                    onChange={(e) => {
                      const u = [...editBuffer]; u[i] = { ...u[i], name: e.target.value }; setEditBuffer(u);
                    }}
                    placeholder="Project name"
                    className="bg-background/50 text-sm"
                  />
                  <Textarea
                    value={proj.description}
                    onChange={(e) => {
                      const u = [...editBuffer]; u[i] = { ...u[i], description: e.target.value }; setEditBuffer(u);
                    }}
                    rows={2}
                    className="bg-background/50 resize-none text-xs"
                    placeholder="Description"
                  />
                  <Input
                    value={proj.technologies.join(", ")}
                    onChange={(e) => {
                      const u = [...editBuffer];
                      u[i] = { ...u[i], technologies: e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean) };
                      setEditBuffer(u);
                    }}
                    placeholder="Technologies (comma-separated)"
                    className="bg-background/50 text-xs"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit("projects")} className="gap-1">
                  <Save className="w-3 h-3" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative space-y-3">
              {data.projects.map((proj, i) => (
                <div key={i}>
                  <h4 className="text-sm font-semibold text-foreground mb-0.5">{proj.name}</h4>
                  <p className="text-xs text-foreground/80 mb-1">{proj.description}</p>
                  {proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {proj.technologies.map((tech, ti) => (
                        <Badge key={ti} variant="outline" className="text-[10px] px-1.5 py-0">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {data.projects.length === 0 && (
                <span className="text-xs text-muted-foreground">No projects listed.</span>
              )}
              {editable && (
                <Button
                  size="icon" variant="ghost"
                  className="absolute -top-1 right-0 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => startEdit("projects", data.projects)}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Education ── */}
        <div className="group relative">
          <SectionHeader icon={GraduationCap} title="Education" />
          {editingSection === "education" ? (
            <div className="space-y-2">
              <Textarea
                value={editBuffer}
                onChange={(e) => setEditBuffer(e.target.value)}
                rows={3}
                className="bg-muted/30 resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit("education")} className="gap-1">
                  <Save className="w-3 h-3" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {data.education || "No education listed."}
              </p>
              {editable && (
                <Button
                  size="icon" variant="ghost"
                  className="absolute -top-1 right-0 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => startEdit("education", data.education)}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplatePreview;
