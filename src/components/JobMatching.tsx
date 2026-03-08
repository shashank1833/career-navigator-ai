import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Search, Bookmark, ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import DashboardCard from "./DashboardCard";
import JobCard from "./JobCard";
import ResumeOptimizer from "./ResumeOptimizer";
import type { AnalysisProfile } from "@/types/analysis";
import type { JobListing, ResumeOptimization } from "@/types/jobs";

interface JobMatchingProps {
  profile: AnalysisProfile;
}

const JobMatching = ({ profile }: JobMatchingProps) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [savedJobs, setSavedJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [optimization, setOptimization] = useState<ResumeOptimization | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const { toast } = useToast();

  const fetchJobs = async () => {
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

  const handleOptimize = async (job: JobListing) => {
    setSelectedJob(job);
    setOptimizing(true);
    setOptimization(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profile, job }),
        }
      );

      if (!res.ok) throw new Error("Failed to optimize resume");
      const data = await res.json();
      setOptimization(data);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Optimization failed", variant: "destructive" });
      setSelectedJob(null);
    } finally {
      setOptimizing(false);
    }
  };

  const handleSaveJob = (job: JobListing) => {
    if (!savedJobs.find((j) => j.id === job.id)) {
      setSavedJobs((prev) => [...prev, job]);
      toast({ title: "Job Saved", description: `${job.title} at ${job.company} saved` });
    }
  };

  if (selectedJob && (optimizing || optimization)) {
    return (
      <ResumeOptimizer
        job={selectedJob}
        optimization={optimization}
        loading={optimizing}
        onBack={() => { setSelectedJob(null); setOptimization(null); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <DashboardCard title="Job Matching" icon={Briefcase} accentColor="primary">
        <div className="flex gap-2 mb-5">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role (e.g. Backend Engineer, Data Scientist)..."
            className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/50"
            onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
          />
          <Button onClick={fetchJobs} disabled={loading} className="shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        <Tabs defaultValue="recommended" className="w-full">
          <TabsList className="w-full flex justify-start gap-1 bg-muted/30 border border-border rounded-lg p-1 mb-4">
            <TabsTrigger value="recommended" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Briefcase className="w-3.5 h-3.5" />
              Recommended
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Bookmark className="w-3.5 h-3.5" />
              Saved ({savedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="tracker" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ClipboardList className="w-3.5 h-3.5" />
              Tracker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommended">
            {!searched && !loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm mb-3">Find jobs that match your skills</p>
                <Button onClick={fetchJobs} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Find Matching Jobs
                </Button>
              </motion.div>
            ) : loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Finding jobs that match your profile...</p>
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
                  <JobCard key={job.id} job={job} onOptimize={handleOptimize} delay={i * 0.08} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {savedJobs.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No saved jobs yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedJobs.map((job, i) => (
                  <JobCard key={job.id} job={job} onOptimize={handleOptimize} delay={i * 0.08} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tracker">
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Application tracking coming soon</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Track your job applications and their status</p>
            </div>
          </TabsContent>
        </Tabs>
      </DashboardCard>
    </div>
  );
};

export default JobMatching;
