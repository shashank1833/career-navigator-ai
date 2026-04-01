import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Briefcase, TrendingUp, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import DashboardCard from "./DashboardCard";
import { exportCareerReport } from "@/lib/career-report-export";
import type { AnalysisResult } from "@/types/analysis";
import type { JobListing } from "@/types/jobs";

interface CareerReportExportProps {
  analysis: AnalysisResult;
  topJobs?: JobListing[];
}

const CareerReportExport = ({ analysis, topJobs = [] }: CareerReportExportProps) => {
  const [exporting, setExporting] = useState(false);
  const [sections, setSections] = useState({
    profile: true,
    skillGap: true,
    jobMatches: true,
    improvements: true,
    career: true,
    interview: true,
  });
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      // Small delay for UX
      await new Promise((r) => setTimeout(r, 500));
      exportCareerReport(analysis, topJobs);
      toast({
        title: "Report Exported",
        description: "Your career intelligence report has been downloaded",
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sectionItems = [
    { key: "profile" as const, label: "Profile Overview", icon: FileText },
    { key: "skillGap" as const, label: "Skill Gap Analysis", icon: TrendingUp },
    { key: "jobMatches" as const, label: "Top Job Matches", icon: Briefcase },
    { key: "improvements" as const, label: "Resume Improvements", icon: FileText },
    { key: "career" as const, label: "Career Roadmap", icon: TrendingUp },
    { key: "interview" as const, label: "Interview Questions", icon: MessageSquare },
  ];

  return (
    <DashboardCard title="Export Career Report" icon={Download} accentColor="primary">
      <p className="text-sm text-muted-foreground mb-4">
        Generate a comprehensive PDF report with your career analysis, job matches, and improvement suggestions.
      </p>

      <div className="space-y-3 mb-6">
        <p className="text-xs font-medium text-foreground">Include in report:</p>
        {sectionItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.label
              key={item.key}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 cursor-pointer hover:bg-muted/30 transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Checkbox
                checked={sections[item.key]}
                onCheckedChange={() => toggleSection(item.key)}
              />
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-sm">{item.label}</span>
            </motion.label>
          );
        })}
      </div>

      <Button
        onClick={handleExport}
        disabled={exporting || !Object.values(sections).some(Boolean)}
        className="w-full"
        size="lg"
      >
        {exporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download PDF Report
          </>
        )}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center mt-3">
        Professional PDF format suitable for sharing with recruiters or mentors
      </p>
    </DashboardCard>
  );
};

export default CareerReportExport;
