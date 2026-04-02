import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Brain, Settings, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Analysis", url: "/analyze", icon: Brain },
  { title: "Optimizer", url: "/optimizer", icon: Sparkles },
  { title: "Resumes", url: "/resumes", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar w-[220px]">
      <SidebarHeader className="p-5 pb-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Brain className="w-5 h-5 text-primary shrink-0" strokeWidth={2} />
          {!collapsed && (
            <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">
              Career Intelligence
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator className="bg-border" />

      <SidebarContent className="px-3 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <button
                        onClick={() => navigate(item.url)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-150 relative text-[13px]",
                          isActive
                            ? "bg-teal-light text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-primary" />
                        )}
                        <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} strokeWidth={1.5} />
                        {!collapsed && <span>{item.title}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
