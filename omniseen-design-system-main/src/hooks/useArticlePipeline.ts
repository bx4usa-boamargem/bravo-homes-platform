// ── useArticlePipeline ────────────────────────────────────────────────────────
// Hook React para orquestrar a geração assíncrona de artigos via pipeline multi-agente
//
// FLUXO:
//   1. trigger()  → POST /generate-article-pipeline → { article_id, job_id }
//   2. Supabase Realtime subscribe → article_jobs.id = job_id
//   3. A cada UPDATE do DB, atualiza status/progress/step em tempo real
//   4. Quando status="done" → cleanup + callback onComplete(article_id)
//   5. Quando status="error" → cleanup + expõe error_message

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type PipelineStatus =
  | "idle"
  | "queued"
  | "serp"
  | "outline"
  | "writing"
  | "media"
  | "schema"
  | "done"
  | "error";

export interface PipelineState {
  status: PipelineStatus;
  progress: number;       // 0–100
  currentStep: string;    // texto do step atual (vem do DB)
  articleId: string | null;
  jobId: string | null;
  error: string | null;
}

export interface TriggerParams {
  blogId: string;
  keyword: string;
  language?: string;
  size?: "short" | "medium" | "long";
  tone?: string;
  includeFaq?: boolean;
  includeImages?: boolean;
  customOutline?: string[];
}

// Mapeamento status DB → índice de step para a barra de progresso visual
export const PIPELINE_STEP_INDEX: Record<PipelineStatus, number> = {
  idle:    -1,
  queued:   0,
  serp:     1,
  outline:  2,
  writing:  3,
  media:    4,
  schema:   5,
  done:     6,
  error:    -1,
};

// Labels dos steps para exibição no UI (mapeados ao PIPELINE_STEP_INDEX)
export const PIPELINE_STEP_LABELS: string[] = [
  "Iniciando pipeline",
  "🔍 Buscando top 10 no Google (SERP real)...",
  "🧠 Analisando concorrentes e gaps de conteúdo...",
  "✍️ Escrevendo seções em paralelo...",
  "❓ Gerando FAQ com perguntas reais do Google...",
  "🖼️ Gerando título, meta, imagens e tags...",
  "Artigo concluído ✅",
];

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useArticlePipeline(onComplete?: (articleId: string) => void) {
  const [state, setState] = useState<PipelineState>({
    status: "idle",
    progress: 0,
    currentStep: "",
    articleId: null,
    jobId: null,
    error: null,
  });

  // Referências para cleanup correto sem stale closures
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const jobIdRef = useRef<string | null>(null);

  // ── Limpeza do canal Realtime ─────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    jobIdRef.current = null;
  }, []);

  // Cleanup automático no unmount
  useEffect(() => () => cleanup(), [cleanup]);

  // ── Subscrição Realtime ao article_jobs ──────────────────────────────────
  const subscribeToJob = useCallback(
    (jobId: string) => {
      // Remover canal anterior se existir
      cleanup();
      jobIdRef.current = jobId;

      const channel = supabase
        .channel(`pipeline-job-${jobId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "article_jobs",
            filter: `id=eq.${jobId}`,
          },
          (payload) => {
            const job = payload.new as {
              status: PipelineStatus;
              progress: number;
              current_step: string;
              error_message?: string;
            };

            setState((prev) => ({
              ...prev,
              status: job.status,
              progress: job.progress ?? prev.progress,
              currentStep: job.current_step ?? prev.currentStep,
              error: job.error_message ?? null,
            }));

            // Pipeline concluído
            if (job.status === "done") {
              cleanup();
              setState((prev) => {
                if (prev.articleId) onComplete?.(prev.articleId);
                return prev;
              });
            }

            // Pipeline falhou — manter estado para o usuário ver o erro
            if (job.status === "error") {
              cleanup();
            }
          },
        )
        .subscribe((subscribeStatus) => {
          if (subscribeStatus === "SUBSCRIBED") {
            console.log(`[useArticlePipeline] Realtime subscribed to job ${jobId}`);
          } else if (subscribeStatus === "CHANNEL_ERROR") {
            console.error(`[useArticlePipeline] Realtime channel error for job ${jobId}`);
          }
        });

      channelRef.current = channel;
    },
    [cleanup, onComplete],
  );

  // ── Disparar o pipeline ───────────────────────────────────────────────────
  const trigger = useCallback(
    async (params: TriggerParams): Promise<void> => {
      if (state.status !== "idle" && state.status !== "done" && state.status !== "error") {
        console.warn("[useArticlePipeline] Pipeline já em execução");
        return;
      }

      setState({
        status: "queued",
        progress: 0,
        currentStep: "Iniciando...",
        articleId: null,
        jobId: null,
        error: null,
      });

      try {
        const { data, error } = await supabase.functions.invoke("generate-article-pipeline", {
          body: {
            blog_id: params.blogId,
            keyword: params.keyword.trim(),
            language: params.language ?? "pt-br",
            size: params.size ?? "medium",
            tone: params.tone ?? "profissional e próximo",
            include_faq: params.includeFaq ?? true,
            include_images: params.includeImages ?? true,
            ...(params.customOutline && { custom_outline: params.customOutline }),
          },
        });

        if (error) throw new Error(error.message ?? "Erro ao invocar pipeline");
        if (!data?.article_id || !data?.job_id) {
          throw new Error("Resposta inválida do pipeline: article_id ou job_id ausentes");
        }

        const { article_id, job_id } = data as { article_id: string; job_id: string };

        setState((prev) => ({
          ...prev,
          articleId: article_id,
          jobId: job_id,
          status: "queued",
          currentStep: "Pipeline iniciado...",
        }));

        // Subscribir ao Realtime para acompanhar progresso
        subscribeToJob(job_id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        setState({
          status: "error",
          progress: 0,
          currentStep: "",
          articleId: null,
          jobId: null,
          error: msg,
        });
        cleanup();
      }
    },
    [state.status, subscribeToJob, cleanup],
  );

  // ── Reset para novo ciclo ─────────────────────────────────────────────────
  const reset = useCallback(() => {
    cleanup();
    setState({
      status: "idle",
      progress: 0,
      currentStep: "",
      articleId: null,
      jobId: null,
      error: null,
    });
  }, [cleanup]);

  // ── Polling de fallback (caso Realtime falhe) ────────────────────────────
  // Verifica o status do job diretamente no banco a cada 8s se o Realtime não emitir
  useEffect(() => {
    const isRunning = !["idle", "done", "error"].includes(state.status);
    if (!isRunning || !state.jobId) return;

    const poll = setInterval(async () => {
      if (!state.jobId) return;
      const { data } = await (supabase
        .from("article_jobs") as any)
        .select("status, progress, current_step, error_message")
        .eq("id", state.jobId)
        .single();

      if (!data) return;

      const row = data as { status: string; progress: number; current_step: string; error_message: string | null };

      setState((prev) => {
        if (prev.status === row.status && prev.progress === row.progress) return prev;
        return {
          ...prev,
          status: row.status as PipelineStatus,
          progress: row.progress ?? prev.progress,
          currentStep: row.current_step ?? prev.currentStep,
          error: row.error_message ?? null,
        };
      });

      if (row.status === "done" || row.status === "error") {
        clearInterval(poll);
        if (row.status === "done") {
          setState((prev) => {
            if (prev.articleId) onComplete?.(prev.articleId);
            return prev;
          });
        }
        cleanup();
      }
    }, 8000);

    return () => clearInterval(poll);
  }, [state.status, state.jobId, cleanup, onComplete]);

  return { state, trigger, reset };
}
