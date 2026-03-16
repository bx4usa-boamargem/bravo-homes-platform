"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings2, 
  Smartphone, 
  History, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Histórico", icon: History, href: "/historico" },
  { label: "Configurar Alertas", icon: Settings2, href: "/configurar" },
  { label: "Meus Números", icon: Smartphone, href: "/numeros" },
];

const secondaryItems = [
  { label: "Configurações", icon: Settings, href: "/configuracoes" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-[60] bg-navy text-white p-2 rounded-md md:hidden shadow-lg"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={cn(
        "w-64 bg-navy text-white h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 md:translate-x-0 border-r border-white/5",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-emerald rounded flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">L</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight leading-none uppercase">Licitaí</span>
              <span className="text-[10px] font-medium text-white/50 leading-none mt-1">Inteligência Federal</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-4 text-white/70 hover:text-white md:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <div className="mb-8">
            <p className="px-3 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3">
              Navegação
            </p>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group",
                      isActive 
                        ? "bg-navy-light text-white font-medium border-l-4 border-emerald -ml-1 pl-2.5" 
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon size={18} className={cn(
                      "transition-colors",
                      isActive ? "text-emerald" : "group-hover:text-white"
                    )} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mb-8">
            <p className="px-3 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3">
              Sistema
            </p>
            <nav className="space-y-1">
              {secondaryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-white/60 hover:bg-white/5 hover:text-white rounded-md transition-colors group"
                >
                  <item.icon size={18} className="group-hover:text-white transition-colors" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 bg-navy-light/50 mt-auto border-t border-white/5">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-white/60 hover:text-white transition-colors text-sm group">
            <LogOut size={18} className="group-hover:text-red-400" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}
