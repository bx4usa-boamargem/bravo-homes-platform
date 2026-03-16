# FISCAL MVP V1 — DEVELOPMENT EXECUTION ORDER

## DOCUMENT CLASSIFICATION
- **Document Type:** Execution Order
- **Authority Level:** LEVEL 2 — Implementation Sequence Governance
- **Version:** 1.1
- **Status:** ACTIVE — BINDING

> **No phase may be skipped. Each phase requires sign-off before proceeding.**
> **UI cannot be implemented until the engine is verified end-to-end.**

---

## PHASE GATE RULES

1. **No Phase Skipping** — complete all acceptance criteria before opening the next phase
2. **Engine Before UI** — backend + agents must be fully functional before any Next.js screen is built
3. **Security First** — RLS and encryption must be active before any real client data is touched
4. **Validate Before Scale** — minimum 3 manual runs with real accountants before automating

---

## PHASE 0: FOUNDATION & SECURITY
**Target: Week 1 (Days 1–3)**

### Tasks
- [ ] Initialize Next.js 14 project and deploy to Vercel (domain configured)
- [ ] Configure Clerk authentication (sign-in, sign-up, user session)
- [ ] Create Supabase project and run schema from PRD Section 2.2 (all 4 tables)
- [ ] Enable `pgcrypto` extension in Supabase
- [ ] Apply all 4 RLS policies from PRD Section 2.3
- [ ] Create `.env.local` with all required environment variables (never commit to git)
- [ ] Add `.env*` to `.gitignore` — verify before first push
- [ ] Configure Antigravity workspace and install AIOS

### Required Environment Variables
```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=          # Backend only — never use anon key server-side
SUPABASE_ENCRYPTION_KEY=       # Long random string for pgcrypto master key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
WHATSAPP_API_URL=
WHATSAPP_API_KEY=
```

### Acceptance Criteria
- [ ] User can sign up and log in via Clerk
- [ ] After login, user sees only their own data (RLS verified by attempting cross-account query — must return 0 rows)
- [ ] `pgcrypto` can encrypt and decrypt a test credential via SQL console

---

## PHASE 1: ANTIGRAVITY SKILLS & CORE ENGINE
**Target: Week 1–2 (Days 3–7)**

