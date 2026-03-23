// ── ORQUESTRADOR DO PIPELINE MULTI-AGENTE ────────────────────────────────────
// Coordena: SerpAgent → OutlineAgent → WriterAgent (loop) → MediaAgent → SchemaAgent
// Persiste progresso no banco após cada etapa (resiliente a falhas parciais)
// Atualiza articles.content progressivamente (usuário vê o artigo crescer via Realtime)

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runSerpAgent, type BlogContext, type SerpResult } from "./serp-agent.ts";
import { runOutlineAgent, type OutlineResult } from "./outline-agent.ts";
import { runWriterAgent } from "./writer-agent.ts";
import { runMediaAgent } from "./media-agent.ts";
import { runSchemaAgent } from "./schema-agent.ts";

export interface PipelineParams {
  jobId: string;
  articleId: string;
  blogId: string;
  userId: string;
  keyword: string;
  language: string;
  size: "short" | "medium" | "long";
  tone: string;
  includeFaq: boolean;
  includeImages: boolean;
  blog: Record<string, any>;
}

const SIZE_MAP: Record<string, number> = {
  short: 1000,
  medium: 2000,
  long: 3200,
};

// ── Helpers de persistência ───────────────────────────────────────────────────

async function setJobStatus(
  supabase: SupabaseClient,
  jobId: string,
  status: string,
  progress: number,
  currentStep: string,
  extraData?: Record<string, unknown>,
): Promise<void> {
  const payload: Record<string, unknown> = { status, progress, current_step: currentStep };
  if (extraData) Object.assign(payload, extraData);
  await supabase.from("article_jobs").update(payload).eq("id", jobId);
  console.log(`[Pipeline][${status}] ${progress}% — ${currentStep}`);
}

async function mergePipelineData(
  supabase: SupabaseClient,
  jobId: string,
  newData: Record<string, unknown>,
): Promise<void> {
  // Usar jsonb_set seria ideal, mas o update simples com fetch-merge é mais compatível com Edge
  const { data: existing } = await supabase
    .from("article_jobs")
    .select("pipeline_data")
    .eq("id", jobId)
    .single();

  const merged = { ...(existing?.pipeline_data ?? {}), ...newData };
  await supabase.from("article_jobs").update({ pipeline_data: merged }).eq("id", jobId);
}

// ── Entry point principal do orquestrador ────────────────────────────────────

