// run_sql.js - Executa o setup do banco via Supabase JS client
// Uso: node scripts/run_sql.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://qphhyflsukcnincdwxgr.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaGh5ZmxzdWtjbmluY2R3eGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxMDQ1MSwiZXhwIjoyMDg5MDg2NDUxfQ.-AnD63jXt3FvDC4YxsJK8gDInnEfhu7X0mhdGxoN2nw'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Statements individuais (sem acentos nos comentários para evitar encoding)
const statements = [
  // Tabela licitacoes_cache
  `CREATE TABLE IF NOT EXISTS licitacoes_cache (
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
  )`,

  // Tabela whatsapp_numeros
  `CREATE TABLE IF NOT EXISTS whatsapp_numeros (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id  UUID REFERENCES empresas(id) ON DELETE CASCADE,
    numero      TEXT NOT NULL,
    ativo       BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
  )`,

  // Tabela filtros_busca
  `CREATE TABLE IF NOT EXISTS filtros_busca (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id      UUID REFERENCES empresas(id) ON DELETE CASCADE,
    palavras_chave  TEXT[] DEFAULT '{}',
    cnaes           TEXT[] DEFAULT '{}',
    estados         TEXT[] DEFAULT '{}',
    valor_minimo    NUMERIC DEFAULT 0,
    ativo           BOOLEAN DEFAULT true,
    updated_at      TIMESTAMPTZ DEFAULT now()
  )`,

  // Tabela analise_mercado
  `CREATE TABLE IF NOT EXISTS analise_mercado (
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
  )`,

  // Tabela logs_disparo
  `CREATE TABLE IF NOT EXISTS logs_disparo (
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
  )`,

  // Tabela config_prompts
  `CREATE TABLE IF NOT EXISTS config_prompts (
    id          TEXT PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    conteudo    TEXT NOT NULL,
    versao      INTEGER DEFAULT 1,
    updated_at  TIMESTAMPTZ DEFAULT now()
  )`,

  // Enable RLS
  `ALTER TABLE whatsapp_numeros  ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE filtros_busca     ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE logs_disparo      ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE analise_mercado   ENABLE ROW LEVEL SECURITY`,

  // Policies
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'numeros_da_empresa' AND tablename = 'whatsapp_numeros') THEN
      CREATE POLICY "numeros_da_empresa" ON whatsapp_numeros USING (empresa_id IN (
        SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
      ));
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'filtros_da_empresa' AND tablename = 'filtros_busca') THEN
      CREATE POLICY "filtros_da_empresa" ON filtros_busca USING (empresa_id IN (
        SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
      ));
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logs_da_empresa' AND tablename = 'logs_disparo') THEN
      CREATE POLICY "logs_da_empresa" ON logs_disparo USING (empresa_id IN (
        SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
      ));
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'analises_da_empresa' AND tablename = 'analise_mercado') THEN
      CREATE POLICY "analises_da_empresa" ON analise_mercado USING (empresa_id IN (
        SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
      ));
    END IF;
  END $$`,
]

async function run() {
  console.log('=== Licitai DB Setup ===')
  let success = 0
  let failed = 0

  for (const [i, sql] of statements.entries()) {
    const label = sql.trim().split('\n')[0].substring(0, 60).replace(/\s+/g, ' ')
    try {
      const { error } = await supabase.rpc('exec', { sql })
      
      // PostgREST nao tem rpc exec, usar query direta
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql })
      })
      
      if (res.ok) {
        console.log(`OK [${i+1}/${statements.length}]: ${label}...`)
        success++
      } else {
        const body = await res.text()
        console.log(`ERRO [${i+1}/${statements.length}]: ${label}...`)
        console.log('  Detalhe:', body.substring(0, 200))
        failed++
      }
    } catch (err) {
      console.log(`EXCECAO [${i+1}/${statements.length}]: ${label}...`)
      console.log('  Erro:', err.message)
      failed++
    }
  }

  console.log(`\nResultado: ${success} OK, ${failed} ERROS`)
}

run().catch(console.error)
