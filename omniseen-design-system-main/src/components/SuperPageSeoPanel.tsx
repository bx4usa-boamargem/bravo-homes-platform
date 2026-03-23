import { useState, useMemo } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SuperPageSeoData {
  content: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
}

interface StructureMetrics {
  words: number;
  h2: number;
  paragraphs: number;
  images: number;
}

interface TermData {
  term: string;
  count: number;
  min: number;
  max: number;
}

function analyzeContent(data: SuperPageSeoData) {
  const html = data.content || "";
  const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = plain.split(/\s+/).filter(Boolean).length;
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const pCount = (html.match(/<p[\s>]/gi) || []).length;
  const imgCount = (html.match(/<img[\s>]/gi) || []).length;

  const structure: StructureMetrics = { words, h2: h2Count, paragraphs: pCount, images: imgCount };

  // Extract keywords from content
  const normalizedContent = plain.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const focusKw = (data.focusKeyword || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Count keyword occurrences
  const kwParts = focusKw.split(/\s+/).filter(Boolean);
  const allTerms: TermData[] = [];

  // Focus keyword as phrase
  if (focusKw) {
    const regex = new RegExp(focusKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const count = (normalizedContent.match(regex) || []).length;
    allTerms.push({ term: data.focusKeyword, count, min: 3, max: 8 });
  }

  // Individual keyword parts
  kwParts.forEach((part) => {
    if (part.length < 3) return;
    const regex = new RegExp(`\\b${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const count = (normalizedContent.match(regex) || []).length;
    allTerms.push({ term: part, count, min: 5, max: 15 });
  });

  // Extract common words from content (top terms)
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set(["de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas", "um", "uma", "uns", "umas", "o", "a", "os", "as", "e", "ou", "que", "com", "por", "para", "se", "não", "mais", "como", "mas", "ao", "sua", "seu", "the", "and", "for", "with", "you", "your", "our", "this", "that", "are", "from", "can", "will", "has", "have", "been", "all", "was", "were", "their", "which", "when", "what", "how", "its"]);
  normalizedContent.split(/\s+/).forEach((w) => {
    const clean = w.replace(/[^a-záàâãéèêíìîóòôõúùûç]/g, "");
    if (clean.length >= 4 && !stopWords.has(clean)) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  });

  const topTerms = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([term, count]) => ({
      term,
      count,
      min: Math.max(2, Math.round(count * 0.6)),
      max: Math.round(count * 1.4),
    }));

  // Extract headings
  const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const headingTerms = h2Matches.map((h) => {
    const text = h.replace(/<[^>]*>/g, "").trim();
    return { term: text, count: 1, min: 1, max: 1 };
  });

  // Meta analysis
  const metaTerms: TermData[] = [];
  if (data.metaTitle) metaTerms.push({ term: `Title: ${data.metaTitle.slice(0, 40)}...`, count: data.metaTitle.length, min: 30, max: 60 });
  if (data.metaDescription) metaTerms.push({ term: `Desc: ${data.metaDescription.slice(0, 40)}...`, count: data.metaDescription.length, min: 120, max: 160 });

  // Calculate score
  let score = 50;
  if (words > 1000) score += 10;
  if (words > 2000) score += 5;
  if (h2Count >= 5) score += 8;
  if (pCount >= 10) score += 5;
  if (imgCount >= 3) score += 7;
  if (data.metaTitle && data.metaTitle.length >= 30 && data.metaTitle.length <= 60) score += 5;
  if (data.metaDescription && data.metaDescription.length >= 120 && data.metaDescription.length <= 160) score += 5;
  if (focusKw && normalizedContent.includes(focusKw)) score += 5;
  score = Math.min(100, score);

  return { structure, score, keywords: [...allTerms, ...topTerms], headings: headingTerms, meta: metaTerms };
}

function SemiGauge({ score }: { score: number }) {
  const radius = 54;
  const stroke = 10;
  const half = Math.PI * radius;
  const offset = half - (score / 100) * half;
  const color = score >= 80 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--warning))" : "hsl(var(--error))";

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path d="M 10 75 A 54 54 0 0 1 130 75" fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} strokeLinecap="round" />
        <path
          d="M 10 75 A 54 54 0 0 1 130 75"
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={half}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="flex flex-col items-center -mt-10">
        <span className="text-caption" style={{ color }}>⚡ {score}</span>
        <span className="text-h2 font-bold text-foreground">{score}/100</span>
      </div>
    </div>
  );
}

function StructureCell({ label, value, min, max }: { label: string; value: number; min: number; max: number }) {
  const status = value < min ? "low" : value > max ? "high" : "ok";
  const color = status === "ok" ? "text-success" : status === "high" ? "text-error" : "text-warning";
  const arrow = status === "low" ? "↓" : status === "high" ? "↑" : "";

  return (
    <div className="text-center">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className={`text-h3 font-bold ${color}`}>
        {value} {arrow && <span className="text-body-sm">{arrow}</span>}
      </p>
      <p className="text-tiny text-muted-foreground">{min} - {max}</p>
    </div>
  );
}

function TermTag({ term, count, min, max }: TermData) {
  const status = count < min ? "low" : count > max ? "high" : "ok";
  const bg = status === "ok" ? "bg-success/10 text-success" : status === "high" ? "bg-error/10 text-error" : "bg-warning/10 text-warning";

  return (
    <span className={`inline-flex items-center gap-1 text-tiny font-medium px-2 py-1 rounded-full ${bg}`}>
      {term} <span className="font-bold">{count}/{min}-{max}</span>
    </span>
  );
}

export default function SuperPageSeoPanel({ data }: { data: SuperPageSeoData }) {
  const [termTab, setTermTab] = useState<"keywords" | "headings" | "meta">("keywords");

  const analysis = useMemo(() => analyzeContent(data), [data]);

  const termTabs = [
    { key: "keywords" as const, label: "Palavras-chave", count: analysis.keywords.length },
    { key: "headings" as const, label: "Títulos", count: analysis.headings.length },
    { key: "meta" as const, label: "Meta Tags", count: analysis.meta.length },
  ];

  const currentTerms = termTab === "keywords" ? analysis.keywords : termTab === "headings" ? analysis.headings : analysis.meta;

  return (
    <div className="bg-card border border-border rounded-lg p-space-5 space-y-space-5">
      {/* Score */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-space-2">
          <span className="text-body-sm font-semibold text-foreground">Pontuação de conteúdo</span>
          <Tooltip>
            <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent>Análise SEO baseada na estrutura e conteúdo da página</TooltipContent>
          </Tooltip>
        </div>
        <SemiGauge score={analysis.score} />
      </div>

      {/* Structure */}
      <div>
        <div className="flex items-center gap-1 mb-space-3">
          <span className="text-body-sm font-semibold text-foreground">Estrutura</span>
          <Tooltip>
            <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent>Métricas estruturais comparadas com benchmarks de concorrentes</TooltipContent>
          </Tooltip>
        </div>
        <div className="grid grid-cols-2 gap-space-3">
          <StructureCell label="Palavras" value={analysis.structure.words} min={2000} max={5000} />
          <StructureCell label="H2" value={analysis.structure.h2} min={5} max={15} />
          <StructureCell label="Parágrafos" value={analysis.structure.paragraphs} min={15} max={50} />
          <StructureCell label="Imagens" value={analysis.structure.images} min={3} max={10} />
        </div>
      </div>

      {/* Terms */}
      <div>
        <div className="flex items-center gap-1 mb-space-3">
          <span className="text-body-sm font-semibold text-foreground">Termos</span>
          <Tooltip>
            <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent>Distribuição de palavras-chave, títulos e meta tags</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex gap-space-1 border-b border-border mb-space-3">
          {termTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTermTab(tab.key)}
              className={`text-tiny font-medium px-3 py-1.5 border-b-2 transition-colors ${
                termTab === tab.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} <span className="ml-0.5 text-muted-foreground">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-space-2 max-h-[200px] overflow-y-auto">
          {currentTerms.length === 0 ? (
            <p className="text-caption text-muted-foreground">Nenhum termo encontrado</p>
          ) : (
            currentTerms.map((t, i) => <TermTag key={i} {...t} />)
          )}
        </div>
      </div>
    </div>
  );
}
