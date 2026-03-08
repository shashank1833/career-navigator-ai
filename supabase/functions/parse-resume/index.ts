import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ===== SKILL DICTIONARY =====
const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["js", "es6", "es2015", "ecmascript", "vanilla js"],
  typescript: ["ts"],
  react: ["react.js", "reactjs", "react js"],
  "vue.js": ["vue", "vuejs", "vue js", "vue 3"],
  angular: ["angularjs", "angular.js", "angular 2+"],
  "node.js": ["node", "nodejs", "node js"],
  "express.js": ["express", "expressjs"],
  "next.js": ["nextjs", "next"],
  python: ["py", "python3", "python 3"],
  java: ["jdk", "java se", "java ee"],
  "c#": ["csharp", "c sharp", "dotnet", ".net"],
  "c++": ["cpp", "c plus plus"],
  ruby: ["ruby on rails", "rails", "ror"],
  php: ["php7", "php8", "laravel", "symfony"],
  go: ["golang"],
  rust: ["rustlang"],
  kotlin: ["kt"],
  swift: ["swiftui"],
  sql: ["mysql", "postgresql", "postgres", "mssql", "sql server", "sqlite", "oracle db"],
  mongodb: ["mongo"],
  redis: [],
  dynamodb: [],
  aws: ["amazon web services", "ec2", "s3", "lambda", "aws cloud"],
  azure: ["microsoft azure", "azure cloud"],
  gcp: ["google cloud", "google cloud platform"],
  docker: ["containers", "containerization"],
  kubernetes: ["k8s", "kube"],
  "rest api": ["restful", "restful api", "rest", "rest apis", "api design"],
  graphql: ["gql", "apollo graphql"],
  git: ["github", "gitlab", "bitbucket", "version control"],
  "ci/cd": ["continuous integration", "continuous deployment", "jenkins", "github actions", "circleci"],
  "machine learning": ["ml", "deep learning"],
  tensorflow: ["tf"],
  pytorch: ["torch"],
  html: ["html5"],
  css: ["css3", "sass", "scss", "less", "tailwind", "tailwindcss", "bootstrap"],
  "spring boot": ["spring", "spring framework", "spring mvc"],
  django: ["django rest framework", "drf"],
  flask: ["flask api"],
  fastapi: [],
  linux: ["ubuntu", "centos", "debian"],
  "apache kafka": ["kafka"],
  elasticsearch: ["elastic"],
  figma: [],
  "power bi": ["powerbi"],
  tableau: [],
  pandas: [],
  numpy: [],
  scikit_learn: ["sklearn", "scikit-learn"],
  opencv: ["cv2"],
  nltk: [],
  spacy: [],
  "react native": [],
  flutter: [],
  dart: [],
  scala: [],
  haskell: [],
  perl: [],
  r: ["r language", "rlang"],
  matlab: [],
  "apache spark": ["spark", "pyspark"],
  hadoop: [],
  terraform: [],
  ansible: [],
  nginx: [],
  graphite: [],
  prometheus: [],
  grafana: [],
  jira: [],
  confluence: [],
  postman: [],
  swagger: ["openapi"],
  rabbitmq: [],
  celery: [],
  heroku: [],
  vercel: [],
  netlify: [],
  firebase: [],
  supabase: [],
};

// Build reverse lookup
const SKILL_CANONICAL = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
  SKILL_CANONICAL.set(canonical.toLowerCase(), canonical);
  for (const alias of aliases) {
    SKILL_CANONICAL.set(alias.toLowerCase(), canonical);
  }
}

function normalizeSkill(skill: string): string {
  const lower = skill.toLowerCase().trim();
  return SKILL_CANONICAL.get(lower) || skill.trim();
}

// ===== DOCX TEXT EXTRACTION =====
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  // DOCX is a ZIP containing word/document.xml
  // Use Deno's built-in Blob + DecompressionStream, or manual ZIP parsing
  // For simplicity, use JSZip via esm.sh
  const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("Invalid DOCX file - no document.xml found");

  // Replace paragraph/line-break tags with newlines
  let text = docXml
    .replace(/<\/w:p[^>]*>/g, "\n")
    .replace(/<w:br[^>]*\/?>/g, "\n")
    .replace(/<w:tab[^>]*\/?>/g, "\t");

  // Strip all XML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode XML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1))));

  // Clean whitespace
  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

