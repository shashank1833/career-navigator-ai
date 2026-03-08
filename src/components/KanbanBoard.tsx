import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Building2, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobApplication, ApplicationStatus } from "@/hooks/useJobApplications";

interface KanbanBoardProps {
  applications: JobApplication[];
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onRemove: (id: string) => void;
}

const columns: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: "saved", label: "Saved", color: "border-t-primary" },
  { status: "applied", label: "Applied", color: "border-t-secondary" },
  { status: "interview", label: "Interview", color: "border-t-accent" },
  { status: "offer", label: "Offer", color: "border-t-green-500" },
  { status: "rejected", label: "Rejected", color: "border-t-destructive" },
];

const KanbanBoard = ({ applications, onUpdateStatus, onRemove }: KanbanBoardProps) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map((col) => {
        const items = applications.filter((a) => a.status === col.status);
        return (
          <div
            key={col.status}
            className={`flex-shrink-0 w-64 rounded-xl bg-card/50 backdrop-blur border border-border border-t-2 ${col.color}`}
          >
            <div className="p-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            </div>
            <div className="px-2 pb-2 space-y-2 min-h-[120px]">
              {items.map((app) => (
                <motion.div key={app.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="bg-card/80 border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{app.job_title}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">{app.company}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemove(app.id)}>
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{app.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary" />
                          <span className="text-xs font-medium text-primary">{app.match_score}%</span>
                        </div>
                        <Select value={app.status} onValueChange={(v) => onUpdateStatus(app.id, v as ApplicationStatus)}>
                          <SelectTrigger className="h-6 text-xs w-24 border-none bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((c) => (
                              <SelectItem key={c.status} value={c.status} className="text-xs">
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">No items</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
