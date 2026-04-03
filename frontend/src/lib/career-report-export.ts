import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/analysis";
import type { JobListing } from "@/types/jobs";

export const exportCareerReport = (
  analysis: AnalysisResult,
  topJobs: JobListing[] = []
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (
    text: string,
    size: number,
    style: "normal" | "bold" = "normal",
    color: [number, number, number] = [30, 30, 30]
  ) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth);
    if (y + lines.length * (size * 0.5) > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 2;
  };

  const addSectionHeader = (title: string) => {
    y += 6;
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addText(title.toUpperCase(), 12, "bold", [99, 102, 241]);
    y += 2;
  };

  const addBullet = (text: string, indent = 0) => {
    addText(`• ${text}`, 10, "normal", [55, 65, 81]);
  };

  // Title
  addText("AI CAREER INTELLIGENCE REPORT", 18, "bold", [17, 24, 39]);
  y += 2;
  addText(`Generated: ${new Date().toLocaleDateString("en-US", { 
    year: "numeric", month: "long", day: "numeric" 
  })}`, 9, "normal", [107, 114, 128]);
  y += 8;

  // Profile Overview
  addSectionHeader("Profile Overview");
  addText(analysis.profile.name, 14, "bold");
  addText(`Education: ${analysis.profile.education}`, 10);
  addText(`Experience: ${analysis.profile.experience}`, 10);
  y += 2;

  addText("Core Skills:", 10, "bold");
  addText(analysis.profile.skills.join("  •  "), 9, "normal", [55, 65, 81]);
  y += 2;

  addText("Technologies:", 10, "bold");
  const techList = analysis.profile.technologies.map((t) =>
    typeof t === "string" ? t : `${t.category}: ${t.items.join(", ")}`
  );
  addText(techList.join("  •  "), 9, "normal", [55, 65, 81]);
  y += 4;

  // Job Match Score
  addSectionHeader("Job Market Readiness");
  addText(`Overall Score: ${analysis.jobMatch.overall}%`, 12, "bold", [16, 185, 129]);
  y += 2;
  addText(`Skill Match: ${analysis.jobMatch.skillMatch}%`, 10);
  addText(`Project Relevance: ${analysis.jobMatch.projectRelevance}%`, 10);
  addText(`Experience Match: ${analysis.jobMatch.experienceMatch}%`, 10);
  y += 4;

  // Skill Gap Analysis
  addSectionHeader("Skill Gap Analysis");
  
  if (analysis.skillGap.matching.length > 0) {
    addText("Strong Skills:", 10, "bold", [16, 185, 129]);
    addText(analysis.skillGap.matching.join("  •  "), 9);
    y += 2;
  }

  if (analysis.skillGap.missing.length > 0) {
    addText("Skills to Develop:", 10, "bold", [239, 68, 68]);
    addText(analysis.skillGap.missing.join("  •  "), 9);
    y += 2;
  }

  if (analysis.skillGap.suggested.length > 0) {
    addText("Recommended to Learn:", 10, "bold", [245, 158, 11]);
    addText(analysis.skillGap.suggested.join("  •  "), 9);
  }
  y += 4;

  // Top Job Matches
  if (topJobs.length > 0) {
    addSectionHeader("Top Job Matches");
    topJobs.slice(0, 5).forEach((job, idx) => {
      addText(`${idx + 1}. ${job.title} at ${job.company}`, 10, "bold");
      addText(`   Match Score: ${job.matchScore}% | Location: ${job.location}`, 9, "normal", [107, 114, 128]);
      if (job.matchingSkills.length > 0) {
        addText(`   Matching: ${job.matchingSkills.slice(0, 5).join(", ")}`, 9, "normal", [16, 185, 129]);
      }
      y += 2;
    });
    y += 2;
  }

  // Resume Improvements
  addSectionHeader("Resume Improvement Suggestions");
  analysis.improvements.slice(0, 5).forEach((imp) => {
    addText("Original:", 9, "bold", [107, 114, 128]);
    addText(imp.original, 9, "normal", [156, 163, 175]);
    addText("Improved:", 9, "bold", [16, 185, 129]);
    addText(imp.improved, 9);
    y += 3;
  });

  // Career Trajectory
  addSectionHeader("Career Growth Paths");
  analysis.careerTrajectory.slice(0, 4).forEach((path) => {
    addText(`${path.role} (${path.match}% match)`, 10, "bold");
    addText(`Skills needed: ${path.skills.join(", ")}`, 9, "normal", [107, 114, 128]);
    y += 2;
  });

  // Learning Roadmap
  addSectionHeader("Learning Roadmap");
  addText(`Goal: ${analysis.roadmap.goal}`, 10, "bold");
  y += 2;
  analysis.roadmap.steps.slice(0, 5).forEach((step, idx) => {
    const status = step.done ? "✓" : "○";
    addText(`${status} ${idx + 1}. ${step.title}`, 10, step.done ? "normal" : "bold");
    addText(`   ${step.desc}`, 9, "normal", [107, 114, 128]);
    y += 1;
  });

  // Interview Preparation
  addSectionHeader("Interview Preparation Questions");
  
  addText("Technical Questions:", 10, "bold");
  analysis.interviewQuestions.technical.slice(0, 3).forEach((q) => addBullet(typeof q === "string" ? q : q.question));
  y += 2;

  addText("Conceptual Questions:", 10, "bold");
  analysis.interviewQuestions.conceptual.slice(0, 3).forEach((q) => addBullet(typeof q === "string" ? q : q.question));
  y += 2;

  addText("Behavioral Questions:", 10, "bold");
  analysis.interviewQuestions.behavioral.slice(0, 3).forEach((q) => addBullet(typeof q === "string" ? q : q.question));

  // Weaknesses to Address
  if (analysis.weaknesses.length > 0) {
    addSectionHeader("Areas for Improvement");
    analysis.weaknesses.slice(0, 4).forEach((w) => {
      addText(`Issue: ${w.issue}`, 10, "bold", [239, 68, 68]);
      addText(`Fix: ${w.fix}`, 9, "normal", [55, 65, 81]);
      y += 2;
    });
  }

  // Footer
  y = 280;
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text("Generated by AI Career Intelligence Platform", margin, 285);
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 15, 285);

  // Save
  const fileName = `Career_Report_${analysis.profile.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
};
