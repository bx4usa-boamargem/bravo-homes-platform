// ── useBulkPipeline ────────────────────────────────────────────────────────────
// Hook para orquestrar geração em massa de artigos via article_queue + Realtime
//
// FLUXO:
//   1. enqueue(keywords[]) → insere N registros em article_queue
//   2. Dispara generate-article-pipeline para cada keyword sequencialmente
//   3. Subscriba ao article_jobs via Realtime para acompanhar progresso
//   4. Expõe queueItems[] com status de cada keyword

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PipelineStatus } from "./useArticlePipeline";

export interface BulkItem {
  id: string;
  keyword: string;
  status: "pending" | "running" | "done" | "error";
  progress: number;
  currentStep: string;
  articleId: string | null;
  jobId: string | null;
  error: string | null;
}

export interface BulkOptions {
  blogId: string;
  language?: string;
  size?: "short" | "medium" | "long";
  tone?: string;
  includeFaq?: boolean;
  includeImages?: boolean;
}

export function useBulkPipeline() {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const abortRef = useRef(false);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  // ── Subscribe to all article_jobs changes for this blog ──────────────
  const subscribeToJobs = useCallback((blogId: string) => {
    cleanup();
    const channel = supabase
      .channel(`bulk-jobs-${blogId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "article_jobs",
          filter: `blog_id=eq.${blogId}`,
        },
        (payload) => {
          const job = payload.new as {
            id: string;
            status: PipelineStatus;
            progress: number;
            current_step: string;
            error_message?: string;
            article_id?: string;
          };

          setItems((prev) =>
            prev.map((item) => {
              if (item.jobId !== job.id) return item;
              return {
                ...item,
                status: job.status === "done" ? "done" : job.status === "error" ? "error" : "running",
                progress: job.progress ?? item.progress,
                currentStep: job.current_step ?? item.currentStep,
                error: job.error_message ?? null,
                articleId: job.article_id ?? item.articleId,
              };
            }),
          );
        },
      )
      .subscribe();

    channelRef.current = channel;
  }, [cleanup]);

  // ── Enqueue & run pipeline per keyword ────────────────────────────────
  const enqueue = useCallback(
    async (keywords: string[], options: BulkOptions) => {
      if (isRunning) return;
      abortRef.current = false;

      const newItems: BulkItem[] = keywords.map((kw, i) => ({
        id: `bulk-${Date.now()}-${i}`,
        keyword: kw.trim(),
        status: "pending" as const,
        progress: 0,
        currentStep: "Na fila...",
        articleId: null,
        jobId: null,
        error: null,
      }));

      setItems(newItems);
      setIsRunning(true);
      subscribeToJobs(options.blogId);

      // Run sequentially to avoid overloading the edge function
      for (let i = 0; i < newItems.length; i++) {
        if (abortRef.current) break;

        const item = newItems[i];
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: "running", currentStep: "Iniciando..." } : it,
          ),
        );

        try {
          const { data, error } = await supabase.functions.invoke("generate-article-pipeline", {
            body: {
              blog_id: options.blogId,
              keyword: item.keyword,
              language: options.language ?? "pt-br",
              size: options.size ?? "medium",
              tone: options.tone ?? "profissional e próximo",
              include_faq: options.includeFaq ?? true,
              include_images: options.includeImages ?? true,
            },
          });

          if (error) throw new Error(error.message);
          if (!data?.article_id || !data?.job_id) throw new Error("Resposta inválida do pipeline");

          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, jobId: data.job_id, articleId: data.article_id, currentStep: "Pipeline iniciado..." }
                : it,
            ),
          );

          // Wait for this job to finish before starting the next
          await waitForJob(data.job_id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro desconhecido";
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, status: "error", error: msg, currentStep: "" } : it,
            ),
          );
        }
      }

      setIsRunning(false);
    },
    [isRunning, subscribeToJobs],
  );

  // ── Wait for a single job to finish (polling fallback) ────────────────
  const waitForJob = async (jobId: string, timeoutMs = 300_000): Promise<void> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await (supabase.from("article_jobs") as any)
        .select("status")
        .eq("id", jobId)
        .single();

      if (data?.status === "done" || data?.status === "error") return;
      await new Promise((r) => setTimeout(r, 5000));
    }
  };

  // ── Retry failed items ────────────────────────────────────────────────
  const retryFailed = useCallback(
    (options: BulkOptions) => {
      const failedKeywords = items.filter((it) => it.status === "error").map((it) => it.keyword);
      if (failedKeywords.length === 0) return;
      // Reset failed items and re-enqueue
      setItems((prev) => prev.filter((it) => it.status !== "error"));
      enqueue(failedKeywords, options);
    },
    [items, enqueue],
  );

  // ── Abort ─────────────────────────────────────────────────────────────
  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    abortRef.current = true;
    cleanup();
    setItems([]);
    setIsRunning(false);
  }, [cleanup]);

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = {
    total: items.length,
    pending: items.filter((it) => it.status === "pending").length,
    running: items.filter((it) => it.status === "running").length,
    done: items.filter((it) => it.status === "done").length,
    error: items.filter((it) => it.status === "error").length,
  };

  return { items, stats, isRunning, enqueue, retryFailed, abort, reset };
}
