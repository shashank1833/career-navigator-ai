import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, DollarSign, ChevronRight, Sparkles, ExternalLink, Bookmark, BookmarkCheck, ClipboardList } from "lucide-react";
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

const CircularProgress = ({ value, size = 56 }: { value: number; size?: number }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "hsl(var(--accent))" : value >= 60 ? "hsl(var(--primary))" : "hsl(var(--secondary))";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{value}%</span>
      </div>
    </div>
  );
};

const JobCard = ({ job, onOptimize, onSave, onTrack, isSaved = false, delay = 0 }: JobCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card-hover p-5 group"
    >
      <div className="flex items-start gap-4">
        <CircularProgress value={job.matchScore} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground text-base leading-tight">{job.title}</h3>
              <p className="text-sm text-primary font-medium mt-0.5">{job.company}</p>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs border-border text-muted-foreground">
              {job.type}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.postedDate}</span>
          </div>

          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.description}</p>

          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5">
              {job.matchingSkills.map((skill) => (
                <Badge key={skill} className="text-[10px] bg-accent/15 text-accent border-accent/30 hover:bg-accent/20">
                  {skill}
                </Badge>
              ))}
              {job.missingSkills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-[10px] border-destructive/30 text-destructive/70">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Button
              size="sm"
              onClick={() => onOptimize(job)}
              className="text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
              variant="ghost"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Optimize Resume
            </Button>
            {onSave && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onSave(job)}
              >
                <Bookmark className="w-3 h-3 mr-1" />
                Save
              </Button>
            )}
            {onTrack && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onTrack(job)}
              >
                <ClipboardList className="w-3 h-3 mr-1" />
                Track
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => window.open(job.applyUrl, "_blank")}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
