import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESUME_TEMPLATES, type TemplateStyle, type ResumeTemplate } from "@/lib/resume-templates";

interface TemplateSelectorProps {
  selected: TemplateStyle;
  onSelect: (template: TemplateStyle) => void;
  currentTemplate?: TemplateStyle;
}

const SAMPLE_DATA = {
  name: "Jane Doe",
  title: "Software Engineer",
  email: "jane@email.com",
  phone: "+1 555 0100",
  location: "San Francisco, CA",
  summary: "Experienced full-stack engineer with 5+ years building scalable web applications.",
  skills: ["React", "TypeScript", "Node.js", "AWS", "Python", "SQL"],
  experience: {
    title: "Senior Engineer",
    company: "Acme Corp",
    duration: "2021 – Present",
    bullets: [
      "Led migration to microservices, reducing latency by 40%",
      "Mentored 3 junior developers across 2 product teams",
    ],
  },
  education: "BS Computer Science, Stanford University",
};

const TemplatePreviewCard = ({
  template,
  isSelected,
  isCurrent,
  onClick,
}: {
  template: ResumeTemplate;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden",
        isSelected
          ? "border-primary shadow-lg shadow-primary/20"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Template Preview with actual text */}
      <div className="aspect-[8.5/11] bg-white relative overflow-hidden">
        <TemplatePreviewWithText template={template} />

        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Template info */}
      <div className="p-3 bg-card border-t border-border">
        <div className="flex items-center gap-1.5">
          <h4 className="font-semibold text-sm text-foreground">{template.name}</h4>
          {isCurrent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
              Current
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
          {template.description}
        </p>
      </div>
    </motion.div>
  );
};

// Text-based preview that reflects template formatting
const TemplatePreviewWithText = ({ template }: { template: ResumeTemplate }) => {
  const { colors, layout, fonts } = template;
  const d = SAMPLE_DATA;

  if (layout.columns === 2) {
    // Creative two-column
    return (
      <div className="h-full flex" style={{ fontFamily: fonts.body, fontSize: 5, lineHeight: 1.3 }}>
        {/* Sidebar */}
        <div className="w-[36%] p-2 text-white" style={{ backgroundColor: colors.primary }}>
          <p className="font-bold" style={{ fontSize: 7 }}>{d.name}</p>
          <p className="opacity-80 mt-0.5" style={{ fontSize: 4.5 }}>{d.email}</p>
          <p className="opacity-80" style={{ fontSize: 4.5 }}>{d.location}</p>

          <p className="font-bold mt-2 mb-0.5 border-b border-white/30 pb-0.5 uppercase" style={{ fontSize: 5 }}>Skills</p>
          {d.skills.map((s, i) => (
            <p key={i} style={{ fontSize: 4.5 }}>{s}</p>
          ))}

          <p className="font-bold mt-2 mb-0.5 border-b border-white/30 pb-0.5 uppercase" style={{ fontSize: 5 }}>Education</p>
          <p style={{ fontSize: 4, opacity: 0.9 }}>{d.education}</p>
        </div>

        {/* Main */}
        <div className="flex-1 p-2">
          <p className="font-bold uppercase mb-0.5" style={{ color: colors.primary, fontSize: 5 }}>About Me</p>
          <p style={{ fontSize: 4.5, color: "#555" }}>{d.summary}</p>

          <p className="font-bold uppercase mt-2 mb-0.5" style={{ color: colors.primary, fontSize: 5 }}>Experience</p>
          <p className="font-semibold" style={{ fontSize: 5, color: "#333" }}>{d.experience.title}</p>
          <p style={{ fontSize: 4, color: "#777" }}>{d.experience.company} • {d.experience.duration}</p>
          {d.experience.bullets.map((b, i) => (
            <p key={i} style={{ fontSize: 4, color: "#555" }}>• {b}</p>
          ))}
        </div>
      </div>
    );
  }

  // Single-column layouts
  const isCentered = layout.headerStyle === "centered";
  const isBoxed = layout.sectionStyle === "boxed";
  const isUnderline = layout.sectionStyle === "underline";

  return (
    <div className="h-full p-2.5" style={{ fontFamily: fonts.body, fontSize: 5, lineHeight: 1.35, color: colors.text }}>
      {/* Header */}
      <div
        className={cn("pb-1 mb-1.5", isCentered && "text-center")}
        style={{
          borderBottom: isUnderline ? `1.5px solid ${colors.primary}` : `1px solid ${colors.border}`,
        }}
      >
        <p className="font-bold" style={{ fontSize: isCentered ? 8 : 9, color: colors.primary, fontFamily: fonts.heading }}>
          {isCentered ? d.name.toUpperCase() : d.name}
        </p>
        <p style={{ fontSize: 4, color: "#888" }}>
          {d.email} | {d.phone} | {d.location}
        </p>
      </div>

      {/* Summary */}
      {layout.sectionStyle === "simple" && isCentered ? (
        <div className="mb-1.5">
          <p className="font-bold uppercase text-center mb-0.5" style={{ fontSize: 5, color: colors.primary }}>
            Professional Summary
          </p>
          <p style={{ fontSize: 4.5, color: "#555", textAlign: "justify" }}>{d.summary}</p>
        </div>
      ) : (
        <div className="mb-1.5">
          <p style={{ fontSize: 4.5, color: "#555" }}>{d.summary}</p>
        </div>
      )}

      {/* Section heading helper */}
      {(() => {
        const SectionHead = ({ label }: { label: string }) => (
          <p
            className={cn("font-bold uppercase mb-0.5", isCentered && "text-center")}
            style={{
              fontSize: 5,
              color: colors.primary,
              fontFamily: fonts.heading,
              ...(isBoxed ? { backgroundColor: colors.primary + "20", padding: "1px 3px", borderRadius: 1 } : {}),
              ...(isUnderline ? { borderBottom: `0.5px solid ${colors.border}`, paddingBottom: 1 } : {}),
            }}
          >
            {label}
          </p>
        );

        return (
          <>
            {/* Skills */}
            <div className="mb-1.5">
              <SectionHead label={template.id === "professional" ? "Core Competencies" : "Skills"} />
              <p style={{ fontSize: 4.5, color: "#555" }}>
                {d.skills.join(template.id === "professional" ? " • " : ", ")}
              </p>
            </div>

            {/* Experience */}
            <div className="mb-1.5">
              <SectionHead label={template.id === "professional" ? "Professional Experience" : "Experience"} />
              <div className="flex justify-between">
                <p className="font-semibold" style={{ fontSize: 5, color: "#333" }}>{d.experience.title}</p>
                <p style={{ fontSize: 4, color: "#888" }}>{d.experience.duration}</p>
              </div>
              <p style={{ fontSize: 4, color: "#777", fontStyle: "italic" }}>{d.experience.company}</p>
              {d.experience.bullets.map((b, i) => (
                <p key={i} style={{ fontSize: 4, color: "#555" }}>
                  {template.id === "minimal" ? "– " : "• "}{b}
                </p>
              ))}
            </div>

            {/* Education */}
            <div>
              <SectionHead label="Education" />
              <p style={{ fontSize: 4.5, color: "#555" }}>{d.education}</p>
            </div>
          </>
        );
      })()}
    </div>
  );
};

const TemplateSelector = ({ selected, onSelect, currentTemplate }: TemplateSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {RESUME_TEMPLATES.map((template) => (
        <TemplatePreviewCard
          key={template.id}
          template={template}
          isSelected={selected === template.id}
          isCurrent={currentTemplate === template.id}
          onClick={() => onSelect(template.id)}
        />
      ))}
    </div>
  );
};

export default TemplateSelector;