export async function runPipeline(
  supabaseUrl: string,
  supabaseServiceKey: string,
  openAiKey: string,
  serperKey: string,
  googlePlacesKey: string,
  falApiKey: string | null,
  params: PipelineParams,
): Promise<void> {
  // Criar cliente Supabase com service role (bypass RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const {
    jobId, articleId, keyword, language, size, tone,
    includeFaq, includeImages, blog,
  } = params;

  const targetWords = SIZE_MAP[size] ?? 2000;

  const blogContext: BlogContext = {
    nome: blog.name ?? "",
    segmento: blog.segmento ?? blog.niche ?? "negócios",
    bairro: blog.bairro ?? "",
    cidade: blog.cidade ?? "",
    servicos: blog.servicos_oferecidos ?? blog.target_audience ?? "",
    imageStyle: blog.image_style ?? "photorealistic",
  };

  // ── Dados acumulados do pipeline (em memória, persiste no DB ao final de cada fase)
  let serpResult: SerpResult | null = null;
  let outline: OutlineResult | null = null;

  try {
    // ════════════════════════════════════════════════════════════════════
    // FASE 1 — SERP Agent
    // ════════════════════════════════════════════════════════════════════
    await setJobStatus(supabase, jobId, "serp", 5, "🔍 Analisando SERP e concorrentes...");

    serpResult = await runSerpAgent(keyword, blogContext, serperKey, googlePlacesKey);

    await mergePipelineData(supabase, jobId, { serp: serpResult });

    // ════════════════════════════════════════════════════════════════════
    // FASE 2 — Outline Agent
    // ════════════════════════════════════════════════════════════════════
    await setJobStatus(supabase, jobId, "outline", 15, "📐 Construindo estrutura semântica...");

    outline = await runOutlineAgent(
      keyword, serpResult, blogContext, openAiKey,
      language, tone, targetWords, includeFaq,
    );

    await mergePipelineData(supabase, jobId, { outline });

    // Salvar título no artigo antecipadamente (UX: usuário vê o título logo)
    await supabase.from("articles").update({
      title: outline.title,
      meta_description: outline.metaDescription ?? "",
    }).eq("id", articleId);

    // ════════════════════════════════════════════════════════════════════
    // FASE 3 — Writer Agent (section-by-section loop)
    // ════════════════════════════════════════════════════════════════════
    await setJobStatus(
      supabase, jobId, "writing", 20,
      `✍️ Iniciando redação — ${outline.sections.length} seções`,
    );

    const sections = outline.sections;
    let fullContent = "";

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const progressWriting = 20 + Math.floor((i / sections.length) * 50); // 20% → 70%

      await setJobStatus(
        supabase, jobId, "writing", progressWriting,
        `✍️ Seção ${i + 1}/${sections.length}: ${section.heading}`,
      );

      const sectionHtml = await runWriterAgent(
        section, keyword, outline, language, tone,
        i === 0, includeImages, openAiKey,
      );

      // Montar HTML com heading
      fullContent += `<h2>${section.heading}</h2>\n${sectionHtml}\n\n`;

      // Salvar conteúdo progressivamente (Realtime: usuário vê o artigo crescer)
      await supabase.from("articles").update({ content: fullContent }).eq("id", articleId);
    }

    // ════════════════════════════════════════════════════════════════════
    // FASE 4 — Media Agent
    // ════════════════════════════════════════════════════════════════════
    await setJobStatus(supabase, jobId, "media", 72, "🖼️ Injetando imagens e mídia...");

    const { content: contentWithMedia, featuredImageUrl } = await runMediaAgent(
      fullContent, keyword, outline.title, blogContext,
      includeImages ? falApiKey : null,
    );

    await supabase.from("articles").update({
      content: contentWithMedia,
      featured_image_url: featuredImageUrl,
    }).eq("id", articleId);

    // ════════════════════════════════════════════════════════════════════
    // FASE 5 — Schema Agent
    // ════════════════════════════════════════════════════════════════════
    await setJobStatus(supabase, jobId, "schema", 88, "🏷️ Gerando metadados e Schema JSON-LD...");

    const meta = await runSchemaAgent(
      contentWithMedia, keyword, blogContext, outline, openAiKey, includeFaq,
    );

    // ── Calcular métricas finais ─────────────────────────────────────────────
    const textOnly = contentWithMedia.replace(/<[^>]*>/g, " ");
    const wordCount = textOnly.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    const uniqueSlug = `${meta.slug}-${Date.now().toString(36)}`;

    // Injetar Schema JSON-LD como comentário no topo do conteúdo
    let finalContent = contentWithMedia;
    if (meta.schema_jsonld) {
      const schemaStr = typeof meta.schema_jsonld === "string"
        ? meta.schema_jsonld
        : JSON.stringify(meta.schema_jsonld);
      finalContent = `<!-- schema:${schemaStr} -->\n${finalContent}`;
    }

    // ── Salvar artigo final completo ─────────────────────────────────────────
    await supabase.from("articles").update({
      title: outline.title,
      slug: uniqueSlug,
      content: finalContent,
      excerpt: meta.excerpt ?? "",
      meta_title: meta.meta_title ?? outline.title,
      meta_description: meta.meta_description ?? outline.metaDescription ?? "",
      focus_keyword: keyword,
      tags: meta.tags ?? [],
      category: meta.category ?? null,
      faq: meta.faq ?? null,
      word_count: wordCount,
      reading_time_minutes: readingTime,
      seo_score: meta.seo_score ?? 80,
      featured_image_url: featuredImageUrl,
      status: "draft",
      is_generated_by_ai: true,
      serp_data: serpResult,
      generation_job_id: jobId,
    }).eq("id", articleId);

    // ── Marcar job como concluído ────────────────────────────────────────────
    await supabase.from("article_jobs").update({
      status: "done",
      progress: 100,
      current_step: "✅ Artigo gerado com sucesso!",
      completed_at: new Date().toISOString(),
      pipeline_data: {
        serp: {
          organicCount: serpResult.organicResults.length,
          paaCount: serpResult.peopleAlsoAsk.length,
          lsiCount: serpResult.lsiKeywords.length,
        },
        outline: { title: outline.title, sections: outline.sections.length },
        meta: { seo_score: meta.seo_score, tags: meta.tags },
        stats: { word_count: wordCount, reading_time: readingTime },
      },
    }).eq("id", jobId);

    console.log(
      `[Pipeline] ✅ CONCLUÍDO — "${outline.title}" | ${wordCount} palavras | SEO: ${meta.seo_score}`,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido no pipeline";
    console.error("[Pipeline] ❌ ERRO:", msg);

    await supabase.from("article_jobs").update({
      status: "error",
      error_message: msg,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    // Não deletar o artigo — salvar o que foi gerado até aqui como rascunho
    await supabase.from("articles")
      .update({ status: "draft" })
      .eq("id", articleId);
  }
}
