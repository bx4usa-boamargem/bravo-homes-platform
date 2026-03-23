import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, FileText, Radar, Zap, Settings, MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import {
  Globe, Plug, Users, BarChart3,
} from "lucide-react";

const primaryItems = [
  { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard },
  { title: "Artigos", url: "/client/articles", icon: FileText },
  { title: "Radar", url: "/client/radar", icon: Radar },
  { title: "Automação", url: "/client/automation", icon: Zap },
];

const moreItems = [
  { title: "Super Pages", url: "/client/landing-pages", icon: Zap },
  { title: "Domínios", url: "/client/domains", icon: Globe },
  { title: "Integrações", url: "/client/integrations", icon: Plug },
  { title: "Leads", url: "/client/leads", icon: Users },
  { title: "Consumo", url: "/client/consumption", icon: BarChart3 },
  { title: "Configurações", url: "/client/settings", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-xl p-space-4 animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-space-3">
              {moreItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    className={`flex flex-col items-center gap-1 p-space-3 rounded-lg transition-colors ${
                      isActive ? "bg-primary-light text-primary" : "text-muted-foreground hover:bg-accent"
                    }`}
                    activeClassName=""
                    onClick={() => setShowMore(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[11px] font-medium">{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {primaryItems.map((item) => {
            const isActive = location.pathname.startsWith(item.url);
            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={`flex flex-col items-center gap-0.5 px-space-3 py-space-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                activeClassName=""
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                <span className="text-[10px] font-medium">{item.title}</span>
              </NavLink>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 px-space-3 py-space-2 transition-colors ${
              showMore ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
