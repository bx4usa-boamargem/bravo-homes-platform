"use client";

import { useState, useMemo } from "react";
import { Search, Filter, FileDown } from "lucide-react";

interface Consulta {
  id: string;
  created_at: string;
  status: string;
  empresa: string;
  cnpj: string;
  pendencias: unknown;
  diagnostico?: string;
  pdf_url?: string;
}

const formatCnpj = (cnpj: string) =>
  cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

// #2 & #3 — STATUS BADGE REDESENHADO (PENDENTE=VERMELHO, FALHA=CINZA)
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

// #4 — DIAGNÓSTICO TRUNCADO (MÁX 50 CHARS) COM TOOLTIP
const DiagnosticoCell = ({ text }: { text?: string }) => {
  if (!text) return <span className="text-xs text-slate-300">—</span>;
  const truncated = text.length > 50 ? text.slice(0, 50) + "..." : text;
  return (
    <span className="text-[13px] text-text-secondary leading-relaxed" title={text}>
      {truncated}
    </span>
  );
};

export default function ConsultasList({ initialConsultas }: { initialConsultas: Consulta[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return initialConsultas.filter(c =>
      c.empresa.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj.includes(search.replace(/\D/g, ""))
    );
  }, [initialConsultas, search]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por CNPJ ou nome da empresa..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
          />
        </div>
        <button className="h-10 px-4 rounded-lg border border-border bg-white text-text-primary text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <Filter size={18} />
          Filtrar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-slate-50/50">
              <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest">Data / Hora</th>
              <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest">Empresa</th>
              <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest">Status</th>
              {/* #4 — COLUNA DIAGNÓSTICO */}
              <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest">Diagnóstico</th>
              <th className="p-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest text-center">Doc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/30 transition-all border-b border-border/50">
                  <td className="p-4 text-sm text-text-secondary font-mono whitespace-nowrap">
                    {new Date(c.created_at).toLocaleString('pt-BR', {
                       day: '2-digit', month: '2-digit', year: '2-digit', 
                       hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-text-primary">{c.empresa}</p>
                    <p className="text-xs text-text-secondary font-mono">{formatCnpj(c.cnpj)}</p>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-4 max-w-[300px]">
                    <DiagnosticoCell text={c.diagnostico} />
                  </td>
                  <td className="p-4 text-center">
                    {/* #4 — LINK PDF AZUL COM ÍCONE SETA ABAIXO */}
                    {c.pdf_url ? (
                      <a
                        href={c.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-action hover:underline"
                        title="Baixar Certidão"
                      >
                        <FileDown size={14} />
                        PDF
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300 font-bold">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-12 text-center text-sm text-text-secondary">
                  {search ? "Nenhuma consulta encontrada para esta busca." : "Nenhum histórico de certidão disponível ainda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
