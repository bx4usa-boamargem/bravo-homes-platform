# FISCAL MVP V1 — PRODUCT REQUIREMENTS DOCUMENT

## DOCUMENT CLASSIFICATION
- **Document Type:** Product Requirements Document (PRD)
- **Authority Level:** LEVEL 1 — ABSOLUTE SOURCE OF TRUTH
- **Version:** 1.1
- **Status:** ACTIVE — BINDING

> **IF conflict exists between any other document and this PRD, this PRD ALWAYS wins.**

---

## 1. PRODUCT IDENTITY

**What it IS:**
A SaaS platform for accounting firms that automatically monitors the fiscal situation of their clients (CNPJs) in Brazilian government portals (e-CAC, Simples Nacional, PGFN) and delivers intelligent diagnostics via WhatsApp.

**What it is NOT:**
- NOT a tax advisory system
- NOT a financial transaction tool
- Does NOT pay bills, generate guias, or submit declarations
- Does NOT replace the judgment of the accountant

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Component Responsibilities

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| Admin App | Next.js 14 + Clerk | UI for accountants to manage CNPJs and view reports |
| Backend | Supabase (PostgreSQL) | Data persistence with strict RLS and pgcrypto encryption |
| Generation Engine | Antigravity AIOS | AI multi-agent pipeline: navigation, extraction, summarization |
| Delivery | Evolution API | WhatsApp message dispatch to accountants |
| PDF Storage | Google Drive API | Store downloaded CNDs and certidões by accountant/CNPJ |

### 2.2 Data Model — Exact Schema

> Use these exact table and column names everywhere. No aliases, no variations.

