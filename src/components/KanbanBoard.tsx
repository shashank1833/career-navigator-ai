import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobApplication, ApplicationStatus } from "@/hooks/useJobApplications";

interface KanbanBoardProps {
  applications: JobApplication[];
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onRemove: (id: string) => void;
}

const columns: { status: ApplicationStatus; label: string; dotColor: string }[] = [
  { status: "saved", label: "SAVED", dotColor: "bg-primary" },
  { status: "applied", label: "APPLIED", dotColor: "bg-muted-foreground" },
  { status: "interview", label: "INTERVIEW", dotColor: "bg-warning" },
  { status: "offer", label: "OFFER", dotColor: "bg-primary" },
  { status: "rejected", label: "REJECTED", dotColor: "bg-destructive" },
];

const KanbanBoard = ({ applications, onUpdateStatus, onRemove }: KanbanBoardProps) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const items = applications.filter((a) => a.status === col.status);
        return (
          <div key={col.status} className="flex-shrink-0 w-56">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="ed-label">{col.label}</span>
              <span className="ed-label bg-muted px-1.5 py-0.5 rounded text-[10px]">{items.length}</span>
            </div>
            <div className="space-y-2 min-h-[120px]">
              {items.map((app) => (
                <div key={app.id} className="ed-card p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${col.dotColor} shrink-0`} />
                        <p className="text-[13px] font-medium text-foreground truncate">{app.job_title}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-3.5">
                        <Building2 className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-[11px] text-muted-foreground truncate">{app.company}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100" onClick={() => onRemove(app.id)}>
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between ml-3.5">
                    <span className="font-mono text-[11px] text-primary font-medium">{app.match_score}%</span>
                    <span className="text-[10px] text-muted-foreground">{app.applied_date || "—"}</span>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-[11px] text-muted-foreground">No items</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
