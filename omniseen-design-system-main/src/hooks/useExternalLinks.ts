import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ExternalLinkSuggestion {
  url: string;
  title: string;
  snippet: string;
  anchorText: string;
  relevanceScore: number;
  alreadyLinked: boolean;
}

interface UseExternalLinksProps {
  blogId: string;
  focusKeyword: string;
}

export function useExternalLinks({ blogId, focusKeyword }: UseExternalLinksProps) {
  const [suggestions, setSuggestions] = useState<ExternalLinkSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyze = useCallback(
    async (htmlContent: string) => {
      if (!blogId || !focusKeyword) return;
      setLoading(true);

      try {
        // Extract existing external links from content
        const existingLinks = new Set<string>();
        const linkRegex = /href="(https?:\/\/[^"]*)"/gi;
        let match;
        while ((match = linkRegex.exec(htmlContent)) !== null) {
          existingLinks.add(match[1].toLowerCase());
        }

        // Try to get SERP data from the article's stored serp_data
        // This uses data from the original generation SERP analysis
        const { data: articles } = await supabase
          .from("articles")
          .select("serp_data")
          .eq("blog_id", blogId)
          .eq("focus_keyword", focusKeyword)
          .limit(1);

        let serpResults: ExternalLinkSuggestion[] = [];

        if (articles?.[0]?.serp_data) {
          const serpData = articles[0].serp_data as any;
          const items = serpData.organic || serpData.results || serpData.items || [];

          serpResults = items
            .filter((item: any) => item.link || item.url)
            .slice(0, 10)
            .map((item: any, index: number) => {
              const url = item.link || item.url || "";
              return {
                url,
                title: item.title || "Fonte externa",
                snippet: item.snippet || item.description || "",
                anchorText: item.title?.slice(0, 60) || focusKeyword,
                relevanceScore: Math.max(10, 100 - index * 10),
                alreadyLinked: existingLinks.has(url.toLowerCase()),
              };
            });
        }

        // If no SERP data, generate authority source suggestions
        if (serpResults.length === 0) {
          const authoritySources = generateAuthoritySuggestions(focusKeyword);
          serpResults = authoritySources.map((source) => ({
            ...source,
            alreadyLinked: existingLinks.has(source.url.toLowerCase()),
          }));
        }

        // Sort: not linked first
        serpResults.sort((a, b) => {
          if (a.alreadyLinked !== b.alreadyLinked) return a.alreadyLinked ? 1 : -1;
          return b.relevanceScore - a.relevanceScore;
        });

        setSuggestions(serpResults.slice(0, 8));
      } finally {
        setLoading(false);
      }
    },
    [blogId, focusKeyword],
  );

  const debouncedAnalyze = useCallback(
    (htmlContent: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => analyze(htmlContent), 3000);
    },
    [analyze],
  );

  return { suggestions, loading, analyze, debouncedAnalyze };
}

// Generate fallback authority source suggestions based on keyword topic
function generateAuthoritySuggestions(keyword: string): Omit<ExternalLinkSuggestion, "alreadyLinked">[] {
  const kw = keyword.toLowerCase();

  const sources: Omit<ExternalLinkSuggestion, "alreadyLinked">[] = [];

  // Marketing / SEO related
  if (kw.includes("seo") || kw.includes("marketing") || kw.includes("google")) {
    sources.push(
      { url: "https://developers.google.com/search/docs", title: "Google Search Central", snippet: "Documentação oficial do Google para SEO", anchorText: "Google Search Central", relevanceScore: 95 },
      { url: "https://moz.com/beginners-guide-to-seo", title: "Moz SEO Guide", snippet: "Guia completo de SEO para iniciantes", anchorText: "guia de SEO da Moz", relevanceScore: 90 },
      { url: "https://ahrefs.com/blog", title: "Ahrefs Blog", snippet: "Blog de SEO e marketing digital", anchorText: "Ahrefs Blog", relevanceScore: 85 },
    );
  }

  // Technology
  if (kw.includes("tecnologia") || kw.includes("software") || kw.includes("programação")) {
    sources.push(
      { url: "https://www.techcrunch.com", title: "TechCrunch", snippet: "Notícias de tecnologia", anchorText: "TechCrunch", relevanceScore: 90 },
    );
  }

  // Business
  if (kw.includes("negócio") || kw.includes("empresa") || kw.includes("empreendedorismo")) {
    sources.push(
      { url: "https://hbr.org", title: "Harvard Business Review", snippet: "Artigos sobre gestão e negócios", anchorText: "Harvard Business Review", relevanceScore: 95 },
      { url: "https://www.sebrae.com.br", title: "Sebrae", snippet: "Portal do empreendedor brasileiro", anchorText: "Sebrae", relevanceScore: 90 },
    );
  }

  // Generic high-authority sources
  if (sources.length < 3) {
    sources.push(
      { url: "https://pt.wikipedia.org/wiki/" + encodeURIComponent(keyword), title: `Wikipedia: ${keyword}`, snippet: `Artigo da Wikipedia sobre ${keyword}`, anchorText: keyword, relevanceScore: 70 },
      { url: "https://scholar.google.com/scholar?q=" + encodeURIComponent(keyword), title: "Google Scholar", snippet: "Artigos acadêmicos relacionados", anchorText: "estudos acadêmicos", relevanceScore: 65 },
    );
  }

  return sources;
}
