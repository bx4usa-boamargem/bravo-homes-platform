"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, ChevronDown } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/configurar": "Configurar Alertas",
  "/numeros": "Meus Números",
  "/historico": "Histórico de Alertas",
  "/configuracoes": "Configurações",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="h-16 bg-white border-b border-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-xl font-medium text-text-primary capitalize pl-12 md:pl-0 mr-8 whitespace-nowrap">
          {title}
        </h1>
        
        <div className="hidden lg:flex items-center max-w-md w-full relative group">
          <Search className="absolute left-3 text-text-muted group-focus-within:text-emerald transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por número, órgão ou objeto..." 
            className="w-full bg-surface border border-border rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-text-secondary hover:bg-surface rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold border border-white/10 shadow-sm">
            BX
          </div>
          <ChevronDown size={14} className="text-text-muted group-hover:text-text-primary transition-colors" />
        </div>
      </div>
    </header>
  );
}
