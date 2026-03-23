import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useSystemStatus } from "@/hooks/admin/useSystemStatus";
import "@/styles/admin-tokens.css";

interface AdminLayoutProps {
  children: (props: { activeTab: string; setActiveTab: (t: string) => void }) => React.ReactNode;
}

const TABS = [
  { id: "p7", label: "AI Control Center ⭐" },
  { id: "p1", label: "Sistema" },
  { id: "p2", label: "Usuários & Equipes" },
  { id: "p3", label: "Motor de IA" },
  { id: "p4", label: "Conteúdo" },
  { id: "p5", label: "Leads & ROI" },
  { id: "p6", label: "Alertas & Logs" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [theme, setTheme] = useState(() => localStorage.getItem("omniseen-admin-theme") || "dark");
  const [activeTab, setActiveTab] = useState("p7");
  const [clock, setClock] = useState(new Date().toLocaleTimeString("pt-BR"));
  const { status } = useSystemStatus();

  useEffect(() => {
    localStorage.setItem("omniseen-admin-theme", theme);
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date().toLocaleTimeString("pt-BR")), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`admin-root theme-${theme} min-h-screen`}>
      {/* Topbar */}
      <header className="admin-card flex items-center justify-between px-4 py-2 rounded-none" style={{ borderBottom: "1px solid var(--admin-border)", borderRadius: 0 }}>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold" style={{ color: "var(--admin-cyan)" }}>◈ OMNISEEN</span>
          <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline" style={{ color: "var(--admin-muted)" }}>ADM MASTER / SALA DE CONTROLE</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="live-badge inline-block w-2 h-2 rounded-full" style={{ background: "var(--admin-green)" }} />
            <span className="font-semibold" style={{ color: "var(--admin-green)" }}>LIVE</span>
          </span>
          <span className="hidden md:inline" style={{ color: "var(--admin-muted)" }}>UPTIME: <span className="font-mono-data font-bold" style={{ color: "var(--admin-text)" }}>{status.uptime}%</span></span>
          <span className="hidden md:inline" style={{ color: "var(--admin-muted)" }}>AGENTES: <span className="font-mono-data font-bold" style={{ color: "var(--admin-text)" }}>{status.activeAgents}/8</span></span>
          <span className="font-mono-data font-bold hidden sm:inline" style={{ color: "var(--admin-text)" }}>{clock}</span>
          <button
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)" }}
          >
            {theme === "dark" ? <Moon className="h-4 w-4" style={{ color: "var(--admin-cyan)" }} /> : <Sun className="h-4 w-4" style={{ color: "var(--admin-yellow, #d97706)" }} />}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="px-4 py-2 flex gap-1 overflow-x-auto" style={{ background: "var(--admin-card)", borderBottom: "1px solid var(--admin-border)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab.id ? "var(--admin-cyan)" : "transparent",
              color: activeTab === tab.id ? "#0a0e1a" : "var(--admin-muted)",
              border: activeTab === tab.id ? "none" : "1px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="p-4 md:p-6 max-w-[1600px] mx-auto">
        {children({ activeTab, setActiveTab })}
      </main>
    </div>
  );
}
