-- ============================================================
-- OMNI-SEO ENGINE: Pipeline Assíncrono Multi-Agente
-- Migration: article_jobs + ajustes na tabela articles
-- ============================================================

-- 1. Tabela de jobs do pipeline assíncrono
CREATE TABLE IF NOT EXISTS article_jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id     UUID REFERENCES articles(id) ON DELETE CASCADE,
  blog_id        UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL,
  keyword        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'queued'
                 CHECK (status IN ('queued','serp','outline','writing','media','schema','done','error')),
  progress       INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  current_step   TEXT,
  pipeline_data  JSONB NOT NULL DEFAULT '{}',
  error_message  TEXT,
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS para article_jobs
ALTER TABLE article_jobs ENABLE ROW LEVEL SECURITY;

-- Usuários veem seus próprios jobs
CREATE POLICY "Users can view own article jobs"
  ON article_jobs FOR SELECT
  USING (user_id = auth.uid());

-- Service role gerencia todos (para o pipeline no backend)
CREATE POLICY "Service role manages all article jobs"
  ON article_jobs FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 3. Coluna de rastreamento no articles (segura com IF NOT EXISTS)
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS is_generated_by_ai    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS generation_job_id     UUID REFERENCES article_jobs(id) ON DELETE SET NULL;

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_article_jobs_user_id    ON article_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_article_jobs_article_id ON article_jobs(article_id);
CREATE INDEX IF NOT EXISTS idx_article_jobs_status     ON article_jobs(status);
CREATE INDEX IF NOT EXISTS idx_article_jobs_blog_id    ON article_jobs(blog_id);
CREATE INDEX IF NOT EXISTS idx_articles_generation_job ON articles(generation_job_id);

-- 5. Habilitar Realtime para polling no frontend
ALTER PUBLICATION supabase_realtime ADD TABLE article_jobs;

-- 6. Trigger updated_at para article_jobs
CREATE OR REPLACE FUNCTION update_article_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- article_jobs não tem updated_at mas queremos log de changes via Realtime
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
