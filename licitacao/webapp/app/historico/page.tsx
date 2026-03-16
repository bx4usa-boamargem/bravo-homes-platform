"use client";

import { useState, Fragment } from "react";
import { Search, Filter, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoricAlert {
  id: string;
  data: string;
  titulo: string;
  orgao: string;
  valor: number | null;
  prazo: string;
  status: "enviado" | "falha" | "pulado";
  uf: string;
  modalidade: string;
  objeto: string;
}

const mockAlerts: HistoricAlert[] = [
  {
    id: "1",
    data: "14/03/26",
    titulo: "Aquisição de material médico-hospitalar (Seringas e Agulhas)",
    orgao: "Hospital Federal do Rio de Janeiro",
    valor: 280000,
    prazo: "20/03/26",
    status: "enviado",
    uf: "RJ",
    modalidade: "Pregão Eletrônico",
    objeto: "Registro de preços para eventual aquisição de materiais de consumo médico-hospitalar (seringas hipodérmicas e agulhas descartáveis) para atender as necessidades do Hospital Federal do Rio de Janeiro."
  },
  {
    id: "2",
    data: "13/03/26",
    titulo: "Serviços de limpeza predial e conservação",
    orgao: "Ministério da Educação - MEC",
    valor: 45000,
    prazo: "18/03/26",
    status: "enviado",
    uf: "DF",
    modalidade: "Dispensa Eletrônica",
    objeto: "Contratação de empresa especializada na prestação de serviços continuados de limpeza, conservação e higienização predial, com fornecimento de materiais e equipamentos."
  },
  {
    id: "3",
    data: "12/03/26",
    titulo: "Fornecimento de equipamentos de proteção individual (EPI)",
    orgao: "Secretaria de Saúde de São Paulo",
    valor: null,
    prazo: "15/03/26",
    status: "falha",
    uf: "SP",
    modalidade: "Pregão Eletrônico",
    objeto: "Aquisição de equipamentos de proteção individual para os profissionais da rede estadual de saúde."
  }
];

export default function HistoricoPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-medium text-text-primary">
          Histórico de Alertas
        </h2>
        <p className="text-text-secondary">
          Todas as licitações que encontramos para você.
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título ou órgão..."
            className="w-full bg-white border border-border rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-border text-text-primary px-4 py-2 rounded-md font-medium hover:bg-slate-50 transition-colors text-sm">
          <Filter size={18} className="text-slate-400" />
          Filtrar por data
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-border">
              <th className="px-6 py-3 font-semibold w-24">Data</th>
              <th className="px-6 py-3 font-semibold">Licitação</th>
              <th className="px-6 py-3 font-semibold">Valor Est.</th>
              <th className="px-6 py-3 font-semibold">Prazo</th>
              <th className="px-6 py-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockAlerts.map((alert) => (
              <Fragment key={alert.id}>
                <tr 
                  onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                  className={cn(
                    "hover:bg-slate-50 transition-colors cursor-pointer",
                    expandedId === alert.id && "bg-slate-50/80"
                  )}
                >
                  <td className="px-6 py-4 text-sm text-text-secondary">{alert.data}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-text-primary truncate max-w-[400px]">
                      {alert.titulo}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">{alert.orgao}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-text-primary">
                    {alert.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(alert.valor) : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{alert.prazo}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        alert.status === "enviado" ? "bg-green-100 text-green-800" :
                        alert.status === "falha" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {alert.status === "enviado" ? "✓ Enviado" : alert.status === "falha" ? "✗ Falha" : "Pulado"}
                      </span>
                      {expandedId === alert.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </td>
                </tr>
                {expandedId === alert.id && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="px-12 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Objeto Completo</h5>
                            <p className="text-sm text-text-primary leading-relaxed">{alert.objeto}</p>
                          </div>
                          <div className="flex gap-8">
                            <div>
                               <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">UF</h5>
                               <p className="text-sm text-text-primary">{alert.uf}</p>
                            </div>
                            <div>
                               <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Modalidade</h5>
                               <p className="text-sm text-text-primary">{alert.modalidade}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col justify-end items-end gap-4">
                           <button className="flex items-center gap-2 bg-white border border-border text-text-primary px-4 py-2 rounded-md font-medium hover:bg-slate-50 transition-colors text-sm shadow-sm">
                             Acessar Edital Oficial
                             <ExternalLink size={14} className="text-emerald" />
                           </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
