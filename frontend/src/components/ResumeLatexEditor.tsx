import { useState, useCallback, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Eye, Columns, Copy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { ResumeData } from "@/components/StyledResume";

interface ResumeLatexEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  className?: string;
}

// Convert ResumeData to LaTeX-like markup
function resumeToLatex(data: ResumeData): string {
  let lines: string[] = [];

  lines.push(`%% ═══════════════════════════════════════`);
  lines.push(`%% Resume Source — Edit sections below`);
  lines.push(`%% ═══════════════════════════════════════`);
  lines.push(``);

  lines.push(`\\begin{header}`);
  lines.push(`  \\name{${data.name}}`);
  if (data.email) lines.push(`  \\email{${data.email}}`);
  if (data.phone) lines.push(`  \\phone{${data.phone}}`);
  if (data.location) lines.push(`  \\location{${data.location}}`);
  if (data.linkedin) lines.push(`  \\linkedin{${data.linkedin}}`);
  if (data.website) lines.push(`  \\website{${data.website}}`);
  lines.push(`\\end{header}`);
  lines.push(``);

  if (data.summary) {
    lines.push(`\\begin{summary}`);
    lines.push(`  ${data.summary}`);
    lines.push(`\\end{summary}`);
    lines.push(``);
  }

  if (data.education) {
    lines.push(`\\begin{education}`);
    lines.push(`  ${data.education}`);
    lines.push(`\\end{education}`);
    lines.push(``);
  }

  if (data.skills.length > 0) {
    lines.push(`\\begin{skills}`);
    data.skills.forEach((s) => lines.push(`  \\skill{${s}}`));
    lines.push(`\\end{skills}`);
    lines.push(``);
  }

  if (data.experiences.length > 0) {
    lines.push(`\\begin{experience}`);
    data.experiences.forEach((exp, i) => {
      if (i > 0) lines.push(``);
      lines.push(`  \\entry{${exp.title}}{${exp.company}}{${exp.duration}}`);
      exp.bullets.forEach((b) => lines.push(`    \\item ${b}`));
    });
    lines.push(`\\end{experience}`);
    lines.push(``);
  }

  if (data.projects.length > 0) {
    lines.push(`\\begin{projects}`);
    data.projects.forEach((p, i) => {
      if (i > 0) lines.push(``);
      lines.push(`  \\project{${p.name}}{${p.technologies.join(", ")}}`);
      lines.push(`    \\description{${p.description}}`);
    });
    lines.push(`\\end{projects}`);
    lines.push(``);
  }

  if (data.certifications && data.certifications.length > 0) {
    lines.push(`\\begin{certifications}`);
    data.certifications.forEach((c) => lines.push(`  \\item ${c}`));
    lines.push(`\\end{certifications}`);
    lines.push(``);
  }

  return lines.join("\n");
}

