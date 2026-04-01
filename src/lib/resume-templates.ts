// Resume Templates inspired by popular Overleaf designs
export type TemplateStyle = "modern" | "professional" | "minimal" | "creative" | "academic";

export interface ResumeTemplate {
  id: TemplateStyle;
  name: string;
  description: string;
  preview: string; // CSS class or identifier
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: {
    columns: 1 | 2;
    headerStyle: "centered" | "left" | "split";
    sectionStyle: "underline" | "boxed" | "simple" | "sidebar";
  };
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean, contemporary design with bold headers and subtle accents. Perfect for tech and creative roles.",
    preview: "modern",
    colors: {
      primary: "#2563eb", // Blue
      secondary: "#1e40af",
      accent: "#3b82f6",
      text: "#1f2937",
      background: "#ffffff",
      border: "#e5e7eb",
    },
    fonts: {
      heading: "Inter, sans-serif",
      body: "Inter, sans-serif",
    },
    layout: {
      columns: 1,
      headerStyle: "left",
      sectionStyle: "underline",
    },
  },
  {
    id: "professional",
    name: "Professional",
    description: "Traditional corporate style with clean lines. Ideal for finance, consulting, and executive positions.",
    preview: "professional",
    colors: {
      primary: "#1e3a5f", // Navy
      secondary: "#2d4a6f",
      accent: "#4a6fa5",
      text: "#2d3748",
      background: "#ffffff",
      border: "#cbd5e0",
    },
    fonts: {
      heading: "Georgia, serif",
      body: "Arial, sans-serif",
    },
    layout: {
      columns: 1,
      headerStyle: "centered",
      sectionStyle: "simple",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean design focusing on content. Great for academic and research applications.",
    preview: "minimal",
    colors: {
      primary: "#000000",
      secondary: "#333333",
      accent: "#666666",
      text: "#1a1a1a",
      background: "#ffffff",
      border: "#e0e0e0",
    },
    fonts: {
      heading: "Times New Roman, serif",
      body: "Times New Roman, serif",
    },
    layout: {
      columns: 1,
      headerStyle: "centered",
      sectionStyle: "simple",
    },
  },
  {
    id: "creative",
    name: "Creative",
    description: "Two-column layout with sidebar for skills. Perfect for designers and marketing professionals.",
    preview: "creative",
    colors: {
      primary: "#7c3aed", // Purple
      secondary: "#5b21b6",
      accent: "#8b5cf6",
      text: "#1f2937",
      background: "#ffffff",
      border: "#e5e7eb",
    },
    fonts: {
      heading: "Poppins, sans-serif",
      body: "Inter, sans-serif",
    },
    layout: {
      columns: 2,
      headerStyle: "split",
      sectionStyle: "sidebar",
    },
  },
  {
    id: "academic",
    name: "Academic",
    description: "Classic academic CV format with detailed sections. Best for professors, researchers, and scholars.",
    preview: "academic",
    colors: {
      primary: "#1e3a5f",
      secondary: "#2d4a6f",
      accent: "#4a6fa5",
      text: "#2d3748",
      background: "#ffffff",
      border: "#cbd5e0",
    },
    fonts: {
      heading: "Computer Modern, Times New Roman, serif",
      body: "Computer Modern, Times New Roman, serif",
    },
    layout: {
      columns: 1,
      headerStyle: "left",
      sectionStyle: "boxed",
    },
  },
];

export const getTemplate = (id: TemplateStyle): ResumeTemplate => {
  return RESUME_TEMPLATES.find((t) => t.id === id) || RESUME_TEMPLATES[0];
};
