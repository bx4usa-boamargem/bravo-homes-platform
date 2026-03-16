import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "positive" | "neutral";
  description?: string;
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  variant = "neutral",
  description 
}: StatCardProps) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex items-center gap-4 group hover:shadow-md transition-all duration-300">
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-inner",
        variant === "positive" ? "bg-emerald-light text-emerald" : "bg-slate-50 text-slate-400"
      )}>
        <Icon size={24} />
      </div>
      
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {label}
          </p>
        </div>
        <p className="text-2xl font-bold text-text-primary tracking-tight">
          {value}
        </p>
        {description && (
          <p className="text-[10px] text-text-muted mt-0.5 font-medium">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
