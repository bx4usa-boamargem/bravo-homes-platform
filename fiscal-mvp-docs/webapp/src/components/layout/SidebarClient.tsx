"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Search, LogOut } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

const menuItems = [
  { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
  { label: "Empresas", href: "/client/empresas", icon: Building2 },
  { label: "Certidões", href: "/client/consultas", icon: Search, badgeKey: "certidoes" },
];

interface SidebarClientProps {
  pendenciasCount: number;
}

export default function SidebarClient({ pendenciasCount }: SidebarClientProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-primary text-white flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="bg-action p-1 rounded">F</span> FiscalMVP
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const badge = item.badgeKey === "certidoes" && pendenciasCount > 0 ? pendenciasCount : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-action text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm flex-1">{item.label}</span>
              {/* #5 — Badge de alertas vermelho */}
              {badge !== null && (
                <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <SignOutButton>
          <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:text-white transition-colors text-sm font-medium">
            <LogOut size={20} />
            Sair
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