// ===== PDF TEXT EXTRACTION =====
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    const { extractText } = await import("https://esm.sh/unpdf@0.12.1?bundle-deps");
    const { text } = await extractText(new Uint8Array(buffer));
    return text || "";
  } catch (e) {
    console.error("unpdf extraction failed, trying fallback:", e);
    // Fallback: basic regex extraction from raw PDF bytes
    return extractPdfTextFallback(buffer);
  }
}

function extractPdfTextFallback(buffer: ArrayBuffer): string {
  // Very basic PDF text extraction via regex on raw bytes
  // Works for simple text-based PDFs, not for scanned documents
  const bytes = new Uint8Array(buffer);
  const raw = new TextDecoder("latin1").decode(bytes);

  const textParts: string[] = [];

  // Extract text from BT...ET blocks (PDF text objects)
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(((?:[^\\)]|\\.)*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textParts.push(tjMatch[1].replace(/\\(.)/g, "$1"));
    }
    // TJ arrays
    const tjArrayRegex = /\[((?:[^\]]*?))\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const arrContent = tjArrMatch[1];
      const strRegex = /\(((?:[^\\)]|\\.)*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(arrContent)) !== null) {
        textParts.push(strMatch[1].replace(/\\(.)/g, "$1"));
      }
    }
  }

  // Also try to find text in stream objects
  if (textParts.length === 0) {
    // Extract readable strings as last resort
    const readableRegex = /[\x20-\x7E]{4,}/g;
    const readableMatches = raw.match(readableRegex) || [];
    // Filter out PDF syntax noise
    const filtered = readableMatches.filter(
      (s) => !s.startsWith("/") && !s.startsWith("<<") && !s.includes("stream") && !s.includes("endobj") && s.length > 5
    );
    return filtered.join(" ").substring(0, 50000);
  }

  return textParts.join(" ").replace(/\s+/g, " ").trim();
}

// ===== SECTION DETECTION =====
interface DetectedSections {
  personal: string;
  summary: string;
  education: string;
  experience: string;
  skills: string;
  projects: string;
  certifications: string;
  achievements: string;
  [key: string]: string;
}

const SECTION_HEADERS: Record<string, RegExp> = {
  summary: /\b(summary|objective|professional\s*summary|career\s*objective|profile|about\s*me)\b/i,
  education: /\b(education|academic|qualifications?|degrees?)\b/i,
  experience: /\b(work\s*experience|professional\s*experience|employment|work\s*history|experience|career\s*history)\b/i,
  skills: /\b(skills|technical\s*skills|core\s*competencies|technologies|tech\s*stack|proficiencies|competencies)\b/i,
  projects: /\b(projects|personal\s*projects|academic\s*projects|key\s*projects|notable\s*projects)\b/i,
  certifications: /\b(certifications?|licenses?|credentials?|professional\s*development)\b/i,
  achievements: /\b(achievements?|accomplishments?|awards?|honors?|recognition)\b/i,
};

function detectSections(text: string): DetectedSections {
  const lines = text.split("\n");
  const sections: DetectedSections = {
    personal: "",
    summary: "",
    education: "",
    experience: "",
    skills: "",
    projects: "",
    certifications: "",
    achievements: "",
  };

  // Find section boundaries
  interface SectionBoundary {
    name: string;
    lineIndex: number;
  }

  const boundaries: SectionBoundary[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length > 80) continue; // Section headers are usually short

    for (const [name, pattern] of Object.entries(SECTION_HEADERS)) {
      // Check if the line is primarily a header (not embedded in a sentence)
      if (pattern.test(line) && line.split(/\s+/).length <= 6) {
        boundaries.push({ name, lineIndex: i });
        break;
      }
    }
  }

  // Content before first section header is "personal" info
  const firstBoundary = boundaries.length > 0 ? boundaries[0].lineIndex : lines.length;
  sections.personal = lines.slice(0, firstBoundary).join("\n").trim();

  // Extract text for each section
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].lineIndex + 1;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].lineIndex : lines.length;
    sections[boundaries[i].name] = lines.slice(start, end).join("\n").trim();
  }

  return sections;
}

// ===== ENTITY EXTRACTION =====
interface ParsedEducation {
  degree: string;
  field: string;
  institution: string;
  year: string;
}

interface ParsedExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
}

interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  skills: string[];
  technologies: Array<{ category: string; items: string[] }>;
  education: ParsedEducation[];
  experience: ParsedExperience[];
  projects: ParsedProject[];
  summary: string;
  sections: DetectedSections;
}

function extractEntities(text: string, sections: DetectedSections): ParsedResume {
  // ---- EMAIL ----
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const email = emailMatch ? emailMatch[0] : "";

  // ---- PHONE ----
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // ---- LINKEDIN ----
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : "";

  // ---- NAME ----
  const name = extractName(sections.personal || text);

  // ---- SKILLS ----
  const skills = extractSkillsFromText(text);

  // ---- TECHNOLOGIES (categorized) ----
  const technologies = categorizeSkills(skills);

  // ---- EDUCATION ----
  const education = extractEducation(sections.education);

  // ---- EXPERIENCE ----
  const experience = extractExperience(sections.experience);

  // ---- PROJECTS ----
  const projects = extractProjects(sections.projects);

  // ---- SUMMARY ----
  const summary = sections.summary || "";

  return {
    name,
    email,
    phone,
    linkedin,
    skills,
    technologies,
    education,
    experience,
    projects,
    summary,
    sections,
  };
}

function extractName(personalSection: string): string {
  const lines = personalSection.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "";

  // First line is usually the name
  const firstLine = lines[0];
  // Check if it looks like a name (2-4 words, mostly letters)
  if (/^[A-Za-z\s.'-]{2,60}$/.test(firstLine) && firstLine.split(/\s+/).length <= 5) {
    return firstLine;
  }

  // Try finding a line that looks like a name
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line) && line.split(/\s+/).length <= 4) {
      return line;
    }
  }

  return firstLine.substring(0, 60);
}

function extractSkillsFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found = new Set<string>();

  for (const [key] of SKILL_CANONICAL) {
    // Match whole words only
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(lowerText)) {
      found.add(normalizeSkill(key));
    }
  }

  return Array.from(found);
}

function categorizeSkills(skills: string[]): Array<{ category: string; items: string[] }> {
  const categories: Record<string, string[]> = {
    Languages: [],
    Frontend: [],
    Backend: [],
    Databases: [],
    "ML / AI": [],
    "DevOps / Cloud": [],
    Tools: [],
    Other: [],
  };

  const categoryMap: Record<string, string> = {
    javascript: "Languages",
    typescript: "Languages",
    python: "Languages",
    java: "Languages",
    "c++": "Languages",
    "c#": "Languages",
    go: "Languages",
    rust: "Languages",
    kotlin: "Languages",
    swift: "Languages",
    ruby: "Languages",
    php: "Languages",
    scala: "Languages",
    haskell: "Languages",
    perl: "Languages",
    r: "Languages",
    dart: "Languages",
    matlab: "Languages",
    sql: "Languages",
    react: "Frontend",
    "vue.js": "Frontend",
    angular: "Frontend",
    "next.js": "Frontend",
    html: "Frontend",
    css: "Frontend",
    figma: "Frontend",
    "react native": "Frontend",
    flutter: "Frontend",
    "node.js": "Backend",
    "express.js": "Backend",
    "spring boot": "Backend",
    django: "Backend",
    flask: "Backend",
    fastapi: "Backend",
    "rest api": "Backend",
    graphql: "Backend",
    "apache kafka": "Backend",
    rabbitmq: "Backend",
    celery: "Backend",
    mongodb: "Databases",
    redis: "Databases",
    dynamodb: "Databases",
    elasticsearch: "Databases",
    "machine learning": "ML / AI",
    tensorflow: "ML / AI",
    pytorch: "ML / AI",
    pandas: "ML / AI",
    numpy: "ML / AI",
    scikit_learn: "ML / AI",
    opencv: "ML / AI",
    nltk: "ML / AI",
    spacy: "ML / AI",
    aws: "DevOps / Cloud",
    azure: "DevOps / Cloud",
    gcp: "DevOps / Cloud",
    docker: "DevOps / Cloud",
    kubernetes: "DevOps / Cloud",
    terraform: "DevOps / Cloud",
    ansible: "DevOps / Cloud",
    "ci/cd": "DevOps / Cloud",
    heroku: "DevOps / Cloud",
    vercel: "DevOps / Cloud",
    netlify: "DevOps / Cloud",
    firebase: "DevOps / Cloud",
    nginx: "DevOps / Cloud",
    linux: "DevOps / Cloud",
    git: "Tools",
    jira: "Tools",
    confluence: "Tools",
    postman: "Tools",
    swagger: "Tools",
    "power bi": "Tools",
    tableau: "Tools",
    grafana: "Tools",
    prometheus: "Tools",
  };

  for (const skill of skills) {
    const lower = skill.toLowerCase();
    const cat = categoryMap[lower] || "Other";
    if (!categories[cat].includes(skill)) {
      categories[cat].push(skill);
    }
  }

  return Object.entries(categories)
    .filter(([, items]) => items.length > 0)
    .map(([category, items]) => ({ category, items }));
}

