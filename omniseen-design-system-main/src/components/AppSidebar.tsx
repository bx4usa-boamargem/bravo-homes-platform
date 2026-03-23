import {
  LayoutDashboard, FileText, Radar, Zap, Globe, Plug, Users, Settings, BarChart3, ChevronLeft, LogOut, Layout, ShieldCheck, Paintbrush, Layers,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useBlog } from "@/hooks/useBlog";

const navItems = [
  { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard },
  { title: "Artigos", url: "/client/articles", icon: FileText },
  { title: "Geração em Massa", url: "/client/articles/bulk", icon: Layers },
  { title: "Super Pages", url: "/client/landing-pages", icon: Zap },
  { title: "Radar", url: "/client/radar", icon: Radar },
  { title: "Automação", url: "/client/automation", icon: Zap },
  { title: "Domínios", url: "/client/domains", icon: Globe },
  { title: "Integrações", url: "/client/integrations", icon: Plug },
  { title: "Leads", url: "/client/leads", icon: Users },
  { title: "Consumo", url: "/client/consumption", icon: BarChart3 },
  { title: "Marca & APIs", url: "/client/brand", icon: Paintbrush },
  { title: "Configurações", url: "/client/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile, blog } = useBlog();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="h-16 flex items-center px-space-6 border-b border-border">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-h3 font-semibold text-primary">Omniseen</span>
            <button onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
          </div>
        ) : (
          <button onClick={toggleSidebar} className="mx-auto text-primary font-bold text-body-lg">O</button>
        )}
      </SidebarHeader>

      <SidebarContent className="py-space-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink to={item.url} className="flex items-center gap-space-3 px-space-4 py-space-3 rounded-md text-body transition-colors hover:bg-accent" activeClassName="bg-primary-light text-primary font-medium">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {/* Admin link */}
              {profile?.is_admin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === "/admin"}>
                    <NavLink to="/admin" className="flex items-center gap-space-3 px-space-4 py-space-3 rounded-md text-body transition-colors hover:bg-accent" activeClassName="bg-primary-light text-primary font-medium">
                      <ShieldCheck className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>ADM Master</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-space-4">
        {!collapsed && (
          <div className="flex items-center gap-space-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-caption font-semibold">
              {profile?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-foreground truncate">{profile?.full_name || user?.email}</p>
              <p className="text-caption text-muted-foreground truncate">{blog?.platform_subdomain || ""}.omniseen.app</p>
            </div>
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground" title="Sair"><LogOut className="h-4 w-4" /></button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