### 1.1 Create Global Skills
Copy to `C:\Users\wylla\.gemini\antigravity\skills\` (one folder per skill):

| Skill Folder | Purpose |
|-------------|---------|
| `contexto-produto` | Agent identity and scope boundaries |
| `navegacao-gov-br` | e-CAC, Simples Nacional, PGFN navigation expertise |
| `falha-segura` | Anti-false-positive protocol (CRITICAL) |
| `seguranca-credenciais` | Credential handling rules |
| `linguagem-contabil` | Technical → human PT-BR translation + WhatsApp format |
| `json-supabase` | Mandatory structured output schema |

### 1.2 Create Agents
In Antigravity AIOS, create agents using EXACT filenames from Section 3 of the MASTER_SYSTEM_PROMPT:

| File | LLM | Role |
|------|-----|------|
| `ecac-browser.yaml` | Claude Sonnet | Browser navigation + data extraction |
| `diagnostico.yaml` | Claude Sonnet | Diagnosis + WhatsApp message generation |
| `maestro.yaml` | Claude Haiku | Orchestration (no complex reasoning needed) |

### 1.3 Test Core Engine
- [ ] `ecac-browser.yaml` successfully logs into e-CAC using YOUR OWN CNPJ (no client data yet)
- [ ] Agent returns correctly structured JSON matching PRD Section 3.2 schema
- [ ] Screenshot is saved
- [ ] Status field is populated correctly (not hardcoded)

### Acceptance Criteria
- [ ] `ecac-browser.yaml` runs end-to-end with a test CNPJ
- [ ] Output JSON matches PRD Section 3.2 schema exactly
- [ ] No credentials appear in any log output (only `[REDACTED]`)

---

## PHASE 2: ORCHESTRATION & DELIVERY
**Target: Week 2 (Days 8–12)**

### Tasks
- [ ] Configure Google Drive API — create folder structure: `/fiscal-mvp/{contador_id}/{cnpj}/`
- [ ] Connect `ecac-browser.yaml` to Google Drive (PDF upload after successful consultation)
- [ ] Set up Evolution API on VPS (WhatsApp connection)
- [ ] Create `diagnostico.yaml` and test WhatsApp message formatting
- [ ] Create `maestro.yaml` orchestrator
- [ ] Run full pipeline manually: Supabase → Maestro → e-CAC → Drive → Diagnóstico → WhatsApp

### Acceptance Criteria
- [ ] Full pipeline runs from start to finish with 3 test CNPJs
- [ ] Results saved correctly to `consultas` table in Supabase
- [ ] PDF uploaded to Google Drive with correct folder structure
- [ ] WhatsApp message received with correct format (per `linguagem-contabil` skill)
- [ ] No plaintext credentials appear anywhere in logs

---

## PHASE 3: MANUAL VALIDATION WITH REAL ACCOUNTANTS
**Target: Week 3 (Days 13–18)**

> **NO UI IS BUILT IN THIS PHASE. ZERO NEXT.JS CODE.**
> Validation must happen with real data before UI investment.

### Tasks
- [ ] Identify 3 accountant contacts (pilots)
- [ ] Have each sign the Contrato de Prestação de Serviços + Termo de Outorga de Acesso
- [ ] Insert accountants manually into `contadores` table
- [ ] Insert their client CNPJs manually into `empresas` table
- [ ] Store their credentials encrypted into `credenciais` table
- [ ] Run Maestro manually at **07:30 AM** for 5 consecutive business days
- [ ] Be online during each run to handle failures manually
- [ ] Collect feedback after each delivery

### Acceptance Criteria
- [ ] All 3 accountants receive WhatsApp report by 08:00 AM on 3 consecutive days
- [ ] Zero false positives (no CNPJ marked "limpo" that has a real pendência)
- [ ] Feedback collected: what was missing? what was perfect?
- [ ] At least 1 signed contract and first payment received

---

## PHASE 4: MINIMUM DASHBOARD
**Target: Week 5–6 (Days 29–42)**

> **Only build what was validated in Phase 3. No new features.**

### Screens to Build (exact routes from UI_SPEC)

| Route | Screen | Priority |
|-------|--------|---------|
| `/client/dashboard` | Metrics overview + recent consultations | 🔴 First |
| `/client/empresas` | CNPJ list + Add CNPJ modal | 🔴 Second |
| `/client/consultas` | Fiscal status table + PDF download | 🔴 Third |

### Tasks
- [ ] Build `/client/dashboard` per UI_SPEC Screen 01
- [ ] Build `/client/empresas` per UI_SPEC Screen 02
- [ ] Build `/client/consultas` per UI_SPEC Screen 03
- [ ] Configure Supabase RLS for frontend (use anon key + JWT, NOT service key)
- [ ] Security test: log in as Accountant A, attempt to access Accountant B's CNPJs — must return 0 results
- [ ] Deploy to Vercel with custom domain
- [ ] Migrate 3 pilot accountants to use the dashboard

### Acceptance Criteria
- [ ] Accountant can self-serve: add CNPJ, view status, download PDF
- [ ] One accountant CANNOT see another's data (tested and confirmed)
- [ ] Dashboard loads correctly on mobile (accountants will check on their phones)

---

## PHASE 5: AUTOMATION & SCALE
**Target: Week 7–8 (after 10 paying clients)**

- [ ] Configure Supabase Scheduled Function (cron) to trigger Maestro at 07:30 AM daily
- [ ] Set up internal alert: Telegram or Slack bot notifies YOU if >30% of runs fail
- [ ] Monitor cost per client vs revenue per client
- [ ] At 10 clients: evaluate Supabase Pro upgrade (~R$120/mês)
- [ ] Document the 5 most common failure types and create standard responses

### Acceptance Criteria
- [ ] System runs 5 consecutive days with zero manual intervention
- [ ] You receive failure alerts before clients do
- [ ] 10 paying clients confirmed