function extractEducation(section: string): ParsedEducation[] {
  if (!section.trim()) return [];

  const results: ParsedEducation[] = [];
  const degreePatterns = [
    /\b(Ph\.?D|Doctor(?:ate)?|M\.?S\.?|M\.?Tech|M\.?A\.?|MBA|B\.?S\.?|B\.?Tech|B\.?A\.?|B\.?E\.?|B\.?Sc|M\.?Sc|Bachelor'?s?|Master'?s?|Associate'?s?)\b/gi,
  ];

  const lines = section.split("\n").filter((l) => l.trim());
  let currentEdu: Partial<ParsedEducation> = {};

  for (const line of lines) {
    for (const pattern of degreePatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match) {
        if (currentEdu.degree) {
          results.push({
            degree: currentEdu.degree || "",
            field: currentEdu.field || "",
            institution: currentEdu.institution || "",
            year: currentEdu.year || "",
          });
          currentEdu = {};
        }
        currentEdu.degree = match[1];

        // Try to extract field of study
        const fieldMatch = line.match(/(?:in|of)\s+([A-Za-z\s&]+?)(?:\s*[,|–-]|\s*$)/i);
        if (fieldMatch) currentEdu.field = fieldMatch[1].trim();

        // Extract year
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) currentEdu.year = yearMatch[0];

        break;
      }
    }

    // Try to find institution name (line with university/college/institute)
    if (/\b(university|college|institute|school|academy)\b/i.test(line)) {
      currentEdu.institution = line.replace(/\b(19|20)\d{2}\b/g, "").trim();
    }
  }

  // Push last entry
  if (currentEdu.degree) {
    results.push({
      degree: currentEdu.degree || "",
      field: currentEdu.field || "",
      institution: currentEdu.institution || "",
      year: currentEdu.year || "",
    });
  }

  return results;
}

function extractExperience(section: string): ParsedExperience[] {
  if (!section.trim()) return [];

  const results: ParsedExperience[] = [];
  const lines = section.split("\n").filter((l) => l.trim());

  // Look for patterns like "Role at Company" or "Company - Role"
  const roleTitlePatterns = [
    /\b(engineer|developer|architect|manager|analyst|designer|consultant|intern|lead|director|specialist|coordinator|administrator)\b/i,
  ];

  let currentExp: Partial<ParsedExperience> = {};
  let descLines: string[] = [];

  for (const line of lines) {
    const isRoleLine = roleTitlePatterns.some((p) => p.test(line));
    const hasDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b.*\b(19|20)\d{2}\b/i.test(line) || /\b(19|20)\d{2}\b.*[-–]\s*(present|current|\b(19|20)\d{2}\b)/i.test(line);

    if (isRoleLine || hasDate) {
      // Save previous experience
      if (currentExp.role || currentExp.company) {
        currentExp.description = descLines.join(" ").trim();
        results.push({
          company: currentExp.company || "",
          role: currentExp.role || "",
          duration: currentExp.duration || "",
          description: currentExp.description || "",
        });
        descLines = [];
        currentExp = {};
      }

      // Parse role and company from the line
      const atMatch = line.match(/(.+?)\s+(?:at|@)\s+(.+)/i);
      const dashMatch = line.match(/(.+?)\s*[-–|]\s*(.+)/);

      if (atMatch) {
        currentExp.role = atMatch[1].trim();
        currentExp.company = atMatch[2].replace(/\b(19|20)\d{2}\b.*/g, "").trim();
      } else if (dashMatch) {
        // Could be "Company - Role" or "Role - Company"
        const first = dashMatch[1].trim();
        const second = dashMatch[2].replace(/\b(19|20)\d{2}\b.*/g, "").trim();
        if (roleTitlePatterns.some((p) => p.test(first))) {
          currentExp.role = first;
          currentExp.company = second;
        } else {
          currentExp.company = first;
          currentExp.role = second;
        }
      } else {
        currentExp.role = line.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*(19|20)\d{2}\b.*/gi, "").trim();
      }

      // Extract date range
      const dateMatch = line.match(/\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*(19|20)\d{2}\s*[-–]\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*(19|20)\d{2}))/i) ||
        line.match(/\b((19|20)\d{2}\s*[-–]\s*(?:present|current|(19|20)\d{2}))\b/i);
      if (dateMatch) currentExp.duration = dateMatch[1].trim();
    } else if (currentExp.role || currentExp.company) {
      descLines.push(line.trim());
    }
  }

  // Push last entry
  if (currentExp.role || currentExp.company) {
    currentExp.description = descLines.join(" ").trim();
    results.push({
      company: currentExp.company || "",
      role: currentExp.role || "",
      duration: currentExp.duration || "",
      description: currentExp.description || "",
    });
  }

  return results;
}

