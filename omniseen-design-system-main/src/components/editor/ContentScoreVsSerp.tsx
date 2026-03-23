import { useState, useEffect } from "react";
import { BarChart3, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ContentScoreVsSerpProps {
  articleId: string;
  blogId: string;
  focusKeyword: string;
  currentScore: number;
  wordCount: number;
}

interface SerpCompetitor {
  position: number;
  title: string;
  url: string;
  wordCount?: number;
  headings?: number;
}

export default function ContentScoreVsSerp({
  articleId,
  blogId,
  focusKeyword,
  currentScore,
  wordCount,
}: ContentScoreVsSerpProps) {
  const [competitors, setCompetitors] = useState<SerpCompetitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [avgWordCount, setAvgWordCount] = useState(0);

  const loadSerpData = async () => {
    setLoading(true);
    try {
      // Try to get stored SERP data from the article
      const { data: article } = await supabase
        .from("articles")
        .select("serp_data")
        .eq("id", articleId)
        .single();

      if (article?.serp_data) {
        const serpData = article.serp_data as any;
        const items = serpData.organic || serpData.results || serpData.items || [];

        const comps: SerpCompetitor[] = items.slice(0, 10).map((item: any, i: number) => ({
          position: i + 1,
          title: item.title || `Resultado ${i + 1}`,
          url: item.link || item.url || "",
          wordCount: item.word_count || item.wordCount || null,
          headings: item.headings_count || item.headings || null,
        }));

        setCompetitors(comps);

        // Calculate average word count from competitors
        const withWordCount = comps.filter((c) => c.wordCount);
        if (withWordCount.length > 0) {
          setAvgWordCount(
            Math.round(
              withWordCount.reduce((sum, c) => sum + (c.wordCount || 0), 0) / withWordCount.length,
            ),
          );
        }
      }

      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // Score comparison
  const scoreVsAvg = avgWordCount > 0 ? Math.round((wordCount / avgWordCount) * 100) : 0;
  const isAboveAvg = scoreVsAvg > 100;

  if (!loaded) {
    return (
      <div className="px-space-5 py-space-4">
        <div className="flex items-center gap-2 text-body font-semibold text-foreground mb-space-3">
          <BarChart3 className="h-4 w-4" />
          Content Score vs SERP
        </div>
        <p className="text-caption text-muted-foreground mb-space-3">
          Compare seu artigo com os 10 primeiros resultados do Google para "{focusKeyword}".
        </p>
        <Button variant="outline" size="sm" onClick={loadSerpData} disabled={loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando...</>
          ) : (
            <><TrendingUp className="h-4 w-4 mr-2" /> Analisar SERP</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="px-space-5 py-space-4">
      <div className="flex items-center gap-2 text-body font-semibold text-foreground mb-space-3">
        <BarChart3 className="h-4 w-4" />
        Content Score vs SERP
      </div>

      {/* Score comparison cards */}
      <div className="grid grid-cols-2 gap-2 mb-space-4">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
          <p className="text-tiny text-primary font-medium">Seu artigo</p>
          <p className="text-h3 font-bold text-primary">{wordCount}</p>
          <p className="text-tiny text-muted-foreground">palavras</p>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <p className="text-tiny text-muted-foreground font-medium">Média top 10</p>
          <p className="text-h3 font-bold text-foreground">{avgWordCount || "—"}</p>
          <p className="text-tiny text-muted-foreground">palavras</p>
        </div>
      </div>

      {/* Comparison indicator */}
      {avgWordCount > 0 && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-caption mb-space-4 ${
            isAboveAvg
              ? "bg-success/5 text-success border border-success/20"
              : "bg-warning/5 text-warning border border-warning/20"
          }`}
        >
          <TrendingUp className="h-4 w-4 shrink-0" />
          {isAboveAvg
            ? `Seu artigo tem ${scoreVsAvg - 100}% mais conteúdo que a média da SERP`
            : `Seu artigo tem ${100 - scoreVsAvg}% menos conteúdo que a média da SERP`}
        </div>
      )}

      {/* Top 10 list */}
      {competitors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-tiny text-muted-foreground font-medium uppercase tracking-wider mb-2">
            Top 10 — "{focusKeyword}"
          </p>
          {competitors.map((comp) => (
            <div
              key={comp.position}
              className="flex items-center gap-2 text-tiny p-1.5 rounded hover:bg-muted/50"
            >
              <span className="w-5 text-center text-muted-foreground font-mono font-bold">
                {comp.position}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate">{comp.title}</p>
                <p className="text-muted-foreground font-mono truncate">
                  {comp.url.replace(/^https?:\/\//, "").slice(0, 35)}
                </p>
              </div>
              {comp.wordCount && (
                <span className="text-muted-foreground font-mono shrink-0">
                  {comp.wordCount}w
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {competitors.length === 0 && (
        <p className="text-caption text-muted-foreground italic">
          Dados SERP não disponíveis. Gere um novo artigo para obter dados de análise competitiva.
        </p>
      )}
    </div>
  );
}
