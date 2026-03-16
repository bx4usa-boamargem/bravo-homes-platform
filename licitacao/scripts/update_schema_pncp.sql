-- Migration: Add new fields from PNCP Manual
-- This script adds data_encerramento and valor_total_homologado to licitacoes_cache

ALTER TABLE licitacoes_cache 
ADD COLUMN IF NOT EXISTS data_encerramento TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS valor_total_homologado NUMERIC;

COMMENT ON COLUMN licitacoes_cache.data_encerramento IS 'dataEncerramentoProposta + -03:00 (Campo correto para prazo)';
COMMENT ON COLUMN licitacoes_cache.valor_total_homologado IS 'valorTotalHomologado (útil para V2 e analista-mercado)';
