import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SeoScoreResult {
  overall_score: number;
  keyword_score: number;
  readability_score: number;
  structure_score: number;
  meta_score: number;
  issues: { label: string; passed: boolean }[] | null;
  recommendations: string[] | null;
  terms?: {
    keywords: { term: string; count: number; max: number; status: "ok" | "low" | "missing" }[];
    headings: { term: string; count: number; max: number; status: "ok" | "low" | "missing" }[];
    meta: { term: string; count: number; max: number; status: "ok" | "low" | "missing" }[];
  };
  structure?: {
    words: number;
    h2_count: number;
    paragraphs: number;
    images: number;
  };
}

interface CalculateParams {
  article_id: string;
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  slug: string;
}

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ");

const normalizeSeoText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractTagTexts = (html: string, tag: "h1" | "h2" | "p") => {
  const matches = html.match(new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, "gis")) || [];
  return matches.map((item) => normalizeSeoText(stripHtml(item)));
};

const countOccurrences = (content: string, term: string) => {
  if (!term) return 0;
  let count = 0;
  let from = 0;
  while (true) {
    const idx = content.indexOf(term, from);
    if (idx === -1) break;
    count += 1;
    from = idx + term.length;
  }
  return count;
};

export function useSeoScore() {
  const [score, setScore] = useState<SeoScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculate = useCallback(async (params: CalculateParams) => {
    setLoading(true);
    try {
      const textContent = stripHtml(params.content);
      const normalizedContent = normalizeSeoText(textContent);
      const normalizedTitle = normalizeSeoText(params.title);
      const normalizedMetaTitle = normalizeSeoText(params.meta_title);
      const normalizedMetaDesc = normalizeSeoText(params.meta_description);
      const normalizedKeyword = normalizeSeoText(params.focus_keyword);
      const normalizedSlug = normalizeSeoText(params.slug).replace(/\s+/g, "-");
      const normalizedKeywordSlug = normalizedKeyword.replace(/\s+/g, "-");

      const words = textContent.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const h2Matches = params.content.match(/<h2[^>]*>/gi) || [];
      const pMatches = params.content.match(/<p[^>]*>/gi) || [];
      const imgMatches = params.content.match(/<img[^>]*>/gi) || [];

      const h1Texts = extractTagTexts(params.content, "h1");
      const h2Texts = extractTagTexts(params.content, "h2");
      const paragraphTexts = extractTagTexts(params.content, "p");
      const firstParagraphText = paragraphTexts[0] || normalizeSeoText(textContent.substring(0, 500));

      const keywordInTitle = normalizedKeyword.length > 0 && normalizedTitle.includes(normalizedKeyword);
      const keywordInH1 = normalizedKeyword.length > 0 && h1Texts.some((h1) => h1.includes(normalizedKeyword));
      const keywordInH2 = normalizedKeyword.length > 0 && h2Texts.some((h2) => h2.includes(normalizedKeyword));
      const keywordInMetaTitle = normalizedKeyword.length > 0 && normalizedMetaTitle.includes(normalizedKeyword);
      const keywordInMetaDesc = normalizedKeyword.length > 0 && normalizedMetaDesc.includes(normalizedKeyword);
      const keywordInSlug = normalizedKeyword.length > 0 && normalizedSlug.includes(normalizedKeywordSlug);
      const keywordInFirstParagraph = normalizedKeyword.length > 0 && firstParagraphText.includes(normalizedKeyword);

      const keywordCount = countOccurrences(normalizedContent, normalizedKeyword);
      const idealKeywordMax = Math.max(1, Math.ceil(wordCount / 200));

      let keywordScore = 0;
      if (keywordInTitle) keywordScore += 20;
      if (keywordInMetaTitle) keywordScore += 15;
      if (keywordInMetaDesc) keywordScore += 15;
      if (keywordInSlug) keywordScore += 10;
      if (keywordInFirstParagraph) keywordScore += 15;
      if (keywordInH2) keywordScore += 10;
      if (keywordCount >= 3) keywordScore += 15;

      let metaScore = 0;
      if (params.meta_title.length >= 30 && params.meta_title.length <= 60) metaScore += 50;
      else if (params.meta_title.length > 0) metaScore += 20;
      if (params.meta_description.length >= 120 && params.meta_description.length <= 160) metaScore += 50;
      else if (params.meta_description.length > 0) metaScore += 20;

      let structureScore = 0;
      if (wordCount >= 1000) structureScore += 30;
      else if (wordCount >= 500) structureScore += 15;
      if (h2Matches.length >= 3) structureScore += 25;
      else if (h2Matches.length >= 1) structureScore += 10;
      if (pMatches.length >= 5) structureScore += 25;
      else if (pMatches.length >= 2) structureScore += 10;
      if (imgMatches.length >= 1) structureScore += 20;

      const readabilityScore = Math.min(
        100,
        Math.max(
          0,
          (wordCount >= 300 ? 30 : 10) +
            (pMatches.length >= 3 ? 30 : 10) +
            (h2Matches.length >= 2 ? 20 : 5) +
            (wordCount < 3000 ? 20 : 10),
        ),
      );

      const overallScore = Math.round(
        keywordScore * 0.35 + metaScore * 0.2 + structureScore * 0.25 + readabilityScore * 0.2,
      );

      const issues: { label: string; passed: boolean }[] = [
        { label: "Palavra-chave no título", passed: keywordInTitle },
        { label: "Palavra-chave no H1", passed: keywordInH1 },
        { label: "Palavra-chave nos subtítulos (H2)", passed: keywordInH2 },
        { label: "Palavra-chave na meta description", passed: keywordInMetaDesc },
        { label: "Palavra-chave no primeiro parágrafo", passed: keywordInFirstParagraph },
        { label: "Título SEO 50-60 caracteres", passed: params.meta_title.length >= 50 && params.meta_title.length <= 60 },
        { label: "Meta description 150-160 caracteres", passed: params.meta_description.length >= 150 && params.meta_description.length <= 160 },
        { label: "Conteúdo > 1000 palavras", passed: wordCount >= 1000 },
        { label: "Pelo menos 3 subtítulos (H2)", passed: h2Matches.length >= 3 },
        { label: "Links internos >= 2", passed: (params.content.match(/<a[^>]*>/gi) || []).length >= 2 },
        { label: "Imagem destacada presente", passed: imgMatches.length >= 1 },
        { label: "Imagens com texto alternativo", passed: imgMatches.every((img) => img.includes("alt=")) },
      ];

      const recommendations: string[] = [];
      if (!keywordInTitle) recommendations.push("Adicione a palavra-chave ao título");
      if (!keywordInH2) recommendations.push("Adicione a palavra-chave em pelo menos um H2");
      if (wordCount < 1000) recommendations.push("Aumente o conteúdo para 1000+ palavras");
      if (params.meta_description.length < 150) recommendations.push("Ajuste a meta description para 150-160 caracteres");
      if (imgMatches.length === 0) recommendations.push("Adicione pelo menos uma imagem ao conteúdo");

      const terms = {
        keywords: [
          {
            term: normalizedKeyword,
            count: keywordCount,
            max: idealKeywordMax,
            status:
              keywordCount >= idealKeywordMax ? "ok" as const : keywordCount > 0 ? "low" as const : "missing" as const,
          },
        ],
        headings: [
          { term: "H2 com keyword", count: keywordInH2 ? 1 : 0, max: 1, status: keywordInH2 ? "ok" as const : "missing" as const },
          {
            term: "Total H2s",
            count: h2Matches.length,
            max: 5,
            status: h2Matches.length >= 3 ? "ok" as const : h2Matches.length >= 1 ? "low" as const : "missing" as const,
          },
        ],
        meta: [
          {
            term: "Título SEO",
            count: params.meta_title.length,
            max: 60,
            status:
              params.meta_title.length >= 50 && params.meta_title.length <= 60
                ? "ok" as const
                : params.meta_title.length > 0
                  ? "low" as const
                  : "missing" as const,
          },
          {
            term: "Meta Desc",
            count: params.meta_description.length,
            max: 160,
            status: params.meta_description.length >= 150 ? "ok" as const : params.meta_description.length > 0 ? "low" as const : "missing" as const,
          },
          { term: "Slug", count: keywordInSlug ? 1 : 0, max: 1, status: keywordInSlug ? "ok" as const : "missing" as const },
        ],
      };

      const result: SeoScoreResult = {
        overall_score: overallScore,
        keyword_score: keywordScore,
        readability_score: readabilityScore,
        structure_score: structureScore,
        meta_score: metaScore,
        issues,
        recommendations,
        terms,
        structure: {
          words: wordCount,
          h2_count: h2Matches.length,
          paragraphs: pMatches.length,
          images: imgMatches.length,
        },
      };

      setScore(result);

      const scorePayload = {
        article_id: params.article_id,
        overall_score: overallScore,
        keyword_score: keywordScore,
        readability_score: readabilityScore,
        structure_score: structureScore,
        meta_score: metaScore,
        issues: issues as any,
        recommendations: recommendations as any,
        calculated_at: new Date().toISOString(),
      };

      try {
        const { data: existingRows, error: findError } = await supabase
          .from("article_content_scores")
          .select("id")
          .eq("article_id", params.article_id)
          .limit(1);

        if (findError) throw findError;

        if (existingRows && existingRows.length > 0) {
          const { error: updateError } = await supabase
            .from("article_content_scores")
            .update(scorePayload)
            .eq("article_id", params.article_id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase.from("article_content_scores").insert(scorePayload);
          if (insertError) throw insertError;
        }
      } catch (persistError) {
        console.error("[SEO] Falha ao persistir métricas", persistError);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedCalculate = useCallback(
    (params: CalculateParams) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => calculate(params), 1000);
    },
    [calculate],
  );

  return { score, loading, calculate, debouncedCalculate };
}