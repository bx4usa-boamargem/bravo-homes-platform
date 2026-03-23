-- Migration: Super Pages Table (Squad v2.0)
-- Criada em 2026-03-14

CREATE TABLE IF NOT EXISTS public.super_pages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id         uuid NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  meta_title      text,
  meta_description text,
  focus_keyword   text,
  -- Conteúdo principal
  content_markdown text,
  key_takeaways   jsonb DEFAULT '[]',
  toc             jsonb DEFAULT '[]',
  faq             jsonb DEFAULT '[]',
  cta_primary     jsonb DEFAULT '{}',
  cta_secondary   jsonb DEFAULT '{}',
  imagens         jsonb DEFAULT '[]',
  internal_links  jsonb DEFAULT '[]',
  -- Metadados
  autor           jsonb DEFAULT '{}',
  schema_article  jsonb DEFAULT '{}',
  schema_faqpage  jsonb DEFAULT '{}',
  -- Qualidade
  quality_score   integer DEFAULT 0,
  quality_issues  text[] DEFAULT '{}',
  word_count      integer DEFAULT 0,
  -- SERP
  serp_data       jsonb DEFAULT '{}',
  -- Status
  status          text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'needs_review', 'archived')),
  published_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.super_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_pages_owner_all" ON public.super_pages
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "super_pages_public_read" ON public.super_pages
  FOR SELECT USING (status = 'published');

-- Índices
CREATE INDEX idx_super_pages_blog_id ON public.super_pages(blog_id);
CREATE INDEX idx_super_pages_user_id ON public.super_pages(user_id);
CREATE INDEX idx_super_pages_slug    ON public.super_pages(slug);
CREATE INDEX idx_super_pages_status  ON public.super_pages(status);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER super_pages_updated_at
  BEFORE UPDATE ON public.super_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
