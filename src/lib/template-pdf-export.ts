import jsPDF from "jspdf";
import type { TemplateData } from "@/components/ResumeTemplatePreview";

interface ExportOptions {
  jobTitle?: string;
  company?: string;
  score?: number;
}

/**
 * Export resume using a consistent professional template.
 * Template order: Name & Contact → Summary → Skills → Experience → Projects → Education
 */
export const exportTemplatePdf = (data: TemplateData, options: ExportOptions = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Colors
  const colorPrimary: [number, number, number] = [79, 70, 229]; // indigo-600
  const colorDark: [number, number, number] = [17, 24, 39];
  const colorGray: [number, number, number] = [107, 114, 128];
  const colorLightGray: [number, number, number] = [156, 163, 175];

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 18;
    }
  };

  const addText = (
    text: string,
    size: number,
    style: "normal" | "bold" = "normal",
    color: [number, number, number] = colorDark,
    maxWidth: number = contentWidth
  ) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = size * 0.45;
    checkPageBreak(lines.length * lineHeight + 4);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + 2;
  };

  const addSectionDivider = (title: string) => {
    y += 5;
    checkPageBreak(14);
    // Colored line
    doc.setDrawColor(...colorPrimary);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    // Section title
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorPrimary);
    doc.text(title.toUpperCase(), margin, y);
    y += 6;
  };

  // ═══════════════════════════════════════════════════════════════
  // 1. NAME & CONTACT
  // ═══════════════════════════════════════════════════════════════
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colorDark);
  doc.text(data.name || "Candidate", margin, y);
  y += 8;

  // Contact line
  const contactParts: string[] = [];
  if (data.email) contactParts.push(data.email);
  if (data.phone) contactParts.push(data.phone);
  if (data.location) contactParts.push(data.location);
  if (data.linkedin) contactParts.push(data.linkedin);

  if (contactParts.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorGray);
    doc.text(contactParts.join("  |  "), margin, y);
    y += 5;
  }

  // Target job info
  if (options.jobTitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorGray);
    const targetText = options.company
      ? `Optimized for: ${options.jobTitle} at ${options.company}`
      : `Optimized for: ${options.jobTitle}`;
    doc.text(targetText, margin, y);
    y += 4;
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. SUMMARY
  // ═══════════════════════════════════════════════════════════════
  if (data.summary) {
    addSectionDivider("Professional Summary");
    addText(data.summary, 10, "normal", colorDark);
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. SKILLS
  // ═══════════════════════════════════════════════════════════════
  if (data.skills.length > 0) {
    addSectionDivider("Skills");
    // Display skills as a flowing list with bullets
    const skillText = data.skills.join("  \u2022  ");
    addText(skillText, 9.5, "normal", colorDark);
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. EXPERIENCE
  // ═══════════════════════════════════════════════════════════════
  if (data.experiences.length > 0) {
    addSectionDivider("Experience");
    data.experiences.forEach((exp, idx) => {
      checkPageBreak(20);
      // Title and duration on same line
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colorDark);
      doc.text(exp.title || "Position", margin, y);

      if (exp.duration) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colorGray);
        const durationWidth = doc.getTextWidth(exp.duration);
        doc.text(exp.duration, pageWidth - margin - durationWidth, y);
      }
      y += 5;

      // Company
      if (exp.company) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colorPrimary);
        doc.text(exp.company, margin, y);
        y += 5;
      }

      // Bullets
      exp.bullets.forEach((bullet) => {
        if (!bullet.trim()) return;
        const bulletText = `\u2022  ${bullet}`;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colorDark);
        const lines = doc.splitTextToSize(bulletText, contentWidth - 4);
        checkPageBreak(lines.length * 4.5 + 2);
        doc.text(lines, margin + 2, y);
        y += lines.length * 4.2 + 1.5;
      });

      if (idx < data.experiences.length - 1) y += 3;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. PROJECTS
  // ═══════════════════════════════════════════════════════════════
  if (data.projects.length > 0) {
    addSectionDivider("Projects");
    data.projects.forEach((proj, idx) => {
      checkPageBreak(15);
      // Project name
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colorDark);
      doc.text(proj.name || "Project", margin, y);
      y += 5;

      // Description
      if (proj.description) {
        addText(proj.description, 9, "normal", colorDark);
      }

      // Technologies
      if (proj.technologies.length > 0) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colorGray);
        doc.text(`Technologies: ${proj.technologies.join(", ")}`, margin, y);
        y += 4;
      }

      if (idx < data.projects.length - 1) y += 2;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. EDUCATION
  // ═══════════════════════════════════════════════════════════════
  if (data.education) {
    addSectionDivider("Education");
    addText(data.education, 10, "normal", colorDark);
  }

  // ── Footer ──
  doc.setFontSize(7);
  doc.setTextColor(...colorLightGray);
  doc.text("Generated by Career Intelligence Platform", margin, pageHeight - 10);

  if (options.score) {
    const scoreText = `Match Score: ${options.score}/100`;
    const scoreWidth = doc.getTextWidth(scoreText);
    doc.text(scoreText, pageWidth - margin - scoreWidth, pageHeight - 10);
  }

  // Save
  const safeName = (data.name || "Resume").replace(/[^a-zA-Z0-9]/g, "_");
  const safeJob = (options.jobTitle || "Optimized").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${safeName}_${safeJob}.pdf`);
};