```sql
-- Accountants (product customers)
CREATE TABLE contadores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT UNIQUE NOT NULL,
  nome            TEXT NOT NULL,
  email           TEXT NOT NULL,
  whatsapp        TEXT,
  plano           TEXT DEFAULT 'basico',  -- 'basico' | 'pro' | 'premium'
  ativo           BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- CNPJs being monitored per accountant
CREATE TABLE empresas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id     UUID REFERENCES contadores(id) ON DELETE CASCADE,
  cnpj            TEXT NOT NULL,
  razao_social    TEXT,
  ativo           BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contador_id, cnpj)
);

-- Results of each fiscal check
CREATE TABLE consultas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID REFERENCES empresas(id) ON DELETE CASCADE,
  status          TEXT NOT NULL CHECK (status IN ('limpo','pendente','falha','verificacao_manual','indisponivel')),
  pendencias      JSONB DEFAULT '[]',
  diagnostico     TEXT,
  pdf_url         TEXT,
  screenshot_url  TEXT,
  tentativas      INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Encrypted credentials per accountant (LGPD critical)
CREATE TABLE credenciais (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id     UUID REFERENCES contadores(id) ON DELETE CASCADE,
  cnpj_ecac       TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('certificado_a1','login_senha')),
  dados_enc       TEXT NOT NULL,   -- pgp_sym_encrypt(json, MASTER_KEY)
  validade        DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 Row Level Security (RLS) — Mandatory

```sql
ALTER TABLE contadores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE credenciais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contador_proprio"      ON contadores  USING (clerk_user_id = auth.uid()::text);
CREATE POLICY "empresas_do_contador"  ON empresas    USING (contador_id IN (SELECT id FROM contadores WHERE clerk_user_id = auth.uid()::text));
CREATE POLICY "consultas_do_contador" ON consultas   USING (empresa_id IN (SELECT id FROM empresas WHERE contador_id IN (SELECT id FROM contadores WHERE clerk_user_id = auth.uid()::text)));
CREATE POLICY "credenciais_proprias"  ON credenciais USING (contador_id IN (SELECT id FROM contadores WHERE clerk_user_id = auth.uid()::text));
```

---

## 3. AGENT PIPELINE (ANTIGRAVITY AIOS)

### Execution Schedule
**Daily trigger: 07:30 AM (Brasília, UTC-3)**
Target delivery to accountants: **08:00 AM**

### 3.1 Agent Definitions

#### `maestro.yaml` — Orchestrator
- **Trigger:** Scheduled cron at 07:30 AM daily (Supabase Scheduled Function)
- **LLM:** Claude Haiku (orchestration only — no complex reasoning needed)
- **Flow:**
  1. `SELECT * FROM empresas WHERE ativo = true` (grouped by `contador_id`)
  2. For each empresa: invoke `ecac-browser.yaml`, pass `{empresa_id, cnpj, credencial_enc}`
  3. Await result with 5-minute timeout per empresa
  4. Save result to `consultas` table
  5. Group results by `contador_id`
  6. For each contador: invoke `diagnostico.yaml`, pass grouped results
  7. Log full execution (success count, failure count, duration)
- **Alert rule:** If >30% of empresas fail in the same run, notify operator via Telegram/Slack BEFORE sending to accountants

#### `ecac-browser.yaml` — Browser Agent
- **LLM:** Claude Sonnet (browser navigation requires situational reasoning)
- **Skills:** `navegacao-gov-br`, `falha-segura`, `seguranca-credenciais`
- **Input variables:** `{cnpj_ecac}`, `{cnpj_consulta}`, `{credencial_tipo}`, `{drive_pasta_id}`
- **Flow:**
  1. Decrypt credential from env (never from plain text input)
  2. Login to https://cav.receita.fazenda.gov.br
  3. Select CNPJ outorgante profile when prompted
  4. Navigate: Serviços → Certidões → Emitir CND/CPEND
  5. Enter `{cnpj_consulta}`
  6. Wait up to 60 seconds for result
  7. Take screenshot (always — regardless of outcome)
  8. If limpo: download PDF, upload to Google Drive, record `pdf_url`
  9. If pendente: capture exact text of each pendência
  10. Return structured JSON (schema defined in `json-supabase` skill)
- **Retry logic:** 3 attempts (immediate → +3 min → +10 min). After 3 failures: status = `indisponivel`, notify operator.

#### `diagnostico.yaml` — Diagnostic & Delivery Agent
- **LLM:** Claude Sonnet (natural PT-BR language quality matters)
- **Skills:** `linguagem-contabil`, `json-supabase`
- **Input:** Grouped JSON results for one contador
- **Logic:**
  - `limpo` → short confirmation message (do not alarm)
  - `pendente` → identify type, estimate value, suggest concrete next action, ask if accountant wants the guia downloaded
  - `falha` / `verificacao_manual` → inform, give next automatic retry time
- **Output:** WhatsApp message dispatched via Evolution API

### 3.2 JSON Result Schema (all agents must use)

```json
{
  "cnpj": "XX.XXX.XXX/XXXX-XX",
  "razao_social": "Nome da Empresa Ltda",
  "data_consulta": "2025-01-15T07:45:00-03:00",
  "status": "limpo | pendente | falha | verificacao_manual | indisponivel",
  "pendencias": [
    {
      "tipo": "FGTS | INSS | Simples | PGFN | Municipal | Estadual",
      "descricao": "Descrição humana da pendência",
      "valor_estimado": 450.00,
      "vencimento": "2025-02-10",
      "guia_disponivel": true
    }
  ],
  "pdf_url": "https://drive.google.com/...",
  "screenshot_url": "https://drive.google.com/...",
  "tentativas": 1,
  "proximo_passo": "Descrição da ação recomendada"
}
```

---

## 4. SECURITY & LGPD — CRITICAL NON-NEGOTIABLES

1. **RLS is mandatory** on all 4 tables from day 1. Never disable for convenience.
2. **Credentials are never stored in plain text.** Always use `pgp_sym_encrypt` via `pgcrypto`.
3. **Decryption happens only in memory** during agent execution. Never logged, never returned in API responses.
4. **HTTPS everywhere.** Vercel provides automatic SSL — do not bypass.
5. **Access logs** must be retained for at least 6 months (LGPD requirement).
6. **One accountant CANNOT see another accountant's data** — enforced at DB level via RLS, not just at app level.

---

## 5. PRICING MODEL

| Plan | Price | CNPJs | Frequency |
|------|-------|-------|-----------|
| Básico | R$297/mês | Up to 20 | Daily |
| Pro | R$497/mês | Up to 50 | 2x daily |
| Premium | R$997/mês | Unlimited | Near real-time |
