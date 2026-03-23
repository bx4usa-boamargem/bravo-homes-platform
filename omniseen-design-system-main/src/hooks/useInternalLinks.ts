// ── useInternalLinks ───────────────────────────────────────────────────────────
// Hook para sugerir links internos baseado em artigos publicados do mesmo blog.
//
// Analisa o conteúdo atual e busca artigos publicados com keywords similares
// para sugerir links internos relevantes.

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InternalLinkSuggestion {
  articleId: string;
  articleTitle: string;
  anchorText: string;
  url: string;
  focusKeyword: string;
  matchReason: string;
  alreadyLinked: boolean;
}

interface UseInternalLinksProps {
  blogId: string;
  currentArticleId: string;
}

export function useInternalLinks({ blogId, currentArticleId }: UseInternalLinksProps) {
  const [suggestions, setSuggestions] = useState<InternalLinkSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyze = useCallback(
    async (htmlContent: string) => {
      if (!blogId || !currentArticleId) return;
      setLoading(true);

      try {
        // Fetch published articles from same blog (excluding current)
        const { data: articles, error } = await supabase
          .from("articles")
          .select("id, title, slug, focus_keyword, secondary_keywords")
          .eq("blog_id", blogId)
          .eq("status", "published")
          .neq("id", currentArticleId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error || !articles) {
          setSuggestions([]);
          return;
        }

        // Normalize content for matching
        const normalizedContent = htmlContent
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        // Extract existing links from content
        const existingLinks = new Set<string>();
        const linkMatches = htmlContent.match(/href="[^"]*"/gi) || [];
        for (const link of linkMatches) {
          const url = link.replace(/href="([^"]*)"/i, "$1");
          existingLinks.add(url.toLowerCase());
        }

        const newSuggestions: InternalLinkSuggestion[] = [];

        for (const article of articles) {
          const keyword = article.focus_keyword?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
          const secondaryKws = (article.secondary_keywords || [])
            .map((k: string) => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

          const articleUrl = `/blog/${article.slug}`;
          const isAlreadyLinked = existingLinks.has(articleUrl.toLowerCase()) ||
            existingLinks.has(`/blog/${article.slug.toLowerCase()}`);

          // Match by focus keyword
          if (keyword && normalizedContent.includes(keyword)) {
            newSuggestions.push({
              articleId: article.id,
              articleTitle: article.title,
              anchorText: article.focus_keyword,
              url: articleUrl,
              focusKeyword: article.focus_keyword,
              matchReason: `Keyword "${article.focus_keyword}" encontrada no conteúdo`,
              alreadyLinked: isAlreadyLinked,
            });
            continue; // Don't double-count
          }

          // Match by secondary keywords
          for (const skw of secondaryKws) {
            if (skw && normalizedContent.includes(skw)) {
              newSuggestions.push({
                articleId: article.id,
                articleTitle: article.title,
                anchorText: skw,
                url: articleUrl,
                focusKeyword: article.focus_keyword,
                matchReason: `Keyword secundária "${skw}" encontrada`,
                alreadyLinked: isAlreadyLinked,
              });
              break;
            }
          }

          // Match by title words (fallback — at least 3 words matching)
          if (!newSuggestions.find((s) => s.articleId === article.id)) {
            const titleWords = article.title
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .split(/\s+/)
              .filter((w: string) => w.length > 3);

            const matchingWords = titleWords.filter((w: string) => normalizedContent.includes(w));
            if (matchingWords.length >= 3) {
              newSuggestions.push({
                articleId: article.id,
                articleTitle: article.title,
                anchorText: article.title,
                url: articleUrl,
                focusKeyword: article.focus_keyword,
                matchReason: `Tema similar (${matchingWords.length} termos em comum)`,
                alreadyLinked: isAlreadyLinked,
              });
            }
          }
        }

        // Sort: not linked first, then by match quality
        newSuggestions.sort((a, b) => {
          if (a.alreadyLinked !== b.alreadyLinked) return a.alreadyLinked ? 1 : -1;
          return 0;
        });

        setSuggestions(newSuggestions.slice(0, 10));
      } finally {
        setLoading(false);
      }
    },
    [blogId, currentArticleId],
  );

  const debouncedAnalyze = useCallback(
    (htmlContent: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => analyze(htmlContent), 2000);
    },
    [analyze],
  );

  return { suggestions, loading, analyze, debouncedAnalyze };
}
