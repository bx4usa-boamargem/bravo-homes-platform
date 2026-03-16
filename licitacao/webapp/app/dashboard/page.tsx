import { 
  Bell, 
  Files, 
  AlertTriangle, 
  CircleDot,
  TrendingDown,
  Trophy,
  ArrowUpRight,
  Plus
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            Dashboard
          </h2>
          <p className="text-sm text-text-secondary">
            Visão geral do seu monitoramento de licitações
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-emerald text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium hover:bg-emerald/90 transition-all shadow-sm">
            <Plus size={18} />
            Configurar Filtro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Alertas Hoje" 
          value={0} 
          icon={Bell} 
        />
        <StatCard 
          label="Alertas no Mês" 
          value={12} 
          icon={CircleDot} 
        />
        <StatCard 
          label="Participações" 
          value={9} 
          icon={Trophy} 
        />
        <StatCard 
          label="Vitórias Confirmadas" 
          value={3} 
          icon={Trophy} 
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Alertas */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Volume de Alertas</h3>
                  <p className="text-[10px] text-text-muted font-medium">Alertas por mês em 2024</p>
                </div>
              </div>
              <div className="h-48 flex items-end gap-3 px-2">
                {[40, 60, 50, 45, 80, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-100/50 rounded-t-sm relative group cursor-pointer hover:bg-emerald/10 transition-colors min-w-[20px]">
                    <div 
                      style={{ height: `${h}%` }} 
                      className="absolute bottom-0 w-full bg-[#10B981] rounded-t-sm transition-all group-hover:brightness-110"
                    ></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
              </div>
            </div>

            {/* Gráfico de Linha - ROI */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">ROI Projetado</h3>
                  <p className="text-[10px] text-text-muted font-medium">Valor total de contratos ganhos (R$)</p>
                </div>
              </div>
              <div className="h-48 relative flex items-center justify-center border-b border-l border-slate-100">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,70 L20,60 L40,65 L60,45 L80,40 L100,30" fill="none" stroke="#10B981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <circle cx="0" cy="70" r="1.5" fill="#10B981" />
                  <circle cx="20" cy="60" r="1.5" fill="#10B981" />
                  <circle cx="40" cy="65" r="1.5" fill="#10B981" />
                  <circle cx="60" cy="45" r="1.5" fill="#10B981" />
                  <circle cx="80" cy="40" r="1.5" fill="#10B981" />
                  <circle cx="100" cy="30" r="1.5" fill="#10B981" />
                </svg>
              </div>
              <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-sm font-bold text-text-primary mb-6 uppercase tracking-wider">Status das Minhas Participações</h3>
            <div className="space-y-6">
              {[
                { label: "Vitórias Confirmadas", val: 33, color: "bg-emerald" },
                { label: "Participações em Aberto", val: 45, color: "bg-navy" },
                { label: "Não Ganhamos", val: 22, color: "bg-slate-400" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", item.color)}></div>
                      <span className="text-text-primary">{item.label}</span>
                    </div>
                    <span className="text-text-primary">{item.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${item.val}%` }} className={cn("h-full rounded-full transition-all duration-1000", item.color)}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
