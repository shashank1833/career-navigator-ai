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
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  phone: "+1 (555) 234-5678",
  location: "San Francisco, CA",
  linkedin: "linkedin.com/in/alexjohnson",
  github: "github.com/alexjohnson",
  summary:
    "Full-stack software engineer with 4+ years of experience in backend development, databases, and applied machine learning. Built end-to-end projects involving REST APIs, deep learning models, and data-driven systems with a focus on scalable solutions.",
  education: {
    degree: "Bachelor of Technology in Computer Science",
    school: "Stanford University",
    year: "June 2024",
    gpa: "3.8 / 4.0",
  },
  skills: {
    languages: "C++, Java, Python",
    web: "HTML, CSS, JavaScript, React.js, Tailwind CSS",
    databases: "SQL, PostgreSQL, MongoDB",
    core: "Data Structures, OOP, Machine Learning, System Design",
  },
  experience: [
    {
      title: "Software Engineer Intern",
      company: "Google, Mountain View, CA",
      duration: "May 2023 – Aug 2023",
      bullets: [
        "Developed microservices using Go and gRPC, improving API latency by 35%",
        "Built automated CI/CD pipelines reducing deployment time from 2 hours to 15 minutes",
        "Collaborated with a cross-functional team of 8 engineers on a user-facing product",
      ],
    },
    {
      title: "Backend Developer Intern",
      company: "Stripe, San Francisco, CA",
      duration: "Jan 2023 – Apr 2023",
      bullets: [
        "Designed RESTful APIs handling 10K+ requests/sec with FastAPI and PostgreSQL",
        "Implemented rate limiting and caching layers, reducing server costs by 25%",
      ],
    },
  ],
  projects: [
    {
      name: "Facial Emotion Recognition System",
      tech: "Deep Learning, PyTorch, EfficientNet",
      bullets: [
        "Built CNN-based emotion classifier achieving 78% accuracy on RAF-DB dataset",
        "Implemented data augmentation and focal loss for class imbalance handling",
      ],
    },
    {
      name: "Career Intelligence Platform",
      tech: "React, FastAPI, Gemini API, SQL",
      bullets: [
        "Full-stack platform for AI resume analysis, job matching, and career insights",
        "Interactive dashboard with charts for skill gaps, match scores, and analytics",
      ],
    },
  ],
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
      <div className="aspect-[8.5/11] bg-white relative overflow-hidden">
        <TemplatePreviewWithText template={template} />
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <div className="p-3 bg-card border-t border-border">
        <div className="flex items-center gap-1.5">
          <h4 className="font-semibold text-sm text-foreground">{template.name}</h4>
          {isCurrent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
              Current
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
      </div>
    </motion.div>
  );
};

