import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Send, MessageSquare, Award, XCircle, Bookmark, Trash2, StickyNote, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import DashboardCard from "./DashboardCard";
import type { ApplicationStatus, JobApplication } from "@/hooks/useJobApplications";

interface ApplicationTrackerTableProps {
  applications: JobApplication[];
  loading: boolean;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
}

const statusConfig: Record<ApplicationStatus, { label: string; icon: typeof Send; color: string; bgColor: string }> = {
  saved: { label: "Saved", icon: Bookmark, color: "text-muted-foreground", bgColor: "bg-muted/30 border-border/50" },
  applied: { label: "Applied", icon: Send, color: "text-primary", bgColor: "bg-primary/10 border-primary/20" },
  interview: { label: "Interview", icon: MessageSquare, color: "text-accent", bgColor: "bg-accent/10 border-accent/20" },
  offer: { label: "Offer", icon: Award, color: "text-green-500", bgColor: "bg-green-500/10 border-green-500/20" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/20" },
};

const statuses: ApplicationStatus[] = ["saved", "applied", "interview", "offer", "rejected"];

const ApplicationTrackerTable = ({
  applications,
  loading,
  onUpdateStatus,
  onUpdateNotes,
  onRemove,
}: ApplicationTrackerTableProps) => {
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "match" | "company">("date");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = applications
    .filter((a) => filterStatus === "all" || a.status === filterStatus)
    .filter((a) =>
      searchQuery === "" ||
      a.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.company.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "match") {
        return b.match_score - a.match_score;
      }
      return a.company.localeCompare(b.company);
    });

  const counts = statuses.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  if (loading) {
    return (
      <DashboardCard title="Application Tracker" icon={ClipboardList} accentColor="accent">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading applications...</p>
        </div>
      </DashboardCard>
    );
  }

  if (applications.length === 0) {
    return (
      <DashboardCard title="Application Tracker" icon={ClipboardList} accentColor="accent">
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No tracked applications yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Click "Apply" on a job card to start tracking
          </p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Application Tracker" icon={ClipboardList} accentColor="accent">
      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {statuses.map((s) => {
          const config = statusConfig[s];
          const Icon = config.icon;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className={`p-2 rounded-lg border transition-all text-left ${
                filterStatus === s ? config.bgColor : "bg-muted/20 border-border/50 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${filterStatus === s ? config.color : "text-muted-foreground"}`} />
                <span className={`text-sm font-bold ${filterStatus === s ? config.color : "text-foreground"}`}>
                  {counts[s]}
                </span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search and Sort */}
      <div className="flex gap-2 mb-4">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search applications..."
          className="flex-1 h-8 text-xs bg-muted/30"
        />
        <Select value={sortBy} onValueChange={(val) => setSortBy(val as typeof sortBy)}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date" className="text-xs">Date</SelectItem>
            <SelectItem value="match" className="text-xs">Match Score</SelectItem>
            <SelectItem value="company" className="text-xs">Company</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table View */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-medium">Company</TableHead>
              <TableHead className="text-xs font-medium">Role</TableHead>
              <TableHead className="text-xs font-medium text-center">Match</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">Date</TableHead>
              <TableHead className="text-xs font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.map((app) => {
                const config = statusConfig[app.status];
                const Icon = config.icon;
                return (
                  <motion.tr
                    key={app.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-border/30 hover:bg-muted/20"
                  >
                    <TableCell className="text-xs font-medium">{app.company}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        {app.job_title}
                        {app.apply_url && (
                          <a
                            href={app.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {app.match_score}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={app.status}
                        onValueChange={(val) => onUpdateStatus(app.id, val as ApplicationStatus)}
                      >
                        <SelectTrigger className={`h-7 w-[100px] text-[10px] border ${config.bgColor}`}>
                          <div className="flex items-center gap-1">
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
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {app.applied_date
                        ? new Date(app.applied_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost" className="w-6 h-6">
                              <StickyNote className="w-3 h-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64">
                            <Textarea
                              placeholder="Add notes..."
                              value={app.notes || ""}
                              onChange={(e) => onUpdateNotes(app.id, e.target.value)}
                              className="text-xs min-h-[80px]"
                            />
                          </PopoverContent>
                        </Popover>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemove(app.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground text-xs py-4">
          No applications match your filters
        </p>
      )}
    </DashboardCard>
  );
};

export default ApplicationTrackerTable;
