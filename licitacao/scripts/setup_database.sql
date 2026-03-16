-- LICITAI DATABASE SETUP v2 (corrigido)
-- Compativel com Supabase existente (projeto Fiscal compartilhado)
-- Authoritative source: 01_PRD.md Section 3.2

-- =============================================================
-- PARTE 1: Garantir que a tabela empresas tem as colunas certas
-- (a tabela pode ja existir do projeto Fiscal com schema diferente)
-- =============================================================
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS supabase_user_id    TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS razao_social        TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cnpj                TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email               TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS plano               TEXT DEFAULT 'basico';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ativo               BOOLEAN DEFAULT true;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS contagem_alertas_perdidos INTEGER DEFAULT 0;

-- Adicionar constraint de unicidade se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'empresas' AND constraint_name = 'empresas_supabase_user_id_key'
  ) THEN
    ALTER TABLE empresas ADD CONSTRAINT empresas_supabase_user_id_key UNIQUE (supabase_user_id);
  END IF;
END $$;

-- Adicionar constraint de check no plano se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'empresas' AND constraint_name = 'empresas_plano_check'
  ) THEN
    ALTER TABLE empresas ADD CONSTRAINT empresas_plano_check CHECK (plano IN ('basico','pro','premium'));
  END IF;
END $$;

-- =============================================================
-- PARTE 2: Criar tabelas especificas do Licitai
-- =============================================================

CREATE TABLE IF NOT EXISTS licitacoes_cache (
  id_licitacao_gov    TEXT PRIMARY KEY,
  titulo              TEXT NOT NULL,
  objeto              TEXT,
  orgao               TEXT,
  uf                  TEXT,
  modalidade          TEXT,
  data_abertura       TIMESTAMPTZ,
  valor_estimado      NUMERIC,
  link_edital         TEXT,
  data_publicacao     DATE NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_numeros (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID REFERENCES empresas(id) ON DELETE CASCADE,
  numero      TEXT NOT NULL,
  ativo       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS filtros_busca (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID REFERENCES empresas(id) ON DELETE CASCADE,
  palavras_chave  TEXT[] DEFAULT '{}',
  cnaes           TEXT[] DEFAULT '{}',
  estados         TEXT[] DEFAULT '{}',
  valor_minimo    NUMERIC DEFAULT 0,
  ativo           BOOLEAN DEFAULT true,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analise_mercado (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID REFERENCES empresas(id) ON DELETE CASCADE,
  id_licitacao_gov      TEXT REFERENCES licitacoes_cache(id_licitacao_gov),
  licitacoes_analisadas INTEGER,
  vencedor_medio_pct    NUMERIC,
  lance_minimo_pct      NUMERIC,
  lance_maximo_pct      NUMERIC,
  valor_referencia      NUMERIC,
  valor_sugerido_min    NUMERIC,
  valor_sugerido_max    NUMERIC,
  resumo_texto          TEXT,
  whatsapp_enviado      BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, id_licitacao_gov)
);

CREATE TABLE IF NOT EXISTS logs_disparo (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID REFERENCES empresas(id) ON DELETE CASCADE,
  id_licitacao_gov      TEXT REFERENCES licitacoes_cache(id_licitacao_gov),
  numero_whatsapp       TEXT NOT NULL,
  status_envio          TEXT CHECK (status_envio IN ('enviado','falha','pulado')),
  status_participacao   TEXT CHECK (status_participacao IN (
                          'participando','ganhou','perdeu','nao_participou','aguardando'
                        )) DEFAULT NULL,
  valor_contrato        NUMERIC DEFAULT NULL,
  follow_up_enviado     BOOLEAN DEFAULT false,
  follow_up_respondido  BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, id_licitacao_gov)
);

CREATE TABLE IF NOT EXISTS config_prompts (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  conteudo    TEXT NOT NULL,
  versao      INTEGER DEFAULT 1,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- PARTE 3: RLS (Row Level Security)
-- =============================================================

ALTER TABLE empresas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_numeros  ENABLE ROW LEVEL SECURITY;
ALTER TABLE filtros_busca     ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_disparo      ENABLE ROW LEVEL SECURITY;
ALTER TABLE analise_mercado   ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- PARTE 4: Policies (verifica antes de criar para nao duplicar)
-- =============================================================

DO $$
BEGIN
    -- Policy: empresa_propria
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'empresa_propria' AND tablename = 'empresas') THEN
        CREATE POLICY "empresa_propria"
          ON empresas USING (supabase_user_id = auth.uid()::text);
    END IF;

    -- Policy: numeros_da_empresa
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'numeros_da_empresa' AND tablename = 'whatsapp_numeros') THEN
        CREATE POLICY "numeros_da_empresa"
          ON whatsapp_numeros USING (empresa_id IN (
            SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
          ));
    END IF;

    -- Policy: filtros_da_empresa
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'filtros_da_empresa' AND tablename = 'filtros_busca') THEN
        CREATE POLICY "filtros_da_empresa"
          ON filtros_busca USING (empresa_id IN (
            SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
          ));
    END IF;

    -- Policy: logs_da_empresa
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logs_da_empresa' AND tablename = 'logs_disparo') THEN
        CREATE POLICY "logs_da_empresa"
          ON logs_disparo USING (empresa_id IN (
            SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
          ));
    END IF;

    -- Policy: analises_da_empresa
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'analises_da_empresa' AND tablename = 'analise_mercado') THEN
        CREATE POLICY "analises_da_empresa"
          ON analise_mercado USING (empresa_id IN (
            SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
          ));
    END IF;
END
$$;

-- =============================================================
-- VERIFICACAO FINAL: lista as tabelas criadas
-- =============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'empresas','licitacoes_cache','whatsapp_numeros',
    'filtros_busca','logs_disparo','analise_mercado','config_prompts'
  )
ORDER BY table_name;
