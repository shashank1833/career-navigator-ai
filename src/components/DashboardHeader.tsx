import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Bell, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analyze": "Analysis",
  "/optimizer": "Resume Optimizer",
  "/resumes": "Resumes",
  "/settings": "Settings",
};

const DashboardHeader = () => {
  const { toggleSidebar } = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null }>({ display_name: null, avatar_url: null });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); })
      .then(() => {}, () => {});
  }, [user]);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-card sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-lg hover:bg-muted transition-colors duration-150"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        </Button>
        <span className="ed-section-title">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
          <Input
            placeholder="Search…"
            className="pl-9 h-8 w-48 text-[13px] bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg hover:bg-muted transition-colors duration-150 relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors duration-150 outline-none">
              <Avatar className="w-7 h-7">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-teal-light text-primary font-mono font-medium">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-medium text-foreground hidden sm:block">{displayName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer text-[13px]">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer text-[13px]">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-[13px] text-destructive focus:text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
