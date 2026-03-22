# 👨‍⚖️ Sr. Juiz — Relatório de Auditoria Técnica

## Projeto: Bravo Homes Platform

**Data:** 22/03/2026  
**Escopo:** Análise completa do repositório `bravo-homes-platform-main`

---

## Visão Geral do Projeto

O Bravo Homes Platform é uma plataforma de gestão de projetos de home remodeling (reformas residenciais) na região de Atlanta Metro, GA. Composta por:

| Componente | Tecnologia | Linhas aprox. |
|---|---|---|
| Frontend React (SPA) | React 19 + Vite + Tailwind + TypeScript | ~4.600 |
| Bravo Scout (Agente 1) | Python + FastAPI | ~560 |
| Bravo Qualifier (Agente 2) | Python + FastAPI + OpenAI GPT-4o | ~490 |
| SQL Migrations | PostgreSQL (Supabase) | ~250 |
| HTML Standalone | 4 arquivos HTML legados | ~345K chars |

---

## Sumário Executivo

| Severidade | Quantidade |
|---|---|
| 🔴 Crítico | 3 |
| 🟠 Alto | 5 |
| 🟡 Médio | 7 |
| 🟢 Baixo | 4 |
| **Total** | **19** |

### 🚨 Top 3 Problemas Mais Críticos

1. **Chaves secretas expostas no repositório** — `.env` com tokens reais de Supabase, OpenAI e Service Role Key commitados
2. **Rotas sem proteção de autenticação** — Qualquer pessoa pode acessar `/admin`, `/partner`, `/client` sem login
3. **Arquivo monolítico de 2.441 linhas** — `AdminDashboard.tsx` com toda a lógica em um único componente

---

## Problemas Detalhados

---

