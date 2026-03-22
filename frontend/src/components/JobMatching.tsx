import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, Search, Bookmark, ClipboardList, Loader2, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import DashboardCard from "./DashboardCard";
import JobCard from "./JobCard";
import ResumeAutoOptimizer from "./ResumeAutoOptimizer";
import ApplicationTrackerTable from "./ApplicationTrackerTable";
import { useJobApplications, type ApplicationStatus } from "@/hooks/useJobApplications";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import type { AnalysisProfile } from "@/types/analysis";
import type { JobListing, ResumeOptimization } from "@/types/jobs";

interface JobMatchingProps {
  profile: AnalysisProfile;
  initialTab?: "recommended" | "saved" | "tracker";
}

const JobMatching = ({ profile, initialTab = "recommended" }: JobMatchingProps) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("us");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [useRealJobs, setUseRealJobs] = useState(true);
  const [activeTab, setActiveTab] = useState<"recommended" | "saved" | "tracker">(initialTab);
  const { toast } = useToast();
  const { applications, loading: appsLoading, addApplication, updateStatus, updateNotes, removeApplication } = useJobApplications();
  const { savedJobs, loading: savedLoading, saveJob, unsaveJob, isJobSaved } = useSavedJobs();
  const { saveOriginalResume, saveOptimizedVersion } = useResumeVersions();

  // Save original resume on mount
  useEffect(() => {
    saveOriginalResume(profile);
  }, [profile]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchRealJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-jobs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            skills: profile.skills,
            technologies: profile.technologies,
            jobTitle: searchQuery || undefined,
            location,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch jobs");
      }
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (e) {
      // Fallback to mock jobs if Adzuna fails
      console.error("Real job search failed, falling back to AI-generated jobs:", e);
      toast({
        title: "Using AI-Generated Jobs",
        description: "Real job search unavailable, showing sample matches",
      });
      await fetchMockJobs();
    } finally {
      setLoading(false);
    }
  };

  const fetchMockJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-jobs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            skills: profile.skills,
            technologies: profile.technologies,
            experience: profile.experience,
            education: profile.education,
            jobTitle: searchQuery || undefined,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to load jobs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = () => {
    if (useRealJobs) {
      fetchRealJobs();
    } else {
      fetchMockJobs();
    }
  };

  const handleOptimize = async (job: JobListing) => {
    setSelectedJob(job);
  };

  const handleSaveJob = async (job: JobListing) => {
    if (isJobSaved(job.id)) {
      await unsaveJob(job.id);
      toast({ title: "Removed", description: `${job.title} removed from saved jobs` });
    } else {
      await saveJob(job);
      toast({ title: "Job Saved", description: `${job.title} at ${job.company} saved` });
    }
  };

  const handleTrackApplication = async (job: JobListing) => {
    const existing = applications.find((a) => a.job_id === job.id);
    if (existing) {
      toast({ title: "Already Tracked", description: "This application is already being tracked" });
      return;
    }
    await addApplication(job, "applied");
    toast({ title: "Application Tracked", description: `${job.title} at ${job.company} added to tracker` });
  };

  if (selectedJob) {
    return (
      <ResumeAutoOptimizer
        profile={profile}
        job={selectedJob}
        onBack={() => { setSelectedJob(null); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <DashboardCard title="Job Matching" icon={Briefcase} accentColor="primary">
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role (e.g. Backend Engineer, Data Scientist)..."
            className="flex-1 bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/50"
            onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
          />
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-[100px] bg-muted/30">
              <Globe className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="us">US</SelectItem>
              <SelectItem value="gb">UK</SelectItem>
              <SelectItem value="ca">Canada</SelectItem>
              <SelectItem value="au">Australia</SelectItem>
              <SelectItem value="de">Germany</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchJobs} disabled={loading} className="shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "recommended" | "saved" | "tracker")} className="w-full">
          <TabsList className="w-full flex justify-start gap-1 bg-muted/30 border border-border rounded-lg p-1 mb-4">
            <TabsTrigger value="recommended" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Briefcase className="w-3.5 h-3.5" /> Recommended
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Bookmark className="w-3.5 h-3.5" /> Saved ({savedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="tracker" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ClipboardList className="w-3.5 h-3.5" /> Tracker ({applications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommended">
            {!searched && !loading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm mb-3">Find real jobs that match your skills</p>
                <Button onClick={fetchJobs} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Search Jobs
                </Button>
              </motion.div>
            ) : loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Searching real job listings...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{jobs.length} jobs found</p>
                  <Button size="sm" variant="ghost" onClick={fetchJobs} className="text-xs text-muted-foreground">
                    <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                  </Button>
                </div>
                {jobs.map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onOptimize={handleOptimize}
                    onSave={handleSaveJob}
                    onTrack={handleTrackApplication}
                    isSaved={isJobSaved(job.id)}
                    delay={i * 0.08}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {savedLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
              </div>
            ) : savedJobs.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No saved jobs yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedJobs.map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onOptimize={handleOptimize}
                    onSave={handleSaveJob}
                    onTrack={handleTrackApplication}
                    isSaved={true}
                    delay={i * 0.08}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tracker">
            <ApplicationTrackerTable
              applications={applications}
              loading={appsLoading}
              onUpdateStatus={updateStatus}
              onUpdateNotes={updateNotes}
              onRemove={removeApplication}
            />
          </TabsContent>
        </Tabs>
      </DashboardCard>
    </div>
  );
};

export default JobMatching;
