"use client";

import { useState } from "react";
import { Lock, TrendingUp, Info, ExternalLink, BarChart3, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Briefing {
  id: string;
  data: string;
  titulo: string;
  orgao: string;
  referencia: number;
  analisados: number;
  mediaVenc: number;
  lanceMin: number;
  faixaSugerida: string;
  abertura: string;
  status: "futura" | "encerrada";
  resultado?: {
    ganhou: boolean;
    valor: number;
  };
}

const mockBriefings: Briefing[] = [
  {
    id: "1",
    data: "14/03/2026",
    titulo: "Aquisição de material médico-hospitalar",
    orgao: "Hospital Federal do RJ",
    referencia: 280000,
    analisados: 12,
    mediaVenc: -9.2,
    lanceMin: -14.1,
    faixaSugerida: "R$ 240k – R$ 255k",
    abertura: "amanhã 10:00",
    status: "futura"
  },
  {
    id: "2",
    data: "13/03/2026",
    titulo: "Serviços de limpeza predial",
    orgao: "Min. da Educação",
    referencia: 45000,
    analisados: 8,
    mediaVenc: -12.5,
    lanceMin: -18.2,
    faixaSugerida: "R$ 38.000 – R$ 41.000",
    abertura: "Encerrada",
    status: "encerrada",
    resultado: {
      ganhou: true,
      valor: 39500
    }
  }
];

export default function InteligenciaPage() {
  const [isPro, setIsPro] = useState(true); // Simulado

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-slate-50 border-2 border-dashed border-border rounded-xl p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-border">
            <Lock size={32} className="text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-text-primary">
              🔒 Inteligência de Mercado — Exclusivo Pro e Premium
            </h3>
            <p className="text-text-secondary max-w-md mx-auto">
              No dia anterior a cada licitação, você recebe no WhatsApp uma análise competitiva com lances históricos e faixa de preço recomendada.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-4">
            <div className="bg-white p-4 rounded-lg border border-border">
              <TrendingUp size={20} className="text-emerald mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Preço Alvo</p>
              <p className="text-sm text-text-primary">Saiba exatamente quanto os vencedores cobram.</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-border">
              <BarChart3 size={20} className="text-emerald mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Análise Histórica</p>
              <p className="text-sm text-text-primary">Analisamos centenas de editais similares.</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-border">
              <Trophy size={20} className="text-emerald mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Mais Vitórias</p>
              <p className="text-sm text-text-primary">Baseie seus lances em dados, não em palpites.</p>
            </div>
          </div>
          <button className="bg-emerald text-white px-8 py-3 rounded-md font-bold hover:bg-emerald/90 transition-colors shadow-lg">
            Fazer Upgrade para Pro — R$ 197/mês
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-medium text-text-primary">
          Inteligência de Mercado
        </h2>
        <p className="text-text-secondary">
          Análise competitiva das licitações que você vai disputar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockBriefings.map((briefing) => (
          <div key={briefing.id} className="bg-white border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="p-6 flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-semibold text-text-primary leading-tight hover:underline cursor-pointer">
                    {briefing.titulo}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    {briefing.orgao} · Abertura: {briefing.abertura}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                  {briefing.data}
                </span>
              </div>

              <div className="flex items-center gap-6 py-2 border-y border-slate-50">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Referência</p>
                   <p className="text-sm font-medium text-text-primary">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(briefing.referencia)}
                   </p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Analisados</p>
                   <p className="text-sm font-medium text-text-primary">{briefing.analisados} itens</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">Média Venc.</p>
                  <p className="text-lg font-bold text-emerald">{briefing.mediaVenc}%</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">Lance Mín.</p>
                  <p className="text-lg font-bold text-text-primary">{briefing.lanceMin}%</p>
                </div>
                <div className="bg-emerald/5 rounded-lg p-3 text-center border border-emerald/20">
                  <p className="text-[10px] font-bold text-emerald uppercase tracking-tight mb-1">Sucesso Alvo</p>
                  <p className="text-[11px] font-bold text-emerald truncate mt-1">{briefing.faixaSugerida}</p>
                </div>
              </div>

              {briefing.resultado && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Resultado:</span>
                  <span className={cn(
                    "inline-flex items-center gap-1 font-bold",
                    briefing.resultado.ganhou ? "text-emerald" : "text-slate-400"
                  )}>
                    {briefing.resultado.ganhou ? "✅ Ganhou · " : "Perdeu · "}
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(briefing.resultado.valor)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-border flex items-center justify-between">
              <button className="text-sm font-bold text-emerald hover:underline flex items-center gap-2">
                Ver briefing completo
                <Info size={14} />
              </button>
              <button className="text-xs font-medium text-slate-400 hover:text-text-primary flex items-center gap-1.5 transition-colors">
                <ExternalLink size={14} />
                Edital
              </button>
            </div>
          </div>
        ))}

        {/* Card de histórico insuficiente simulação */}
        <div className="bg-[#FEF9C3] border border-[#FDE047] rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#854D0E]">
            <Info size={20} />
            <h4 className="font-bold">Histórico insuficiente para análise</h4>
          </div>
          <p className="text-sm text-[#854D0E]/90 leading-relaxed">
            Não encontramos licitações similares suficientes no PNCP para gerar uma análise estatística confiável para este segmento hoje.
          </p>
          <p className="text-xs text-[#854D0E]/70 italic">
            Dica: pregões deste tipo costumam ter lances entre 5% e 15% abaixo do valor de referência.
          </p>
        </div>
      </div>
    </div>
  );
}
