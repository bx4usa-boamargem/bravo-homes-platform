-- =============================================================================
-- Migration: Add subconta (business context) fields to blogs table
-- Project:   Omniseen V3
-- Date:      2026-03-14
--
-- These fields allow the Radar and Article Generator to produce
-- hyper-localized, brand-specific SEO content instead of generic output.
-- =============================================================================

ALTER TABLE public.blogs
  ADD COLUMN IF NOT EXISTS segmento          text DEFAULT '',
  ADD COLUMN IF NOT EXISTS endereco          text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bairro            text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cidade            text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cep               text DEFAULT '',
  ADD COLUMN IF NOT EXISTS servicos_oferecidos text DEFAULT '';

COMMENT ON COLUMN public.blogs.segmento             IS 'Segmento de atuação da empresa (ex: Advocacia, Contabilidade, TI)';
COMMENT ON COLUMN public.blogs.endereco             IS 'Logradouro e número da empresa';
COMMENT ON COLUMN public.blogs.bairro               IS 'Bairro onde a empresa está localizada';
COMMENT ON COLUMN public.blogs.cidade               IS 'Cidade / UF da empresa';
COMMENT ON COLUMN public.blogs.cep                  IS 'CEP da empresa (formato: 00000-000)';
COMMENT ON COLUMN public.blogs.servicos_oferecidos  IS 'Descrição dos serviços oferecidos — usada pelo Radar e gerador de artigos';
