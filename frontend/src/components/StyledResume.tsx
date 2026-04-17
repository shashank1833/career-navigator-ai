import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { getTemplate, type TemplateStyle } from "@/lib/resume-templates";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  summary: string;
  skills: string[];
  experiences: Array<{
    title: string;
    company: string;
    duration: string;
    location?: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  education: string;
  certifications?: string[];
  publications?: string[];
}

interface StyledResumeProps {
  data: ResumeData;
  templateId: TemplateStyle;
  className?: string;
}

// Modern Template - Clean with blue accents
const ModernTemplate = forwardRef<HTMLDivElement, { data: ResumeData }>(({ data }, ref) => {
  const template = getTemplate("modern");
  const { colors } = template;

  return (
    <div 
      ref={ref}
      className="bg-white p-8 font-sans text-sm"
      style={{ fontFamily: template.fonts.body, color: colors.text }}
    >
      {/* Header */}
      <div className="border-b-2 pb-4 mb-6" style={{ borderColor: colors.primary }}>
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>
          {data.name}
        </h1>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          {data.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> {data.email}
            </span>
          )}
          {data.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {data.phone}
            </span>
          )}
          {data.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {data.location}
            </span>
          )}
          {data.linkedin && (
            <span className="flex items-center gap-1">
              <Linkedin className="w-3 h-3" /> {data.linkedin}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1" style={{ color: colors.primary, borderColor: colors.border }}>
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 border-b pb-1" style={{ color: colors.primary, borderColor: colors.border }}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span 
                key={skill} 
                className="px-2 py-1 rounded text-xs"
                style={{ backgroundColor: colors.primary + "15", color: colors.primary }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experiences.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-1" style={{ color: colors.primary, borderColor: colors.border }}>
            Experience
          </h2>
          <div className="space-y-4">
            {data.experiences.map((exp) => (
              <div key={`${exp.company}-${exp.title}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{exp.title}</h3>
                    <p className="text-gray-600">{exp.company}</p>
                  </div>
                  <span className="text-xs text-gray-500">{exp.duration}</span>
                </div>
                <ul className="mt-2 space-y-1 text-gray-700">
                  {exp.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 25)} className="flex items-start gap-2">
                      <span style={{ color: colors.primary }}>•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-1" style={{ color: colors.primary, borderColor: colors.border }}>
            Projects
          </h2>
          <div className="space-y-3">
            {data.projects.map((project) => (
              <div key={project.name}>
                <h3 className="font-semibold text-gray-800">{project.name}</h3>
                <p className="text-gray-600 text-sm">{project.description}</p>
                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.technologies.map((tech) => (
                      <span key={tech} className="text-xs text-gray-500">
                        {tech}{j < project.technologies.length - 1 ? " •" : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education && (
        <div>
          <h2 className="text-lg font-semibold mb-2 border-b pb-1" style={{ color: colors.primary, borderColor: colors.border }}>
            Education
          </h2>
          <p className="text-gray-700">{data.education}</p>
        </div>
      )}
    </div>
  );
});
ModernTemplate.displayName = "ModernTemplate";

// Professional Template - Traditional corporate style
const ProfessionalTemplate = forwardRef<HTMLDivElement, { data: ResumeData }>(({ data }, ref) => {
  const template = getTemplate("professional");
  const { colors } = template;

  return (
    <div 
      ref={ref}
      className="bg-white p-8 text-sm"
      style={{ fontFamily: template.fonts.body, color: colors.text }}
    >
      {/* Header - Centered */}
      <div className="text-center border-b-2 pb-4 mb-6" style={{ borderColor: colors.primary }}>
        <h1 
          className="text-2xl font-bold tracking-wide mb-2" 
          style={{ fontFamily: template.fonts.heading, color: colors.primary }}
        >
          {data.name.toUpperCase()}
        </h1>
        <div className="flex justify-center flex-wrap gap-3 text-xs text-gray-600">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>| {data.phone}</span>}
          {data.location && <span>| {data.location}</span>}
          {data.linkedin && <span>| {data.linkedin}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-5">
          <h2 
            className="text-sm font-bold uppercase tracking-wider mb-2 text-center"
            style={{ color: colors.primary }}
          >
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experiences.length > 0 && (
        <div className="mb-5">
          <h2 
            className="text-sm font-bold uppercase tracking-wider mb-3 text-center border-b pb-1"
            style={{ color: colors.primary, borderColor: colors.border }}
          >
            Professional Experience
          </h2>
          <div className="space-y-4">
            {data.experiences.map((exp) => (
              <div key={`${exp.company}-${exp.title}`}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-800">{exp.title}</h3>
                  <span className="text-xs text-gray-500 italic">{exp.duration}</span>
                </div>
                <p className="text-gray-600 italic">{exp.company}{exp.location && `, ${exp.location}`}</p>
                <ul className="mt-2 space-y-1 text-gray-700 ml-4">
                  {exp.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 25)} className="list-disc">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-5">
          <h2 
            className="text-sm font-bold uppercase tracking-wider mb-2 text-center border-b pb-1"
            style={{ color: colors.primary, borderColor: colors.border }}
          >
            Core Competencies
          </h2>
          <p className="text-gray-700 text-center">{data.skills.join(" • ")}</p>
        </div>
      )}

      {/* Education */}
      {data.education && (
        <div className="mb-5">
          <h2 
            className="text-sm font-bold uppercase tracking-wider mb-2 text-center border-b pb-1"
            style={{ color: colors.primary, borderColor: colors.border }}
          >
            Education
          </h2>
          <p className="text-gray-700 text-center">{data.education}</p>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div>
          <h2 
            className="text-sm font-bold uppercase tracking-wider mb-3 text-center border-b pb-1"
            style={{ color: colors.primary, borderColor: colors.border }}
          >
            Key Projects
          </h2>
          <div className="space-y-2">
            {data.projects.map((project) => (
              <div key={project.name}>
                <span className="font-semibold">{project.name}:</span>{" "}
                <span className="text-gray-600">{project.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
ProfessionalTemplate.displayName = "ProfessionalTemplate";

// Minimal Template - Ultra clean
const MinimalTemplate = forwardRef<HTMLDivElement, { data: ResumeData }>(({ data }, ref) => {
  const template = getTemplate("minimal");
  const { colors } = template;
  // Memoised to avoid recomputing the contact string on every parent render
  const contactLine = React.useMemo(
    () => [data.email, data.phone, data.location, data.linkedin].filter(Boolean).join(" | "),
    [data.email, data.phone, data.location, data.linkedin]
  );

  return (
    <div 
      ref={ref}
      className="bg-white p-8 text-sm"
      style={{ fontFamily: template.fonts.body, color: colors.text }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-normal mb-1">{data.name}</h1>
        <div className="text-xs text-gray-600">
          {contactLine}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Education */}
      {data.education && (
        <div className="mb-4">
          <h2 className="font-bold text-sm border-b border-black pb-0.5 mb-2">EDUCATION</h2>
          <p className="text-gray-800">{data.education}</p>
        </div>
      )}

      {/* Experience */}
      {data.experiences.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold text-sm border-b border-black pb-0.5 mb-2">EXPERIENCE</h2>
          <div className="space-y-3">
            {data.experiences.map((exp) => (
              <div key={`${exp.company}-${exp.title}`}>
                <div className="flex justify-between">
                  <span className="font-semibold">{exp.title}</span>
                  <span className="text-gray-600">{exp.duration}</span>
                </div>
                <p className="text-gray-600 italic">{exp.company}</p>
                <ul className="mt-1 space-y-0.5 text-gray-700">
                  {exp.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 25)} className="flex items-start gap-2">
                      <span>–</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold text-sm border-b border-black pb-0.5 mb-2">SKILLS</h2>
          <p className="text-gray-700">{data.skills.join(", ")}</p>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div>
          <h2 className="font-bold text-sm border-b border-black pb-0.5 mb-2">PROJECTS</h2>
          <div className="space-y-2">
            {data.projects.map((project) => (
              <div key={project.name}>
                <span className="font-semibold">{project.name}</span>
                <span className="text-gray-600"> – {project.description}</span>
                {project.technologies.length > 0 && (
                  <span className="text-gray-500 text-xs"> ({project.technologies.join(", ")})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
MinimalTemplate.displayName = "MinimalTemplate";

// Creative Template - Two column with sidebar
const CreativeTemplate = forwardRef<HTMLDivElement, { data: ResumeData }>(({ data }, ref) => {
  const template = getTemplate("creative");
  const { colors } = template;

  return (
    <div 
      ref={ref}
      className="bg-white text-sm flex"
      style={{ fontFamily: template.fonts.body, color: colors.text }}
    >
      {/* Sidebar */}
      <div 
        className="w-1/3 p-6 text-white"
        style={{ backgroundColor: colors.primary }}
      >
        <h1 className="text-xl font-bold mb-1">{data.name}</h1>
        
        {/* Contact */}
        <div className="mt-4 space-y-2 text-xs opacity-90">
          {data.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              <span className="break-all">{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              <span>{data.phone}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span>{data.location}</span>
            </div>
          )}
          {data.linkedin && (
            <div className="flex items-center gap-2">
              <Linkedin className="w-3 h-3" />
              <span className="break-all">{data.linkedin}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mt-6">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-3 border-b border-white/30 pb-1">
              Skills
            </h2>
            <div className="space-y-2">
              {data.skills.map((skill) => (
                <div key={skill} className="text-xs">
                  <span>{skill}</span>
                  <div className="h-1 bg-white/30 rounded mt-1">
                    <div 
                      className="h-full bg-white rounded"
                      style={{ width: `${70 + Math.random() * 30}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education && (
          <div className="mt-6">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-2 border-b border-white/30 pb-1">
              Education
            </h2>
            <p className="text-xs opacity-90">{data.education}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Summary */}
        {data.summary && (
          <div className="mb-5">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
              About Me
            </h2>
            <p className="text-gray-700 leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.experiences.length > 0 && (
          <div className="mb-5">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
              Experience
            </h2>
            <div className="space-y-4">
              {data.experiences.map((exp) => (
                <div key={`${exp.company}-${exp.title}`} className="relative pl-4 border-l-2" style={{ borderColor: colors.accent }}>
                  <div 
                    className="absolute -left-[5px] top-0 w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <h3 className="font-semibold text-gray-800">{exp.title}</h3>
                  <p className="text-gray-600 text-xs">{exp.company} • {exp.duration}</p>
                  <ul className="mt-1 space-y-0.5 text-gray-700 text-xs">
                    {exp.bullets.map((bullet) => (
                      <li key={bullet.slice(0, 25)}>• {bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
              Projects
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {data.projects.map((project) => (
                <div 
                  key={project.name} 
                  className="p-3 rounded-lg border"
                  style={{ borderColor: colors.border }}
                >
                  <h3 className="font-semibold text-xs" style={{ color: colors.primary }}>{project.name}</h3>
                  <p className="text-gray-600 text-xs mt-1">{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
CreativeTemplate.displayName = "CreativeTemplate";

// Academic Template - Detailed CV format
const AcademicTemplate = forwardRef<HTMLDivElement, { data: ResumeData }>(({ data }, ref) => {
  const template = getTemplate("academic");
  const { colors } = template;

  return (
    <div 
      ref={ref}
      className="bg-white p-8 text-sm"
      style={{ fontFamily: template.fonts.body, color: colors.text }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>{data.name}</h1>
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-2">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>• {data.phone}</span>}
          {data.location && <span>• {data.location}</span>}
          {data.website && (
            <span className="flex items-center gap-1">
              • <Globe className="w-3 h-3" /> {data.website}
            </span>
          )}
        </div>
      </div>

      {/* Education - First for academic */}
      {data.education && (
        <div className="mb-5">
          <h2 
            className="font-bold text-sm uppercase tracking-wider mb-2 px-2 py-1"
            style={{ backgroundColor: colors.primary + "15", color: colors.primary }}
          >
            Education
          </h2>
          <p className="text-gray-800 ml-2">{data.education}</p>
        </div>
      )}

      {/* Research/Summary */}
      {data.summary && (
        <div className="mb-5">
          <h2 
            className="font-bold text-sm uppercase tracking-wider mb-2 px-2 py-1"
            style={{ backgroundColor: colors.primary + "15", color: colors.primary }}
          >
            Research Interests
          </h2>
          <p className="text-gray-700 ml-2 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experiences.length > 0 && (
        <div className="mb-5">
          <h2 
            className="font-bold text-sm uppercase tracking-wider mb-2 px-2 py-1"
            style={{ backgroundColor: colors.primary + "15", color: colors.primary }}
          >
            Professional Experience
          </h2>
          <div className="space-y-3 ml-2">
            {data.experiences.map((exp) => (
              <div key={`${exp.company}-${exp.title}`}>
                <div className="flex justify-between">
                  <span className="font-semibold">{exp.title}</span>
                  <span className="text-gray-500 text-xs">{exp.duration}</span>
                </div>
                <p className="text-gray-600 italic">{exp.company}</p>
                <ul className="mt-1 space-y-0.5 text-gray-700 text-xs">
                  {exp.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 25)} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publications */}
      {data.publications && data.publications.length > 0 && (
        <div className="mb-5">
          <h2 
            className="font-bold text-sm uppercase tracking-wider mb-2 px-2 py-1"
            style={{ backgroundColor: colors.primary + "15", color: colors.primary }}
          >
            Publications
          </h2>
          <ul className="ml-2 space-y-1 text-xs">
            {data.publications.map((pub, i) => (
              <li key={pub.slice(0, 30)}>[{i + 1}] {pub}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-5">
          <h2 
            className="font-bold text-sm uppercase tracking-wider mb-2 px-2 py-1"
            style={{ backgroundColor: colors.primary + "15", color: colors.primary }}
          >
            Technical Skills
          </h2>
          <p className="text-gray-700 ml-2">{data.skills.join(" • ")}</p>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div>
          <h2 
            className="font-bold text-sm uppercase tracking-wider mb-2 px-2 py-1"
            style={{ backgroundColor: colors.primary + "15", color: colors.primary }}
          >
            Research Projects
          </h2>
          <div className="space-y-2 ml-2">
            {data.projects.map((project) => (
              <div key={project.name}>
                <span className="font-semibold">{project.name}</span>
                <span className="text-gray-600"> – {project.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
AcademicTemplate.displayName = "AcademicTemplate";

// Main component that renders the appropriate template
const StyledResume = forwardRef<HTMLDivElement, StyledResumeProps>(
  ({ data, templateId, className }, ref) => {
    const templates: Record<TemplateStyle, React.ForwardRefExoticComponent<{ data: ResumeData } & React.RefAttributes<HTMLDivElement>>> = {
      modern: ModernTemplate,
      professional: ProfessionalTemplate,
      minimal: MinimalTemplate,
      creative: CreativeTemplate,
      academic: AcademicTemplate,
    };

    const TemplateComponent = templates[templateId] || ModernTemplate;

    return (
      <div className={cn("shadow-lg", className)}>
        <TemplateComponent ref={ref} data={data} />
      </div>
    );
  }
);
StyledResume.displayName = "StyledResume";

export default StyledResume;
