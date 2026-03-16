// migrate_pg.js - Executa SQL via conexao PostgreSQL direta
// Necessario a connection string do Supabase (Settings > Database > Connection string)
// Formato: postgresql://postgres:[senha]@db.qphhyflsukcnincdwxgr.supabase.co:5432/postgres

const { Client } = require('pg')

// Connection string do Supabase
// Pattern: postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
const CONNECTION_STRING = process.env.SUPABASE_DB_URL || 
  'postgresql://postgres.qphhyflsukcnincdwxgr:Licitai2026!@aws-0-us-east-1.pooler.supabase.com:6543/postgres'

const SQL = `
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

ALTER TABLE whatsapp_numeros  ENABLE ROW LEVEL SECURITY;
ALTER TABLE filtros_busca     ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_disparo      ENABLE ROW LEVEL SECURITY;
ALTER TABLE analise_mercado   ENABLE ROW LEVEL SECURITY;
`

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING, ssl: { rejectUnauthorized: false } })
  
  try {
    console.log('Connecting to Supabase PostgreSQL...')
    await client.connect()
    console.log('Connected!')
    
    console.log('Running SQL migration...')
    await client.query(SQL)
    console.log('SUCCESS: All tables created!')
    
    // Verify
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('licitacoes_cache','whatsapp_numeros','filtros_busca','logs_disparo','analise_mercado','config_prompts','empresas')
      ORDER BY table_name
    `)
    console.log('\nTables found in database:')
    rows.forEach(r => console.log(' -', r.table_name))
  } catch (err) {
    console.error('ERROR:', err.message)
  } finally {
    await client.end()
  }
}

main()