// Parse LaTeX-like markup back to ResumeData
function latexToResume(latex: string): ResumeData {
  const data: ResumeData = {
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: [],
    experiences: [],
    projects: [],
    education: "",
  };

  const extract = (text: string, cmd: string): string => {
    const regex = new RegExp(`\\\\${cmd}\\{([^}]*)\\}`, "g");
    const match = regex.exec(text);
    return match ? match[1] : "";
  };

  const getBlock = (text: string, name: string): string => {
    const regex = new RegExp(`\\\\begin\\{${name}\\}([\\s\\S]*?)\\\\end\\{${name}\\}`, "g");
    const match = regex.exec(text);
    return match ? match[1] : "";
  };

  // Header
  const header = getBlock(latex, "header");
  data.name = extract(header, "name");
  data.email = extract(header, "email");
  data.phone = extract(header, "phone");
  data.location = extract(header, "location");
  data.linkedin = extract(header, "linkedin");
  data.website = extract(header, "website");

  // Summary
  const summaryBlock = getBlock(latex, "summary");
  data.summary = summaryBlock.trim();

  // Education
  const eduBlock = getBlock(latex, "education");
  data.education = eduBlock.trim();

  // Skills
  const skillsBlock = getBlock(latex, "skills");
  const skillMatches = skillsBlock.matchAll(/\\skill\{([^}]*)\}/g);
  data.skills = Array.from(skillMatches, (m) => m[1]);

  // Experience
  const expBlock = getBlock(latex, "experience");
  if (expBlock) {
    const entries = expBlock.split(/(?=\s*\\entry\{)/);
    for (const entry of entries) {
      const entryMatch = entry.match(/\\entry\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/);
      if (entryMatch) {
        const bullets: string[] = [];
        const itemMatches = entry.matchAll(/\\item\s+(.+)/g);
        for (const im of itemMatches) {
          bullets.push(im[1].trim());
        }
        data.experiences.push({
          title: entryMatch[1],
          company: entryMatch[2],
          duration: entryMatch[3],
          bullets,
        });
      }
    }
  }

  // Projects
  const projBlock = getBlock(latex, "projects");
  if (projBlock) {
    const projEntries = projBlock.split(/(?=\s*\\project\{)/);
    for (const pe of projEntries) {
      const projMatch = pe.match(/\\project\{([^}]*)\}\{([^}]*)\}/);
      if (projMatch) {
        const desc = extract(pe, "description");
        data.projects.push({
          name: projMatch[1],
          description: desc,
          technologies: projMatch[2].split(",").map((t) => t.trim()).filter(Boolean),
        });
      }
    }
  }

  // Certifications
  const certBlock = getBlock(latex, "certifications");
  if (certBlock) {
    const certItems = certBlock.matchAll(/\\item\s+(.+)/g);
    data.certifications = Array.from(certItems, (m) => m[1].trim());
  }

  return data;
}

// Syntax highlighting for the editor line numbers
function getLineNumbers(text: string): number {
  return text.split("\n").length;
}

const ResumeLatexEditor = ({ data, onChange, className }: ResumeLatexEditorProps) => {
  const { toast } = useToast();
  const initialLatex = useMemo(() => resumeToLatex(data), []);
  const [latex, setLatex] = useState(initialLatex);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleLatexChange = useCallback(
    (value: string) => {
      setLatex(value);
      try {
        const parsed = latexToResume(value);
        if (!parsed.name.trim()) {
          setParseError("Missing \\name{} in header");
          return;
        }
        setParseError(null);
        onChange(parsed);
      } catch {
        setParseError("Syntax error — check your markup");
      }
    },
    [onChange]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(latex);
    toast({ title: "Copied", description: "LaTeX source copied to clipboard" });
  };

  const handleReset = () => {
    const reset = resumeToLatex(data);
    setLatex(reset);
    setParseError(null);
    toast({ title: "Reset", description: "Editor restored to current resume" });
  };

  const lineCount = getLineNumbers(latex);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border rounded-t-lg">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Resume Source Editor</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
            {lineCount} lines
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {parseError && (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
              {parseError}
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleCopy} title="Copy">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleReset} title="Reset">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 flex">
          {/* Line numbers */}
          <div className="w-10 bg-muted/30 border-r border-border overflow-hidden flex-shrink-0 pt-2 select-none">
            {Array.from({ length: lineCount }, (_, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground text-right pr-2 leading-[1.45]"
                style={{ height: "1.45em" }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code area */}
          <textarea
            value={latex}
            onChange={(e) => handleLatexChange(e.target.value)}
            spellCheck={false}
            className={cn(
              "flex-1 resize-none p-2 bg-background text-foreground font-mono text-xs leading-[1.45]",
              "focus:outline-none border-none",
              "overflow-auto"
            )}
            style={{ tabSize: 2 }}
          />
        </div>
      </div>

      {/* Syntax help */}
      <div className="px-3 py-1.5 bg-muted/30 border-t border-border rounded-b-lg">
        <p className="text-[9px] text-muted-foreground">
          <span className="font-semibold text-primary">Syntax:</span>{" "}
          <code className="bg-muted px-1 rounded text-foreground">\begin&#123;section&#125;</code>{" "}
          <code className="bg-muted px-1 rounded text-foreground">\entry&#123;title&#125;&#123;company&#125;&#123;duration&#125;</code>{" "}
          <code className="bg-muted px-1 rounded text-foreground">\item bullet point</code>{" "}
          <code className="bg-muted px-1 rounded text-foreground">\skill&#123;name&#125;</code>
        </p>
      </div>
    </div>
  );
};

export { resumeToLatex, latexToResume };
export default ResumeLatexEditor;
