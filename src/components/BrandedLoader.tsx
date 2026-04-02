import { Brain, Loader2 } from "lucide-react";

const BrandedLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex items-center gap-3">
      <Brain className="w-5 h-5 text-primary" strokeWidth={1.5} />
      <span className="text-[13px] font-medium text-foreground">Career Intelligence</span>
      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    </div>
  </div>
);

export default BrandedLoader;
