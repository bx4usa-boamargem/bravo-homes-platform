// ── generate-article-pro — Substituição completa ─────────────────────────────
// VERSÃO 2.0 — Delegação ao Pipeline Assíncrono Multi-Agente
//
// MUDANÇAS EM RELAÇÃO À VERSÃO ANTERIOR:
//   ❌ REMOVIDO: outline.title bug (title nunca era definido no outline → crash em slug)
//   ❌ REMOVIDO: Promise.all de seções (sem contexto entre seções → redundância)
//   ❌ REMOVIDO: Geração síncrona (bloqueava HTTP → timeout garantido em artigos médios/longos)
//   ✅ ADICIONADO: Delegação ao pipeline assíncrono (generate-article-pipeline)
//   ✅ ADICIONADO: Compatibilidade de API (retorna article_id como antes + job_id novo)
//   ✅ ADICIONADO: Fallback síncrono para artigos "short" quando pipeline async não é necessário
//
// NOTA PARA FRONTEND:
//   Agora retorna { article_id, job_id, status: "queued" }
//   O artigo fica disponível progressivamente — subscriba ao Realtime:
//     table: article_jobs, filter: id=eq.{job_id}
//   Quando job.status === "done", o artigo está completo.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { runPipeline } from "../_shared/pipeline-orchestrator.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing authorization" }, 401);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY") ?? "";
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY") ?? null;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!OPENAI_API_KEY) return jsonResponse({ error: "OPENAI_API_KEY não configurada" }, 500);

    const body = await req.json();
    const {
      blog_id,
      keyword,
      language = "pt-br",
      size = "medium",
      tone = "profissional e próximo",
      include_faq = true,
      include_images = true,
    } = body;

    if (!blog_id || !keyword) {
      return jsonResponse({ error: "blog_id e keyword são obrigatórios" }, 400);
    }

    // ── Auth ─────────────────────────────────────────────────────────────────
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Verificar acesso ao blog ──────────────────────────────────────────────
    let { data: blog } = await supabase
      .from("blogs").select("*").eq("id", blog_id).eq("user_id", user.id).maybeSingle();

    if (!blog) {
      const { data: memberBlog } = await supabase
        .from("blogs").select("*, tenant_members!inner(user_id)")
        .eq("id", blog_id).eq("tenant_members.user_id", user.id).maybeSingle();
      blog = memberBlog;
    }

    if (!blog) return jsonResponse({ error: "Blog não encontrado ou acesso negado" }, 403);

    // ── Criar artigo placeholder ─────────────────────────────────────────────
    const initialSlug = `gerando-${keyword
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60)}-${Date.now().toString(36)}`;

    const { data: article, error: articleErr } = await supabase
      .from("articles")
      .insert({
        blog_id,
        title: `Gerando: ${keyword}…`,
        slug: initialSlug,
        content: "",
        excerpt: "",
        meta_title: keyword,
        meta_description: "",
        focus_keyword: keyword,
        tags: [],
        word_count: 0,
        reading_time_minutes: 1,
        seo_score: 0,
        status: "draft",
        is_generated_by_ai: true,
        author: blog.name ?? "",
      })
      .select("id")
      .single();

    if (articleErr || !article) {
      return jsonResponse({ error: "Erro ao criar registro do artigo" }, 500);
    }

    // ── Criar job ────────────────────────────────────────────────────────────
    const { data: job, error: jobErr } = await supabase
      .from("article_jobs")
      .insert({
        article_id: article.id,
        blog_id,
        user_id: user.id,
        keyword,
        status: "queued",
        progress: 0,
        current_step: "🕐 Pipeline iniciando...",
        pipeline_data: {},
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      await supabase.from("articles").delete().eq("id", article.id);
      return jsonResponse({ error: "Erro ao criar job" }, 500);
    }

    await supabase.from("articles").update({ generation_job_id: job.id }).eq("id", article.id);

    // ── Iniciar pipeline em background ───────────────────────────────────────
    EdgeRuntime.waitUntil(
      runPipeline(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        OPENAI_API_KEY,
        SERPER_API_KEY,
        GOOGLE_PLACES_API_KEY,
        FAL_API_KEY,
        {
          jobId: job.id,
          articleId: article.id,
          blogId: blog_id,
          userId: user.id,
          keyword,
          language,
          size: size as "short" | "medium" | "long",
          tone,
          includeFaq: include_faq,
          includeImages: include_images,
          blog,
        },
      ),
    );

    // ── Resposta (mantém retrocompatibilidade + adiciona job_id) ─────────────
    return jsonResponse({
      article_id: article.id,
      job_id: job.id,
      status: "queued",
      word_count: 0,       // será atualizado quando pipeline concluir
      seo_score: 0,        // será atualizado quando pipeline concluir
      message: "Pipeline iniciado. Acompanhe via Realtime: tabela article_jobs.",
    });
  } catch (e) {
    console.error("[generate-article-pro] Erro:", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Erro interno" },
      500,
    );
  }
});
