-- Migration: omniseen_engine_upgrade.sql
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Adicionar image_style na tabela blogs
ALTER TABLE blogs
  ADD COLUMN IF NOT EXISTS image_style TEXT DEFAULT 'photorealistic'
    CHECK (image_style IN ('photorealistic', 'illustration', 'vector', 'minimal'));

-- 2. Adicionar serp_data nos artigos (dados SERP usados na geração)
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS serp_data JSONB;

-- 3. Criar tabela landing_pages (Super Pages)
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meta_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  schema_markup JSONB,
  cta_primary TEXT DEFAULT 'Fale Conosco',
  serp_data JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blog_id, slug)
);

-- 4. RLS para landing_pages
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own landing pages" ON landing_pages
  FOR ALL USING (
    blog_id IN (
      SELECT id FROM blogs WHERE user_id = auth.uid()
    )
  );

-- 5. Tabela page_monitors (Market Monitor / Content Decay)
CREATE TABLE IF NOT EXISTS page_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL DEFAULT 'article' CHECK (content_type IN ('article', 'landing_page')),
  content_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  current_rank INT,
  last_serp_data JSONB,
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  refresh_interval_days INT DEFAULT 7,
  is_active BOOL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE page_monitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own monitors" ON page_monitors
  FOR ALL USING (blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid()));

-- 6. Trigger updated_at para landing_pages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON landing_pages;
CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