function extractProjects(section: string): ParsedProject[] {
  if (!section.trim()) return [];

  const results: ParsedProject[] = [];
  const lines = section.split("\n").filter((l) => l.trim());

  let currentProject: Partial<ParsedProject> = {};
  let descLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect project name: usually a shorter line that doesn't start with a bullet
    const isBullet = /^[•\-*▪►◆]/.test(trimmed);
    const isShortHeading = trimmed.length < 80 && !isBullet && /^[A-Z]/.test(trimmed);
    const hasTechIndicator = /\b(tech|stack|built\s*with|technologies|using)\b/i.test(trimmed);

    if (isShortHeading && !hasTechIndicator && trimmed.split(/\s+/).length <= 10) {
      // Save previous project
      if (currentProject.name) {
        currentProject.description = descLines.join(" ").trim();
        currentProject.technologies = extractSkillsFromText(currentProject.description);
        results.push({
          name: currentProject.name || "",
          description: currentProject.description || "",
          technologies: currentProject.technologies || [],
        });
        descLines = [];
      }
      currentProject = { name: trimmed };
    } else if (currentProject.name) {
      descLines.push(trimmed);
    }
  }

  // Push last project
  if (currentProject.name) {
    currentProject.description = descLines.join(" ").trim();
    currentProject.technologies = extractSkillsFromText(currentProject.description);
    results.push({
      name: currentProject.name || "",
      description: currentProject.description || "",
      technologies: currentProject.technologies || [],
    });
  }

  return results;
}

// ===== MAIN SERVER =====
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No resume file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();
    const isDocx = fileName.endsWith(".docx");
    const isPdf = fileName.endsWith(".pdf") || file.type === "application/pdf";

    if (!isDocx && !isPdf) {
      return new Response(JSON.stringify({ error: "Unsupported file format. Please upload PDF or DOCX." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Extract text
    console.log(`Extracting text from ${isDocx ? "DOCX" : "PDF"} file: ${file.name}`);
    let rawText: string;
    try {
      rawText = isDocx ? await extractDocxText(arrayBuffer) : await extractPdfText(arrayBuffer);
    } catch (extractError) {
      console.error("Text extraction failed:", extractError);
      return new Response(
        JSON.stringify({ error: "Failed to extract text from the file. Please try a different format." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!rawText || rawText.trim().length < 20) {
      return new Response(
        JSON.stringify({
          error: "Could not extract meaningful text. The file may be scanned/image-based. Please use a text-based PDF or DOCX.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted ${rawText.length} characters of text`);

    // Step 2: Detect sections
    const sections = detectSections(rawText);
    console.log("Detected sections:", Object.keys(sections).filter((k) => sections[k]));

    // Step 3: Extract entities
    const parsed = extractEntities(rawText, sections);
    console.log(`Extracted: name="${parsed.name}", skills=${parsed.skills.length}, edu=${parsed.education.length}, exp=${parsed.experience.length}`);

    return new Response(
      JSON.stringify({
        rawText,
        parsed,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: isDocx ? "docx" : "pdf",
          extractedAt: new Date().toISOString(),
          textLength: rawText.length,
          sectionsFound: Object.keys(sections).filter((k) => sections[k]).length,
          skillsFound: parsed.skills.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
