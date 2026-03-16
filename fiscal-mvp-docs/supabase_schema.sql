-- 1. EXTENSÕES
-- Necessária para criptografia de credenciais (pgp_sym_encrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABELAS (CONFORME PRD 2.2)

-- Contadores (clientes do produto)
CREATE TABLE IF NOT EXISTS contadores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT UNIQUE NOT NULL,
  nome            TEXT NOT NULL,
  email           TEXT NOT NULL,
  whatsapp        TEXT,
  plano           TEXT DEFAULT 'basico' CHECK (plano IN ('basico', 'pro', 'premium')),
  ativo           BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Empresas monitoradas por contador
CREATE TABLE IF NOT EXISTS empresas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id     UUID REFERENCES contadores(id) ON DELETE CASCADE NOT NULL,
  cnpj            TEXT NOT NULL,
  razao_social    TEXT NOT NULL,
  ativo           BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contador_id, cnpj)
);

-- Resultados das consultas fiscais
CREATE TABLE IF NOT EXISTS consultas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('limpo','pendente','falha','verificacao_manual','indisponivel')),
  pendencias      JSONB DEFAULT '[]',
  diagnostico     TEXT,
  pdf_url         TEXT,
  screenshot_url  TEXT,
  tentativas      INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Credenciais criptografadas
CREATE TABLE IF NOT EXISTS credenciais (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id     UUID REFERENCES contadores(id) ON DELETE CASCADE NOT NULL,
  cnpj_ecac       TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('certificado_a1','login_senha')),
  dados_enc       TEXT NOT NULL,   -- Armazenar resultado de pgp_sym_encrypt
  validade        DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. SEGURANÇA (RLS - CONFORME PRD 2.3)

ALTER TABLE contadores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE credenciais ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "contador_proprio"      ON contadores  FOR ALL USING (clerk_user_id = auth.uid()::text);
CREATE POLICY "empresas_do_contador"  ON empresas    FOR ALL USING (contador_id IN (SELECT id FROM contadores WHERE clerk_user_id = auth.uid()::text));
CREATE POLICY "consultas_do_contador" ON consultas   FOR ALL USING (empresa_id IN (SELECT id FROM empresas WHERE contador_id IN (SELECT id FROM contadores WHERE clerk_user_id = auth.uid()::text)));
CREATE POLICY "credenciais_proprias"  ON credenciais FOR ALL USING (contador_id IN (SELECT id FROM contadores WHERE clerk_user_id = auth.uid()::text));

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_empresas_contador ON empresas(contador_id);
CREATE INDEX IF NOT EXISTS idx_consultas_empresa ON consultas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_credenciais_contador ON credenciais(contador_id);
