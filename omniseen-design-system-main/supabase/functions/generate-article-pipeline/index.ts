// ── OMNI-SEO ENGINE: Pipeline Assíncrono ─────────────────────────────────────
// Endpoint: POST /generate-article-pipeline
//
// Comportamento:
//   1. Valida auth e parâmetros
//   2. Cria registro inicial no articles (status="draft", content="")
//   3. Cria job em article_jobs (status="queued")
//   4. Responde IMEDIATAMENTE ao cliente com { article_id, job_id }
//   5. Pipeline roda em background via EdgeRuntime.waitUntil()
//
// Frontend: subscribe ao Supabase Realtime na tabela article_jobs
// filtrando por job_id para receber atualizações de progresso em tempo real.
//
// FIX: Não usa generate-article-pro (tinha bug no outline.title)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { runPipeline } from "../_shared/pipeline-orchestrator.ts";
import { getPlatformApiKeys, validateRequiredKeys } from "../_shared/fetch-user-keys.ts";

// Tipo para o EdgeRuntime global do Supabase Edge Runtime
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    // ── Autenticação ─────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization" }, 401);
    }

    // ── Variáveis de ambiente ──────────────────────────────────────────────────
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── Chaves globais da plataforma ────────────────────────────────────────────
    const platformKeys = getPlatformApiKeys();
    const missingKeys = validateRequiredKeys(platformKeys);
    if (missingKeys.length > 0) {
      return jsonResponse({ error: `Chaves de API faltando no servidor: ${missingKeys.join(", ")}` }, 500);
    }

    // ── Parse do body ─────────────────────────────────────────────────────────
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

    const validSizes = ["short", "medium", "long"];
    if (!validSizes.includes(size)) {
      return jsonResponse({ error: `size inválido. Use: ${validSizes.join(", ")}` }, 400);
    }

    // ── Verificar usuário autenticado ─────────────────────────────────────────
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // ── Verificar acesso ao blog ──────────────────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Keys already validated above via getPlatformApiKeys()

    let { data: blog } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", blog_id)
      .eq("user_id", user.id)
      .maybeSingle();

    // Tentar acesso via tenant_members (planos com sub-contas)
    if (!blog) {
      const { data: memberBlog } = await supabase
        .from("blogs")
        .select("*, tenant_members!inner(user_id)")
        .eq("id", blog_id)
        .eq("tenant_members.user_id", user.id)
        .maybeSingle();
      blog = memberBlog;
    }

    if (!blog) {
      return jsonResponse({ error: "Blog não encontrado ou acesso negado" }, 403);
    }

    // ── Criar artigo placeholder (será preenchido pelo pipeline) ─────────────
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
      console.error("[Pipeline Trigger] Erro ao criar artigo:", articleErr);
      return jsonResponse({ error: "Erro ao criar registro do artigo" }, 500);
    }

    // ── Criar job no pipeline ────────────────────────────────────────────────
    const { data: job, error: jobErr } = await supabase
      .from("article_jobs")
      .insert({
        article_id: article.id,
        blog_id,
        user_id: user.id,
        keyword,
        status: "queued",
        progress: 0,
        current_step: "🕐 Aguardando início do pipeline...",
        pipeline_data: {},
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      console.error("[Pipeline Trigger] Erro ao criar job:", jobErr);
      // Limpar artigo criado
      await supabase.from("articles").delete().eq("id", article.id);
      return jsonResponse({ error: "Erro ao criar job do pipeline" }, 500);
    }

    // Salvar referência do job no artigo
    await supabase
      .from("articles")
      .update({ generation_job_id: job.id })
      .eq("id", article.id);

    console.log(
      `[Pipeline Trigger] Job ${job.id} criado para artigo ${article.id} — keyword: "${keyword}"`,
    );

    // ── Disparar pipeline em background (não bloqueia a resposta) ───────────
    // EdgeRuntime.waitUntil garante que o pipeline continue rodando
    // mesmo após a resposta HTTP ser enviada (até wall clock limit de 400s no Pro)
    EdgeRuntime.waitUntil(
      runPipeline(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        platformKeys.openaiKey!,
        platformKeys.serperKey ?? "",
        platformKeys.googlePlacesKey ?? "",
        platformKeys.falKey,
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

    // ── Resposta imediata ao cliente (< 200ms) ───────────────────────────────
    // O frontend deve:
    //   1. Redirecionar para a página do artigo (article_id)
    //   2. Subscribir ao Realtime: supabase.channel('job-status').on('postgres_changes', ...)
    //      filtrando por article_jobs.id = job_id
    return jsonResponse({
      article_id: article.id,
      job_id: job.id,
      status: "queued",
      message: "Pipeline iniciado. Acompanhe o progresso via Realtime no article_jobs.",
      realtime_table: "article_jobs",
      realtime_filter: `id=eq.${job.id}`,
    });
  } catch (e) {
    console.error("[generate-article-pipeline] Erro inesperado:", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Erro interno" },
      500,
    );
  }
});