### 🔍 PROBLEMA #1
📁 **Local:** `.env` (raiz), `bravo-qualifier/.env`  
🚦 **Severidade:** 🔴 Crítico  
📌 **Descrição:** Chaves secretas reais estão commitadas no repositório: `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `SUPABASE_ACCESS_TOKEN` e `VITE_SUPABASE_ANON_KEY`. O `.gitignore` lista `.env` e `.env.*`, porém os arquivos existem no repositório, indicando que foram commitados antes do `.gitignore` ser configurado ou que o `.gitignore` foi ignorado.  
⚠️ **Impacto:** Qualquer pessoa com acesso ao repositório pode: (a) ter acesso irrestrito ao banco Supabase com a Service Role Key (bypass total do RLS), (b) usar sua conta OpenAI para consumo ilimitado, (c) acessar e modificar todos os dados de produção.  
🛠️ **Como corrigir:**  
1. Revogar imediatamente **todas** as chaves expostas (Supabase Dashboard → Settings → API, OpenAI Dashboard)
2. Gerar novas chaves
3. Limpar o histórico Git com `git filter-branch` ou BFG Repo Cleaner
4. Garantir que `.env` esteja no `.gitignore` **antes** de commitar
5. Usar variáveis de ambiente no deploy (Vercel, Fly.io)

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #2
📁 **Local:** [App.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/App.tsx) — todas as rotas  
🚦 **Severidade:** 🔴 Crítico  
📌 **Descrição:** As rotas `/admin`, `/partner`, `/client` não possuem nenhum componente de proteção (`PrivateRoute`, `AuthGuard` etc.). Qualquer pessoa pode digitar `/admin` na URL e acessar o dashboard administrativo. A verificação de role existe **dentro** de cada dashboard (após o `fetchData`), mas há uma janela onde o conteúdo completo é renderizado antes do redirect.  
⚠️ **Impacto:** Exposição temporária de dados sensíveis (leads, clientes, financeiro) a usuários não autenticados. O frontend carrega e faz queries ao Supabase antes de verificar o role — sem RLS bem configurado, dados podem vazar.  
🛠️ **Como corrigir:**  
1. Criar um componente `ProtectedRoute` que verifica sessão ativa antes de renderizar
2. Envolver as rotas protegidas com esse componente
3. Adicionar verificação de role no `ProtectedRoute`
4. Mostrar loading/spinner enquanto verifica autenticação

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #3
📁 **Local:** [AdminDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/AdminDashboard.tsx) — 2.441 linhas  
🚦 **Severidade:** 🔴 Crítico  
📌 **Descrição:** O arquivo contém **toda** a lógica e UI do admin em um único componente React: ~100 states (`useState`), lógica de CRUD de leads/projetos/parceiros/calendário/chat/profile, drag & drop, Google Calendar sync, gravação de áudio, upload de arquivos, e toda a renderização JSX.  
⚠️ **Impacto:** Inmantenível. Qualquer alteração exige navegar nesse arquivo gigante. Re-renders desnecessários do componente inteiro. Impossível testar unidades individuais. Mesmo padrão em `PartnerDashboard.tsx` (1.577 linhas).  
🛠️ **Como corrigir:**  
1. Extrair sub-componentes por aba: `LeadPipeline`, `CalendarTab`, `ChatPanel`, `PartnerManager`, `Settings`
2. Usar custom hooks para lógica reutilizável: `useLeads()`, `useCalendar()`, `useChat()`
3. Mover funções helper (formatTime, parseNotes) para `src/lib/utils.ts`
4. Pasta `src/components/` está **vazia** — deve ser preenchida

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #4
📁 **Local:** [AdminDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/AdminDashboard.tsx), [PartnerDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/PartnerDashboard.tsx), [ClientDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/ClientDashboard.tsx)  
🚦 **Severidade:** 🟠 Alto  
📌 **Descrição:** Uso massivo de `any` como tipo TypeScript em todo o projeto. Exemplos:  
- `useState<any[]>([])` para leads, projects, partners, clients (~15 instâncias)
- `useState<any>(null)` para user, selectedLead, editingEvent (~10 instâncias)
- Parâmetros `(e: any)`, `(info: any)`, `(msg: any)` em funções
⚠️ **Impacto:** Anula completamente o propósito do TypeScript. Bugs de tipo não são detectados em compilação. Autocomplete do IDE não funciona. Refatorações ficam arriscadas pois não há contratos de tipo.  
🛠️ **Como corrigir:**  
1. Criar interfaces em `src/types/`: `Lead`, `Project`, `Partner`, `Client`, `CalendarEvent`, `Message`
2. Substituir todos os `any` por tipos concretos
3. Habilitar `strict: true` no tsconfig (se não estiver)

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #5
📁 **Local:** [ClientDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/ClientDashboard.tsx) — linhas 143-302  
🚦 **Severidade:** 🟠 Alto  
📌 **Descrição:** O dashboard do cliente contém **dados hardcoded de demonstração** misturados com dados dinâmicos do Supabase. Exemplos:  
- `"Marcus está na Etapa 4 de 8"` (linha 149) — texto fixo
- `"Johnson Family"` como fallback (linha 143)
- `"$14,550"` como próximo pagamento (linha 170)
- `"Marcus Rivera"` como contratado (linha 213)
- Timeline inteira hardcoded (linhas 265-302)
- Abas `stages`, `pagamentos`, `chat`, `aprovacoes`, `documentos`, `avaliacao` mostram apenas `🚧` placeholder
⚠️ **Impacto:** O cliente vê informações falsas que não correspondem ao seu projeto real. Abas essenciais (pagamentos, chat, documentos) não funcionam. Cria expectativas falsas durante demonstrações.  
🛠️ **Como corrigir:**  
1. Buscar dados reais das tabelas `stages`, `project_documents`, `messages`
2. Remover todos os textos hardcoded
3. Implementar as abas em estado placeholder com mensagem clara ou implementar funcionalidade real

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #6
📁 **Local:** [Login.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/Login.tsx) — linha 87-93, 206  
🚦 **Severidade:** 🟠 Alto  
📌 **Descrição:** Múltiplos problemas no fluxo de autenticação:  
1. Função `fillDemo()` (linha 87) navega diretamente para `/admin` ou `/partner` sem autenticação real — bypass completo do login
2. No registro (linha 206), o `<select>` do perfil (role) não é vinculado a nenhum state nem enviado no `signUp` — o role escolhido pelo usuário é ignorado
3. A role default na linha 56 é `'admin'` — se o profile não tem role, o usuário é redirecionado ao admin dashboard
⚠️ **Impacto:** (1) Login bypass permite acesso sem credenciais; (2) Novo usuário registra como "cliente" mas não recebe essa role; (3) Falha na atribuição de role pode dar acesso admin a qualquer usuário.  
🛠️ **Como corrigir:**  
1. Remover `fillDemo()` ou protegê-lo para ambiente de desenvolvimento apenas
2. Vincular o select de role a um state e enviá-lo no `signUp.options.data`
3. Mudar o fallback de role para um valor seguro como `'cliente'` ao invés de `'admin'`

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #7
📁 **Local:** [PartnerDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/PartnerDashboard.tsx) — linha 76, linha 222, linha 704  
🚦 **Severidade:** 🟠 Alto  
📌 **Descrição:**  
1. **Null reference potencial** (linha 76): `currentUser.id` é acessado sem null check — se `getUser()` retorna null, causa crash
2. **URL do Supabase hardcoded** (linha 222): `const SUPABASE_URL = 'https://tyeaqluofishcvhvpwrg.supabase.co'` — duplicado com a variável de ambiente
3. **Data hardcoded** (linha 704): `"Qua, 24 Março 2026"` é estática, não reflete a data real  
⚠️ **Impacto:** (1) Crash em produção se sessão expirar; (2) URLs ficam inconsistentes entre ambientes; (3) Informação enganosa para o usuário.  
🛠️ **Como corrigir:**  
1. Adicionar null check: `if (!currentUser) { navigate('/'); return; }`
2. Usar `import.meta.env.VITE_SUPABASE_URL` ao invés de hardcode
3. Usar `new Date().toLocaleDateString()` para data dinâmica

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #8
📁 **Local:** [AdminDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/AdminDashboard.tsx) — linhas 156, 161; [PartnerDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/PartnerDashboard.tsx) — linha 161  
🚦 **Severidade:** 🟠 Alto  
📌 **Descrição:** Após criar um projeto com sucesso, o código usa `setTimeout(() => window.location.reload(), 1000)` para atualizar a UI. Isso é um anti-pattern que: recarrega toda a aplicação, perde state de outras abas, causa flash visual, e depende de timing arbitrário.  
⚠️ **Impacto:** UX degradada, perda de contexto do usuário, inconstência se a rede for lenta (o reload pode executar antes do insert terminar).  
🛠️ **Como corrigir:**  
1. Após a inserção bem-sucedida, atualizar o state local (já existe `setProjects` em outros CRUD)
2. Buscar o registro recém-criado com `.select().single()` e adicioná-lo ao state
3. Remover todos os `window.location.reload()`

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #9
📁 **Local:** `bravo-migration.sql` vs. código do frontend  
🚦 **Severidade:** 🟡 Médio  
📌 **Descrição:** O schema SQL define tabelas com nomes e colunas diferentes do que o frontend utiliza. Exemplos:  
- SQL: `users` → Frontend: queries em `profiles`
- SQL: `project_stages` → Frontend: queries em `stages`
- SQL: `progress_pct` → Frontend: usa `progress`
- SQL: `messages.conversation_id` → Frontend: usa `sender_id`/`receiver_id`
- SQL: `project_photos` → Frontend: usa `project_documents`
- Existem **4 arquivos SQL diferentes** (`bravo-migration.sql`, `rebuild_db.sql`, `supabase_schema.sql`, `database_migration.sql`) com schemas divergentes
⚠️ **Impacto:** Impossível saber qual schema é o real em produção. Novos devs serão confundidos. Scripts de migração podem quebrar se executados na ordem errada.  
🛠️ **Como corrigir:**  
1. Consolidar em um único arquivo de migração (`migrations/001_initial_schema.sql`)
2. Arquivar os obsoletos (mover para `_deprecated/`)
3. Documentar qual é o schema ativo

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #10
📁 **Local:** Raiz do projeto  
🚦 **Severidade:** 🟡 Médio  
📌 **Descrição:** A raiz do projeto contém **46 arquivos** misturados: scripts utilitários (`apply_rls.js`, `check_schema.js`, `create_bucket.js`, `fetch_schema.js`, etc.), arquivos HTML legados (`bravo-admin.html`, `bravo-cliente.html` etc.), documentos Word, PDFs, imagens de logo, zips — tudo na raiz.  
⚠️ **Impacto:** Projeto confuso, difícil distinguir código de produção de utilitários de debug. Arquivos binários (docx, pdf, zip, jpeg) pesam no repositório Git.  
🛠️ **Como corrigir:**  
1. Mover scripts utilitários para `scripts/`
2. Mover HTMLs legados para `_legacy/`  
3. Mover documentos e imagens para `docs/` e `public/images/`
4. Remover arquivos duplicados (ex: dois `.docx` similares, `.pdf` + `.pdf.zip`)

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #11
📁 **Local:** Projeto inteiro  
🚦 **Severidade:** 🟡 Médio  
📌 **Descrição:** Não existe **nenhum teste** no frontend React. O `bravo-qualifier` tem um `test_qualifier.py`, mas o `bravo-scout` não tem testes. O `keyword_engine.py` tem testes inline (via `if __name__ == "__main__"`) mas não usa nenhum framework de teste.  
⚠️ **Impacto:** Zero confiança ao fazer mudanças. Regressões passam despercebidas. Não é possível validar que qualificação de leads funciona corretamente após refatorações.  
🛠️ **Como corrigir:**  
1. Frontend: adicionar pelo menos testes de integração para fluxos críticos (login, criação de lead)
2. Backend: converter testes inline para `pytest`
3. Adicionar script `npm test` e `pytest` nos respectivos `package.json`/`Makefile`

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #12
📁 **Local:** [AdminDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/AdminDashboard.tsx) — linhas 232-253; toda a renderização JSX  
🚦 **Severidade:** 🟡 Médio  
📌 **Descrição:** Estilos inline extensivos com objetos `style={{...}}` diretamente no JSX. O popup de e-mail (linhas 232-253 do `Login.tsx`) tem ~20 propriedades CSS inline. Toast messages, modais e vários elementos usam o mesmo padrão ao invés de classes CSS.  
⚠️ **Impacto:** Impossível manter consistência visual. Cada alteração de estilo requer mudança no código TypeScript. Performance sutilmente impactada pois objetos CSS são recriados a cada render.  
🛠️ **Como corrigir:**  
1. Mover estilos inline para classes CSS nos respectivos arquivos `.css`
2. Usar classes utilitárias do Tailwind (já instalado) ou criar componentes reutilizáveis

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #13
📁 **Local:** [AdminDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/AdminDashboard.tsx) — linhas 249-335 (useEffect com fetchData)  
🚦 **Severidade:** 🟡 Médio  
📌 **Descrição:** O `useEffect` principal faz **8 queries sequenciais** ao Supabase no mount — projects, leads, landing_pages, clients, profiles, messages, calendar_events + Google Calendar. Todas são `await` sequenciais (não paralelizadas). O eslint warning `[navigate]` está missing na dependency array.  
⚠️ **Impacto:** Tempo de carregamento desnecessariamente longo (8 round-trips sequenciais). Memory leaks potenciais se o componente desmontar antes das queries completarem.  
🛠️ **Como corrigir:**  
1. Usar `Promise.all()` para paralelizar as queries independentes
2. Adicionar cleanup/AbortController no useEffect
3. Considerar um state manager leve (React Query/TanStack Query) para cache e revalidação

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #14
📁 **Local:** [AdminDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/AdminDashboard.tsx) — linha 229; [PartnerDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/PartnerDashboard.tsx) — linhas 229, 256  
🚦 **Severidade:** 🟡 Médio  
📌 **Descrição:** Tokens do Google são armazenados em `localStorage` ("google_provider_token"). Tokens OAuth não devem ficar em localStorage pois são vulneráveis a XSS. Também não há verificação de expiração — o token pode ficar inválido e causar erros silenciosos.  
⚠️ **Impacto:** Se houver qualquer vulnerabilidade XSS, atacante pode roubar o token Google e acessar o calendário do usuário.  
🛠️ **Como corrigir:**  
1. Usar o token diretamente do `session.provider_token` do Supabase (já disponível na sessão)
2. Não armazenar tokens OAuth em localStorage
3. Verificar expiração antes de usar

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #15
📁 **Local:** [bravo-scout/scrapers/](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/bravo-scout/scrapers/)  
🚦 **Severidade:** 🟡 Médio  
📌 **Descrição:** Os scrapers fazem web scraping de sites como Craigslist, Reddit e Yelp. Potenciais problemas legais e técnicos: violação de Terms of Service, sem rate limiting configurável, sem user-agent rotation, sem proxy support.  
⚠️ **Impacto:** IP pode ser banido. Possíveis ações legais. Scraping instável pois mudanças no HTML dos sites quebram os parsers silenciosamente.  
🛠️ **Como corrigir:**  
1. Verificar ToS de cada plataforma
2. Usar APIs oficiais onde disponíveis (Reddit tem API, Yelp tem Fusion API)
3. Implementar rate limiting, retries com backoff, e logging de falhas
4. Considerar alternativas legais (Google Maps API, etc.)

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #16
📁 **Local:** [package.json](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/package.json) — linha 2, 21  
🚦 **Severidade:** 🟢 Baixo  
📌 **Descrição:** O nome do projeto é `"temp-vite"` (scaffold padrão) e `pg` (node-postgres) está nas dependências — mas é uma dependência de servidor, não de frontend Vite.  
⚠️ **Impacto:** `pg` adiciona peso desnecessário ao bundle do frontend. Nome genérico causa confusão.  
🛠️ **Como corrigir:**  
1. Renomear para `"bravo-homes-platform"`
2. Remover `pg` das dependências (ou mover para scripts server-side)

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #17
📁 **Local:** [bravo-qualifier/main.py](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/bravo-qualifier/main.py) — linha 29; [bravo-scout/main.py](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/bravo-scout/main.py) — linha 31  
🚦 **Severidade:** 🟢 Baixo  
📌 **Descrição:** As estatísticas de runtime (`stats` dict) são armazenadas em variável global na memória. Em ambientes multi-worker (Gunicorn, multi-instance no Fly.io), cada instância terá contadores separados e não sincronizados.  
⚠️ **Impacto:** Estatísticas de `/status` serão incorretas com mais de uma instância. Stats perdem-se ao reiniciar o processo.  
🛠️ **Como corrigir:**  
1. Para simples: aceitar a limitação e documentar
2. Para produção: persistir em Redis ou no próprio Supabase

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #18
📁 **Local:** [AdminDashboard.tsx](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/src/pages/AdminDashboard.tsx) — variável `_isGoogleLinked` (linha 166)  
🚦 **Severidade:** 🟢 Baixo  
📌 **Descrição:** A variável `_isGoogleLinked` usa prefixo `_` para suprimir o aviso de variável não utilizada. Isso indica dead code — o state é setado mas nunca lido na renderização.  
⚠️ **Impacto:** Código morto que confunde. Indica funcionalidade incompleta.  
🛠️ **Como corrigir:** Implementar a verificação visual de "Google Linked" ou remover o state.

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

### 🔍 PROBLEMA #19
📁 **Local:** [bravo-qualifier/supabase_client.py](file:///c:/Users/wylla/.gemini/bravo-homes-platform-main/bravo-qualifier/supabase_client.py) — linhas 146-155  
🚦 **Severidade:** 🟢 Baixo  
📌 **Descrição:** Se a criação do lead falha após criar o cliente (linha 154), o cliente orfão permanece no banco — não há rollback/cleanup.  
⚠️ **Impacto:** Acúmulo de registros de clientes sem leads vinculados, poluindo a base de dados.  
🛠️ **Como corrigir:** Implementar cleanup — se o lead falhar, deletar o cliente recém-criado. Ou usar uma transação atômica (RPC no Supabase).

👨‍⚖️ Sr. Juiz: Deseja que eu aplique esta correção?

---

## Pontos Positivos (breve reconhecimento)

- ✅ Sistema de i18n bem implementado com PT-BR, EN-US e ES
- ✅ Google Calendar sync bidirecional é funcionalidade avançada
- ✅ Keyword engine do bravo-scout é bem pensado com anti-spam
- ✅ Optimistic UI updates nos CRUDs do admin  
- ✅ Qualificação de leads com GPT-4o usando structured output

---

## Próximos Passos

> Deseja que eu detalhe e trate os problemas um por um, ou prefere uma categoria específica primeiro?

Posso abordar por prioridade (🔴 Críticos primeiro) ou por categoria (Segurança, Arquitetura, etc.).
