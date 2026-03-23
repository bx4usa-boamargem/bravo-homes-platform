import { useState } from "react";
import { Check, X, Loader2, ArrowUp, ArrowDown, ThumbsUp } from "lucide-react";
import type { SeoScoreResult } from "@/hooks/useSeoScore";

interface SeoScorePanelProps {
  score: SeoScoreResult | null;
  loading: boolean;
}

function SemiGauge({ value }: { value: number }) {
  const size = 180;
  const strokeWidth = 14;
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const pct = Math.min(1, Math.max(0, value / 100));

  const getPoint = (p: number) => {
    const angle = Math.PI - p * Math.PI;
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };

  const arcPath = (from: number, to: number) => {
    const s = getPoint(from);
    const e = getPoint(to);
    const largeArc = to - from > 0.5 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  // Gradient segments: red → orange → yellow → green
  const bgSegments = [
    { start: 0, end: 0.25, color: "hsl(0 84% 60% / 0.2)" },
    { start: 0.25, end: 0.5, color: "hsl(25 90% 54% / 0.2)" },
    { start: 0.5, end: 0.75, color: "hsl(38 92% 50% / 0.2)" },
    { start: 0.75, end: 1, color: "hsl(160 84% 39% / 0.2)" },
  ];

  const activeColor = pct >= 0.8 ? "hsl(var(--success))" : pct >= 0.6 ? "hsl(var(--warning))" : pct >= 0.4 ? "hsl(25 90% 54%)" : "hsl(var(--error))";

  // Needle
  const needleAngle = Math.PI - pct * Math.PI;
  const needleLen = r - 20;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center relative">
      <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
        {/* Background arc segments */}
        {bgSegments.map((seg, i) => (
          <path key={i} d={arcPath(seg.start, seg.end)} fill="none" stroke={seg.color} strokeWidth={strokeWidth} strokeLinecap="butt" />
        ))}
        {/* Active arc */}
        {pct > 0.005 && (
          <path d={arcPath(0, pct)} fill="none" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill="hsl(var(--foreground))" />
        {/* Score text */}
        <text x={cx} y={cy - 22} textAnchor="middle" className="text-[36px] font-bold" fill="currentColor">{value}/100</text>
      </svg>
    </div>
  );
}

function StructureCell({ label, value, range, status }: { label: string; value: number; range: string; status: "ok" | "high" | "low" }) {
  const Arrow = status === "low" ? ArrowDown : status === "high" ? ArrowDown : null;
  const arrowColor = status === "ok" ? "text-success" : status === "high" ? "text-error" : "text-warning";
  const valueColor = status === "ok" ? "text-success" : status === "high" ? "text-error" : "text-warning";

  return (
    <div className="flex flex-col items-center py-3">
      <span className="text-caption text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 mt-1">
        <span className={`text-h3 font-bold ${valueColor}`}>{value}</span>
        {status !== "ok" && (
          <ArrowDown className={`h-3.5 w-3.5 ${arrowColor}`} />
        )}
      </div>
      <span className="text-tiny text-muted-foreground">{range}</span>
    </div>
  );
}

function getStructureStatus(value: number, range: string): "ok" | "high" | "low" {
  const [min, max] = range.split("-").map(s => parseInt(s.trim()));
  if (value >= min && value <= max) return "ok";
  if (value < min) return "low";
  return "high";
}

function TermTag({ term, count, max, status }: { term: string; count: number; max: number; status: "ok" | "low" | "missing" }) {
  const styles = {
    ok: "bg-success-light text-success border border-success/20",
    low: "bg-warning-light text-warning border border-warning/20",
    missing: "bg-error-light text-error border border-error/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-tiny font-medium ${styles[status]}`}>
      {term} <span className="opacity-60">{count}/{max}</span>
    </span>
  );
}

const termTabs = [
  { key: "keywords", label: "Palavras-chave" },
  { key: "headings", label: "Títulos" },
  { key: "meta", label: "Meta Tags" },
] as const;

export default function SeoScorePanel({ score, loading }: SeoScorePanelProps) {
  const [activeTermTab, setActiveTermTab] = useState<"keywords" | "headings" | "meta">("keywords");

  if (loading && !score) {
    return (
      <div className="h-full flex items-center justify-center bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!score) {
    return (
      <div className="h-full flex items-center justify-center bg-card p-space-6">
        <p className="text-body-sm text-muted-foreground text-center">Comece a editar para ver o score SEO</p>
      </div>
    );
  }

  const checklist = score.issues ?? [];
  const recommendations = score.recommendations ?? [];
  const passedCount = checklist.filter((c) => c.passed).length;
  const terms = score.terms;
  const structure = score.structure;

  return (
    <div className="h-full overflow-auto bg-card">
      {/* Header */}
      <div className="px-space-5 pt-space-5 pb-space-3 border-b border-border">
        <div className="flex items-center justify-between mb-space-3">
          <h3 className="text-body font-semibold text-foreground">Pontuação de conteúdo</h3>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        
        {/* Semicircular Gauge */}
        <SemiGauge value={score.overall_score} />

        {/* Sub-scores */}
        <div className="grid grid-cols-4 gap-1 mt-space-2 text-center">
          <div>
            <p className="text-tiny text-muted-foreground">Keyword</p>
            <p className="text-body-sm font-semibold text-foreground">{score.keyword_score}</p>
          </div>
          <div>
            <p className="text-tiny text-muted-foreground">Meta</p>
            <p className="text-body-sm font-semibold text-foreground">{score.meta_score}</p>
          </div>
          <div>
            <p className="text-tiny text-muted-foreground">Estrutura</p>
            <p className="text-body-sm font-semibold text-foreground">{score.structure_score}</p>
          </div>
          <div>
            <p className="text-tiny text-muted-foreground">Leitura</p>
            <p className="text-body-sm font-semibold text-foreground">{score.readability_score}</p>
          </div>
        </div>
      </div>

      {/* Structure Block */}
      {structure && (
        <div className="px-space-5 py-space-4 border-b border-border">
          <h4 className="text-body font-semibold text-foreground mb-space-2">Estrutura</h4>
          <div className="grid grid-cols-2 border border-border rounded-lg overflow-hidden">
            <div className="border-r border-b border-border">
              <StructureCell label="Palavras" value={structure.words} range="1000 - 2500" status={getStructureStatus(structure.words, "1000-2500")} />
            </div>
            <div className="border-b border-border">
              <StructureCell label="H2" value={structure.h2_count} range="3 - 8" status={getStructureStatus(structure.h2_count, "3-8")} />
            </div>
            <div className="border-r border-border">
              <StructureCell label="Parágrafos" value={structure.paragraphs} range="5 - 20" status={getStructureStatus(structure.paragraphs, "5-20")} />
            </div>
            <div>
              <StructureCell label="Imagens" value={structure.images} range="1 - 5" status={getStructureStatus(structure.images, "1-5")} />
            </div>
          </div>
        </div>
      )}

      {/* Terms Block */}
      {terms && (
        <div className="px-space-5 py-space-4 border-b border-border">
          <h4 className="text-body font-semibold text-foreground mb-space-3">Termos</h4>
          {/* Tabs */}
          <div className="flex border-b border-border mb-space-3">
            {termTabs.map((t) => {
              const count = terms[t.key]?.length ?? 0;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTermTab(t.key)}
                  className={`flex items-center gap-1.5 px-space-3 py-space-2 text-tiny font-medium border-b-2 transition-colors -mb-px ${
                    activeTermTab === t.key
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  <span className={`text-tiny px-1.5 py-0.5 rounded-full ${
                    activeTermTab === t.key ? "bg-primary-light text-primary" : "bg-muted text-muted-foreground"
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {terms[activeTermTab].map((t, i) => (
              <TermTag key={i} {...t} />
            ))}
            {terms[activeTermTab].length === 0 && (
              <p className="text-caption text-muted-foreground py-space-2">Nenhum termo analisado</p>
            )}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="px-space-5 py-space-4 border-b border-border">
        <h4 className="text-body font-semibold text-foreground mb-space-3">
          Checklist SEO
          <span className="text-caption text-muted-foreground ml-space-2 font-normal">{passedCount}/{checklist.length}</span>
        </h4>
        <div className="space-y-2.5">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`h-[18px] w-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                item.passed ? "bg-success-light text-success" : "bg-error-light text-error"
              }`}>
                {item.passed ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
              </div>
              <span className={`text-tiny leading-snug ${item.passed ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="px-space-5 py-space-4">
          <h4 className="text-body font-semibold text-foreground mb-space-3">Recomendações</h4>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-tiny text-muted-foreground leading-snug">
                <span className="text-warning mt-0.5 shrink-0">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
