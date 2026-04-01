import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Bell, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analyze": "Analysis",
  "/optimizer": "Resume Optimizer",
  "/resumes": "Resumes",
  "/settings": "Settings",
};

const DashboardHeader = () => {
  const { toggleSidebar } = useSidebar();
  const { user, signOut, isEmergentAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null }>({ display_name: null, avatar_url: null });

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved !== "light" : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (!user) return;
    
    // For Emergent Auth users, use data from the user object directly
    if (isEmergentAuth) {
      setProfile({
        display_name: user.name || null,
        avatar_url: user.picture || null,
      });
    } else {
      // For Supabase users, fetch from profiles table
      supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single()
        .then(({ data }) => { if (data) setProfile(data); })
        .catch(() => { /* Ignore profile fetch errors */ });
    }
  }, [user, isEmergentAuth]);

  const displayName = profile?.display_name || user?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border/30 bg-card/60 backdrop-blur-xl sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </Button>
        <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDark((p) => !p)}
          className="rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>

        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg hover:bg-muted/50 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
        </Button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors outline-none">
              <Avatar className="w-7 h-7">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden sm:block">{displayName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/50">
            <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer text-sm">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer text-sm">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-sm text-destructive focus:text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
