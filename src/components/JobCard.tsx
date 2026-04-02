import { Briefcase, MapPin, Clock, DollarSign, Sparkles, ExternalLink, Bookmark, BookmarkCheck, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobListing } from "@/types/jobs";

interface JobCardProps {
  job: JobListing;
  onOptimize: (job: JobListing) => void;
  onSave?: (job: JobListing) => void;
  onTrack?: (job: JobListing) => void;
  isSaved?: boolean;
  delay?: number;
}

const JobCard = ({ job, onOptimize, onSave, onTrack, isSaved = false }: JobCardProps) => {
  return (
    <div className="ed-card group">
      <div className="flex items-start gap-4">
        {/* Company initial avatar */}
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="font-mono text-[13px] font-medium text-primary-foreground">
            {job.company.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground text-[13px] leading-tight">{job.title}</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">{job.company}</p>
            </div>
            <span className="ed-match-badge shrink-0">{job.matchScore}%</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.5} />{job.location}</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" strokeWidth={1.5} />{job.salary}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.5} />{job.postedDate}</span>
          </div>

          <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2">{job.description}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.matchingSkills.map((skill) => (
              <span key={skill} className="ed-skill-pill bg-teal-light text-primary">{skill}</span>
            ))}
            {job.missingSkills.slice(0, 3).map((skill) => (
              <span key={skill} className="ed-skill-pill">{skill}</span>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button onClick={() => onOptimize(job)} className="ed-btn text-[11px] py-1.5 px-3">
              <Sparkles className="w-3 h-3" strokeWidth={1.5} /> Optimize Resume
            </button>
            {onSave && (
              <button
                className={`ed-btn text-[11px] py-1.5 px-3 ${isSaved ? "border-primary text-primary" : ""}`}
                onClick={() => onSave(job)}
              >
                {isSaved ? <BookmarkCheck className="w-3 h-3" strokeWidth={1.5} /> : <Bookmark className="w-3 h-3" strokeWidth={1.5} />}
                {isSaved ? "Saved" : "Save"}
              </button>
            )}
            {onTrack && (
              <button className="ed-btn text-[11px] py-1.5 px-3" onClick={() => onTrack(job)}>
                <ClipboardList className="w-3 h-3" strokeWidth={1.5} /> Track
              </button>
            )}
            <button className="ed-btn text-[11px] py-1.5 px-3" onClick={() => window.open(job.applyUrl, "_blank")}>
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} /> Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