/* ─── Section heading helper ─── */
const SectionTitle = ({
  label,
  colors,
  layout,
  fonts,
}: {
  label: string;
  colors: ResumeTemplate["colors"];
  layout: ResumeTemplate["layout"];
  fonts: ResumeTemplate["fonts"];
}) => {
  const isCentered = layout.headerStyle === "centered";
  const isBoxed = layout.sectionStyle === "boxed";
  const isUnderline = layout.sectionStyle === "underline";

  return (
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
};

/* ─── Creative two-column layout ─── */
const CreativePreview = ({ template }: { template: ResumeTemplate }) => {
  const { colors, fonts } = template;
  const d = SAMPLE_DATA;

  return (
    <div className="h-full flex" style={{ fontFamily: fonts.body, fontSize: 4.5, lineHeight: 1.3 }}>
      {/* Sidebar */}
      <div className="w-[36%] p-2 text-white" style={{ backgroundColor: colors.primary }}>
        <p className="font-bold" style={{ fontSize: 7 }}>{d.name}</p>
        <p className="opacity-80 mt-0.5" style={{ fontSize: 4 }}>{d.email}</p>
        <p className="opacity-80" style={{ fontSize: 4 }}>{d.phone}</p>
        <p className="opacity-80" style={{ fontSize: 4 }}>{d.location}</p>
        <p className="opacity-80" style={{ fontSize: 4 }}>{d.linkedin}</p>

        <p className="font-bold mt-2 mb-0.5 border-b border-white/30 pb-0.5 uppercase" style={{ fontSize: 5 }}>Skills</p>
        <p style={{ fontSize: 3.5, opacity: 0.9 }}><b>Languages:</b> {d.skills.languages}</p>
        <p style={{ fontSize: 3.5, opacity: 0.9 }}><b>Web:</b> {d.skills.web}</p>
        <p style={{ fontSize: 3.5, opacity: 0.9 }}><b>DB:</b> {d.skills.databases}</p>
        <p style={{ fontSize: 3.5, opacity: 0.9 }}><b>Core:</b> {d.skills.core}</p>

        <p className="font-bold mt-2 mb-0.5 border-b border-white/30 pb-0.5 uppercase" style={{ fontSize: 5 }}>Education</p>
        <p style={{ fontSize: 3.5, opacity: 0.9 }}>{d.education.degree}</p>
        <p style={{ fontSize: 3.5, opacity: 0.85 }}>{d.education.school}</p>
        <p style={{ fontSize: 3.5, opacity: 0.8 }}>{d.education.year} • GPA: {d.education.gpa}</p>
      </div>

      {/* Main */}
      <div className="flex-1 p-2 overflow-hidden">
        <p className="font-bold uppercase mb-0.5" style={{ color: colors.primary, fontSize: 5 }}>Professional Summary</p>
        <p style={{ fontSize: 4, color: "#555" }}>{d.summary}</p>

        <p className="font-bold uppercase mt-1.5 mb-0.5" style={{ color: colors.primary, fontSize: 5 }}>Professional Experience</p>
        {d.experience.map((exp) => (
          <div key={`${exp.company}-${exp.title}`} className="mb-1">
            <p className="font-semibold" style={{ fontSize: 4.5, color: "#333" }}>{exp.title}</p>
            <p style={{ fontSize: 3.5, color: "#777" }}>{exp.company} | {exp.duration}</p>
            {exp.bullets.slice(0, 2).map((b, j) => (
              <p key={j} style={{ fontSize: 3.5, color: "#555" }}>• {b}</p>
            ))}
          </div>
        ))}

        <p className="font-bold uppercase mt-1 mb-0.5" style={{ color: colors.primary, fontSize: 5 }}>Projects</p>
        {d.projects.slice(0, 1).map((p) => (
          <div key={p.name}>
            <p className="font-semibold" style={{ fontSize: 4.5, color: "#333" }}>{p.name}</p>
            <p style={{ fontSize: 3.5, color: "#888" }}>{p.tech}</p>
            {p.bullets.slice(0, 1).map((b, j) => (
              <p key={j} style={{ fontSize: 3.5, color: "#555" }}>• {b}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Single-column layouts ─── */
const SingleColumnPreview = ({ template }: { template: ResumeTemplate }) => {
  const { colors, layout, fonts } = template;
  const d = SAMPLE_DATA;
  const isCentered = layout.headerStyle === "centered";
  const isUnderline = layout.sectionStyle === "underline";
  const bulletChar = template.id === "minimal" ? "–" : "•";
  const sectionProps = { colors, layout, fonts };

  return (
    <div className="h-full p-2.5 overflow-hidden" style={{ fontFamily: fonts.body, fontSize: 4.5, lineHeight: 1.3, color: colors.text }}>
      {/* Header */}
      <div
        className={cn("pb-1 mb-1", isCentered && "text-center")}
        style={{ borderBottom: isUnderline ? `1.5px solid ${colors.primary}` : `1px solid ${colors.border}` }}
      >
        <p className="font-bold" style={{ fontSize: isCentered ? 8 : 9, color: colors.primary, fontFamily: fonts.heading }}>
          {isCentered ? d.name.toUpperCase() : d.name}
        </p>
        <p style={{ fontSize: 3.5, color: "#888" }}>
          {d.email} | {d.phone} | {d.location}
        </p>
        <p style={{ fontSize: 3.5, color: "#888" }}>
          {d.linkedin} | {d.github}
        </p>
      </div>

      {/* Professional Summary */}
      <div className="mb-1">
        <SectionTitle label="Professional Summary" {...sectionProps} />
        <p style={{ fontSize: 4, color: "#555", textAlign: isCentered ? "justify" : undefined }}>{d.summary}</p>
      </div>

      {/* Education */}
      <div className="mb-1">
        <SectionTitle label="Education" {...sectionProps} />
        <div className="flex justify-between">
          <p className="font-semibold" style={{ fontSize: 4.5, color: "#333" }}>{d.education.degree}</p>
          <p style={{ fontSize: 3.5, color: "#888" }}>{d.education.year}</p>
        </div>
        <p style={{ fontSize: 4, color: "#555" }}>{d.education.school} — GPA: {d.education.gpa}</p>
      </div>

      {/* Technical Skills */}
      <div className="mb-1">
        <SectionTitle label="Technical Skills" {...sectionProps} />
        <p style={{ fontSize: 4, color: "#555" }}>
          <b>Languages:</b> {d.skills.languages} &nbsp;
          <b>Web:</b> {d.skills.web}
        </p>
        <p style={{ fontSize: 4, color: "#555" }}>
          <b>Databases:</b> {d.skills.databases} &nbsp;
          <b>Core:</b> {d.skills.core}
        </p>
      </div>

      {/* Professional Experience */}
      <div className="mb-1">
        <SectionTitle label="Professional Experience" {...sectionProps} />
        {d.experience.map((exp) => (
          <div key={`${exp.company}-${exp.title}`} className="mb-0.5">
            <div className="flex justify-between">
              <p className="font-semibold" style={{ fontSize: 4.5, color: "#333" }}>{exp.title}</p>
              <p style={{ fontSize: 3.5, color: "#888" }}>{exp.duration}</p>
            </div>
            <p style={{ fontSize: 3.5, color: "#777", fontStyle: "italic" }}>{exp.company}</p>
            {exp.bullets.slice(0, 2).map((b, j) => (
              <p key={j} style={{ fontSize: 3.5, color: "#555" }}>{bulletChar} {b}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Projects */}
      <div>
        <SectionTitle label="Academic Projects" {...sectionProps} />
        {d.projects.map((p) => (
          <div key={p.name} className="mb-0.5">
            <p className="font-semibold" style={{ fontSize: 4.5, color: "#333" }}>{p.name} <span style={{ fontSize: 3.5, color: "#888", fontWeight: "normal" }}>— {p.tech}</span></p>
            {p.bullets.slice(0, 1).map((b, j) => (
              <p key={j} style={{ fontSize: 3.5, color: "#555" }}>{bulletChar} {b}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const TemplatePreviewWithText = ({ template }: { template: ResumeTemplate }) => {
  if (template.layout.columns === 2) {
    return <CreativePreview template={template} />;
  }
  return <SingleColumnPreview template={template} />;
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
