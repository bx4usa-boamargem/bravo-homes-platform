import { getDashboardStats, getRecentConsultas } from "@/actions/dashboard";
import { 
  AlertCircle, 
  XCircle, 
  Hexagon
} from "lucide-react";

const formatCnpj = (cnpj: string) =>
  cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

// #2 & #3 — STATUS BADGE REDESENHADO (IDÊNTICO AOS PRINTS)
const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string; bg: string; dot: string; text: string }> = {
    limpo: { 
      label: "Limpo", 
      bg: "bg-green-50 border border-green-100", 
      dot: "bg-green-500", 
      text: "text-green-700" 
    },
    pendente: { 
      label: "Pendência", 
      bg: "bg-red-50 border border-red-100", 
      dot: "bg-red-500", 
      text: "text-red-700" 
    },
    falha: { 
      label: "Indisponível", 
      bg: "bg-slate-50 border border-slate-200", 
      dot: "bg-slate-400", 
      text: "text-slate-600" 
    },
    verificacao_manual: { 
      label: "Manual", 
      bg: "bg-blue-50 border border-blue-100", 
      dot: "bg-blue-400", 
      text: "text-blue-700" 
    },
    indisponivel: { 
      label: "Indisponível", 
      bg: "bg-slate-50 border border-slate-200", 
      dot: "bg-slate-400", 
      text: "text-slate-600" 
    },
  };

  const config = configs[status] || configs.indisponivel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

// #1 — METRIC CARD (ÍCONE COLORIDO + CONTEXTO DE COR)
const MetricCard = ({
  label, value, iconBg, iconColor, icon: Icon,
}: { label: string; value: number; iconBg: string; iconColor: string; icon: React.ElementType }) => (
  <div className="bg-white p-6 rounded-xl border border-border flex items-center gap-4 transition-all hover:shadow-md">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      <Icon size={20} className={iconColor} />
    </div>
    <div>
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-text-primary mt-0.5">{value}</p>
    </div>
  </div>
);

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const recentConsultas = await getRecentConsultas();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm">Visão geral do monitoramento fiscal hoje.</p>
      </div>

      {/* #1 — Cards com ícone + cores suaves conforme solicitado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          label="Empresas Monitoradas"
          value={stats.empresasCount}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          icon={Hexagon}
        />
        <MetricCard
          label="Pendências Encontradas"
          value={stats.pendenciasCount}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          icon={AlertCircle}
        />
        <MetricCard
          label="Falhas na Última Run"
          value={stats.falhasCount}
          iconBg="bg-slate-100"
          iconColor="text-slate-500"
          icon={XCircle}
        />
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-white">
          <h3 className="font-semibold text-primary">Últimas Consultas</h3>
          <a href="/client/consultas" className="text-sm font-medium text-action hover:underline">Ver todas →</a>
        </div>

        {recentConsultas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-border">
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-widest">Data / Hora</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-widest">Empresa</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentConsultas.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-4 text-sm text-text-secondary font-mono">
                      {new Date(c.created_at).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-text-primary">{c.empresa}</p>
                      <p className="text-xs text-text-secondary font-mono">{formatCnpj(c.cnpj)}</p>
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-text-secondary text-sm font-medium">
              Nenhuma consulta realizada. As consultas são executadas automaticamente às 07:30.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
