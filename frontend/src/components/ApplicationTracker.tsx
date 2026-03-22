import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Send, MessageSquare, Award, XCircle, ChevronDown, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { JobListing } from "@/types/jobs";

export type ApplicationStatus = "applied" | "interview" | "offer" | "rejected";

export interface TrackedApplication {
  id: string;
  job: JobListing;
  status: ApplicationStatus;
  appliedDate: string;
  notes: string;
}

interface ApplicationTrackerProps {
  applications: TrackedApplication[];
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onRemove: (id: string) => void;
}

const statusConfig: Record<ApplicationStatus, { label: string; icon: typeof Send; color: string; bgColor: string }> = {
  applied: { label: "Applied", icon: Send, color: "text-primary", bgColor: "bg-primary/10 border-primary/20" },
  interview: { label: "Interview", icon: MessageSquare, color: "text-accent", bgColor: "bg-accent/10 border-accent/20" },
  offer: { label: "Offer", icon: Award, color: "text-green-500", bgColor: "bg-green-500/10 border-green-500/20" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/20" },
};

const statuses: ApplicationStatus[] = ["applied", "interview", "offer", "rejected"];

const ApplicationTracker = ({ applications, onUpdateStatus, onRemove }: ApplicationTrackerProps) => {
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");

  const filtered = filterStatus === "all" ? applications : applications.filter((a) => a.status === filterStatus);

  const counts = statuses.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">No tracked applications yet</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Click "Apply" on a job card to start tracking
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {statuses.map((s) => {
          const config = statusConfig[s];
          const Icon = config.icon;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className={`p-3 rounded-lg border transition-all text-left ${
                filterStatus === s ? config.bgColor : "bg-muted/20 border-border/50 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${filterStatus === s ? config.color : "text-muted-foreground"}`} />
                <span className={`text-lg font-bold ${filterStatus === s ? config.color : "text-foreground"}`}>
                  {counts[s]}
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filter info */}
      {filterStatus !== "all" && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} {statusConfig[filterStatus].label.toLowerCase()} application{filtered.length !== 1 ? "s" : ""}
          </p>
          <Button size="sm" variant="ghost" onClick={() => setFilterStatus("all")} className="text-xs">
            Show all
          </Button>
        </div>
      )}

      {/* Application list */}
      <AnimatePresence mode="popLayout">
        {filtered.map((app) => {
          const config = statusConfig[app.status];
          const Icon = config.icon;
          return (
            <motion.div
              key={app.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card-hover p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm">{app.job.title}</h4>
                  <p className="text-xs text-primary font-medium">{app.job.company} • {app.job.location}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Applied {app.appliedDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={app.status}
                    onValueChange={(val) => onUpdateStatus(app.id, val as ApplicationStatus)}
                  >
                    <SelectTrigger className={`h-8 w-[130px] text-xs border ${config.bgColor}`}>
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3 h-3 ${config.color}`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {statusConfig[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(app.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {app.job.matchingSkills.slice(0, 4).map((skill) => (
                  <Badge key={skill} className="text-[10px] bg-accent/15 text-accent border-accent/30">
                    {skill}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-[10px]">
                  {app.job.matchScore}% match
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ApplicationTracker;
