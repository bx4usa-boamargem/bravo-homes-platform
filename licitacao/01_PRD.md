# LICITAI — PRODUCT REQUIREMENTS DOCUMENT

## DOCUMENT CLASSIFICATION
- **Document Type:** Product Requirements Document (PRD)
- **Authority Level:** LEVEL 1 — FONTE ABSOLUTA DA VERDADE
- **Version:** 1.3
- **Status:** ACTIVE — BINDING

> Se houver conflito entre qualquer outro documento e este PRD, este PRD SEMPRE vence.

---

## 1. IDENTIDADE DO PRODUTO

**Nome:** Licitaí

**Tagline:** "Toda licitação da sua área, no seu WhatsApp — com inteligência para você ganhar."

**O que É:**
Uma plataforma SaaS B2B que monitora automaticamente o Portal de Compras do Governo Federal (compras.gov.br), notifica empresas via WhatsApp quando surgem licitações compatíveis com seu segmento, e entrega briefings de inteligência competitiva com a faixa de preço dos vencedores históricos na véspera de cada prazo.

**O que NÃO É:**
- NÃO é um sistema de participação em licitações
- NÃO elabora propostas nem documentação técnica
- NÃO acessa portais estaduais ou municipais (apenas federal no MVP)
- NÃO é um CRM completo de gestão de oportunidades
- NÃO substitui o assessor de licitações da empresa

---

## 2. PROBLEMA E PÚBLICO-ALVO

### O Problema
Pequenas e médias empresas perdem licitações públicas lucrativas simplesmente por não ficarem monitorando o portal diariamente. Nenhum dono de empresa tem tempo de abrir `compras.gov.br` todo dia e filtrar manualmente centenas de editais publicados.

### Público-Alvo
Empresas com CNPJ ativo que já participam ou querem participar de licitações federais:
- Construtoras e empreiteiras pequenas
- Distribuidoras de materiais (hospitalar, escolar, de escritório)
- Empresas de TI e software
- Prestadores de serviços de limpeza, segurança, alimentação
- Clínicas e laboratórios que fornecem para hospitais públicos
- Qualquer empresa com SICAF ativo

### Cliente Ideal (ICP)
Empresa com 2–50 funcionários, já ganhou pelo menos 1 licitação, tem alguém responsável por licitações (pode ser o próprio dono), e atualmente monitora o portal manualmente ou usa um concorrente caro e ruim.

---

## 3. ARQUITETURA DO SISTEMA

### 3.1 Componentes

| Componente | Tecnologia | Responsabilidade |
|-----------|-----------|-----------------|
| Frontend | Next.js 14 + Tailwind CSS | Interface de configuração e histórico |
| Autenticação | Supabase Auth | Login, sessão, JWT |
| Banco de Dados | Supabase (PostgreSQL) | Persistência com RLS |
| Engine de Busca | Antigravity AIOS | Consome API, cruza filtros, gera resumos |
| Disparos | Evolution API (VPS) | Envio de alertas via WhatsApp |
| Hospedagem | Vercel (free tier) | Deploy automático do Next.js |

### 3.2 Schema do Banco de Dados

> Use EXATAMENTE estes nomes em todo o projeto. Sem aliases, sem variações.

```sql
-- Empresas clientes da plataforma
CREATE TABLE empresas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id    TEXT UNIQUE NOT NULL,
  razao_social        TEXT NOT NULL,
  cnpj                TEXT,
  email               TEXT NOT NULL,
  plano               TEXT DEFAULT 'basico' CHECK (plano IN ('basico','pro','premium')),
  ativo               BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Números de WhatsApp por empresa (até 3 no básico, 10 no pro)
CREATE TABLE whatsapp_numeros (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID REFERENCES empresas(id) ON DELETE CASCADE,
  numero      TEXT NOT NULL,  -- formato: 5511999999999
  ativo       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Filtros de busca configurados por empresa
CREATE TABLE filtros_busca (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID REFERENCES empresas(id) ON DELETE CASCADE,
  palavras_chave  TEXT[] DEFAULT '{}',   -- ex: ["seringa","luva","material hospitalar"]
  cnaes           TEXT[] DEFAULT '{}',   -- reservado para V2 — não usar no MVP
  estados         TEXT[] DEFAULT '{}',   -- ex: ["SP","RJ","MG"] — vazio = nacional
  municipios_ibge TEXT[] DEFAULT '{}',   -- ex: ["3550308","3304557"] — filtro por cidade (opcional)
  valor_minimo    NUMERIC DEFAULT 0,     -- em reais
  ativo           BOOLEAN DEFAULT true,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Cache diário de licitações buscadas da API do governo
CREATE TABLE licitacoes_cache (
  id_licitacao_gov    TEXT PRIMARY KEY,  -- numeroControlePNCP do JSON
  titulo              TEXT NOT NULL,     -- primeiros 200 chars do objetoCompra
  objeto              TEXT,              -- objetoCompra completo
  orgao               TEXT,             -- orgaoEntidade.razaoSocial (normalizado)
  uf                  TEXT,             -- unidadeOrgao.ufSigla
  modalidade          TEXT,             -- modalidadeNome
  data_abertura       TIMESTAMPTZ,      -- dataAberturaProposta + '-03:00' (API envia sem timezone)
  data_encerramento   TIMESTAMPTZ,      -- dataEncerramentoProposta + '-03:00' (Campo correto para prazo)
  valor_estimado      NUMERIC,          -- valorTotalEstimado (pode ser null)
  valor_total_homologado NUMERIC,       -- valorTotalHomologado (útil para V2 e analista-mercado)
  link_edital         TEXT,             -- montado: pncp.gov.br/app/editais/{cnpj}/{ano}/{seq}
  data_publicacao     DATE NOT NULL,    -- dataPublicacaoPncp
  created_at          TIMESTAMPTZ DEFAULT now()
  -- NOTA: cnae_item removido — não vem no endpoint principal da API.
  -- Match de segmento é feito por palavras_chave no cruzador.
);

-- Cache de análises de mercado geradas pelo analista-mercado.yaml
CREATE TABLE analise_mercado (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID REFERENCES empresas(id) ON DELETE CASCADE,
  id_licitacao_gov    TEXT REFERENCES licitacoes_cache(id_licitacao_gov),
  licitacoes_analisadas  INTEGER,        -- quantas licitações históricas similares foram encontradas
  vencedor_medio_pct  NUMERIC,           -- % médio abaixo do valor de referência dos vencedores
  lance_minimo_pct    NUMERIC,           -- % do lance mais baixo aprovado (sem desclassificação)
  lance_maximo_pct    NUMERIC,           -- % do lance mais alto que ainda venceu
  valor_referencia    NUMERIC,           -- valor estimado da licitação atual
  valor_sugerido_min  NUMERIC,           -- faixa mínima sugerida para competir
  valor_sugerido_max  NUMERIC,           -- faixa máxima sugerida para competir
  resumo_texto        TEXT,              -- texto humanizado gerado pelo Sonnet
  whatsapp_enviado    BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, id_licitacao_gov)
);

-- Log de alertas enviados (garante deduplicação + rastreia resultado)
CREATE TABLE logs_disparo (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID REFERENCES empresas(id) ON DELETE CASCADE,
  id_licitacao_gov      TEXT REFERENCES licitacoes_cache(id_licitacao_gov),
  numero_whatsapp       TEXT NOT NULL,
  status_envio          TEXT CHECK (status_envio IN ('enviado','falha','pulado')),

  -- Resultado informado pelo cliente via WhatsApp (preenchido pelo webhook)
  status_participacao   TEXT CHECK (status_participacao IN (
                          'participando',   -- cliente confirmou participação (ainda aguardando resultado)
                          'ganhou',         -- cliente ganhou a licitação
                          'perdeu',         -- cliente participou mas perdeu
                          'nao_participou', -- cliente optou por não participar
                          'aguardando'      -- mensagem de follow-up enviada, sem resposta ainda
                        )) DEFAULT NULL,
  valor_contrato        NUMERIC DEFAULT NULL,  -- preenchido apenas se ganhou (opcional)
  follow_up_enviado     BOOLEAN DEFAULT false, -- controla se a msg de resultado já foi enviada
  follow_up_respondido  BOOLEAN DEFAULT false, -- controla se o cliente já respondeu

  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, id_licitacao_gov)  -- impede duplicatas de alerta
);
```

### 3.3 Row Level Security (RLS) — Obrigatório

```sql
ALTER TABLE empresas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_numeros  ENABLE ROW LEVEL SECURITY;
ALTER TABLE filtros_busca     ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_disparo      ENABLE ROW LEVEL SECURITY;
ALTER TABLE analise_mercado   ENABLE ROW LEVEL SECURITY;

-- licitacoes_cache é pública (lida por todos, escrita só pelo agente via service key)

CREATE POLICY "empresa_propria"
  ON empresas USING (supabase_user_id = auth.uid()::text);

CREATE POLICY "numeros_da_empresa"
  ON whatsapp_numeros USING (empresa_id IN (
    SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
  ));

CREATE POLICY "filtros_da_empresa"
  ON filtros_busca USING (empresa_id IN (
    SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
  ));

CREATE POLICY "logs_da_empresa"
  ON logs_disparo USING (empresa_id IN (
    SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
  ));

CREATE POLICY "analises_da_empresa"
  ON analise_mercado USING (empresa_id IN (
    SELECT id FROM empresas WHERE supabase_user_id = auth.uid()::text
  ));
```

---

## 4. PIPELINE DE AGENTES (ANTIGRAVITY AIOS)

### Horários de Execução

| Horário | Agent | Função |
|---------|-------|--------|
| 06:00 AM | `maestro.yaml` | Busca licitações do dia + envia alertas |
| 07:30 PM | `analista-mercado.yaml` | Envia briefing de mercado (véspera do prazo) |
| 08:00 AM | `notificador-resultado.yaml` | Follow-up de resultado (dia do prazo) |

### 4.1 Definição dos Agentes

#### `maestro.yaml` — Orquestrador
- **LLM:** Claude Haiku (só orquestra, não raciocina)
- **Trigger:** Cron diário às 06:00 AM via Supabase Scheduled Function
- **Fluxo:**
  1. Chama `buscador.yaml` para atualizar `licitacoes_cache` com editais do dia
  2. Busca todas as empresas ativas: `SELECT * FROM empresas WHERE ativo = true`
  3. Para cada empresa: busca seus `filtros_busca` ativos
  4. Chama `cruzador.yaml` com (empresa + filtros + licitacoes do dia)
  5. Para cada match encontrado: verifica deduplicação em `logs_disparo`
  6. Para matches novos: chama `resumidor.yaml` para gerar o texto
  7. Chama Evolution API para enviar WhatsApp
  8. Registra resultado em `logs_disparo`
  9. Grava log de execução completo

#### `buscador.yaml` — Busca na API do Governo
- **LLM:** Claude Haiku (tarefa estruturada, sem raciocínio)
- **Skill:** `compras-gov-api`
- **Função:** Consome a API pública do PNCP, filtra editais publicados hoje, salva em `licitacoes_cache`
- **URL base:** `https://pncp.gov.br/api/consulta` (API de Consultas — sem autenticação)
- **Endpoint principal:**
  ```
  GET /v1/contratacoes/publicacao
    Obrigatórios: dataInicial=AAAAMMDD, dataFinal=AAAAMMDD,
                  codigoModalidadeContratacao, pagina
    Opcionais:    uf, codigoMunicipioIbge, cnpj, tamanhoPagina=500
  ```
- **Estratégia de modalidades:** 3 chamadas por execução:
  1. Modalidade `6` — Pregão Eletrônico (90%+ dos casos)
  2. Modalidade `8` — Dispensa de Licitação (contratos menores, menos concorrência)
  3. Modalidade `4` — Concorrência Eletrônica (contratos grandes)
- **Paginação:** usar `tamanhoPagina=500` (máximo do manual). Paginar até `paginasRestantes = 0`.
- **Regra:** Nunca sobrescrever registros já existentes — usar `ON CONFLICT DO NOTHING`

#### `cruzador.yaml` — Motor de Match
- **LLM:** Claude Haiku (operação de comparação — sem geração de texto)
- **Lógica de match (AND entre critérios ativos):**
  ```
  match = true SE:
    (palavras_chave vazio OU alguma palavra aparece no título/objeto da licitação)
    AND (estados vazio OU uf da licitação está na lista do cliente)
    AND (municipios_ibge vazio OU codigoIbge da licitação está na lista do cliente)
    AND (valor_estimado >= valor_minimo do cliente OU valor_estimado é null)
  ```
- **Nota sobre CNAE:** o CNAE não é filtro no MVP. O campo `cnaes` do `filtros_busca` fica reservado para V2. Por ora, o match de segmento é feito inteiramente pelas `palavras_chave`.
- **Output:** lista de `{empresa_id, id_licitacao_gov}` que passaram no match

#### `resumidor.yaml` — Gerador de Resumo Humanizado
- **LLM:** Claude Sonnet (qualidade de linguagem importa aqui)
- **Skill:** `linguagem-licitacao`
- **Input:** dados brutos da licitação (título, objeto, órgão, valor, data, link)
- **Output:** mensagem WhatsApp formatada (ver template na skill `linguagem-licitacao`)

#### `notificador-resultado.yaml` — Follow-up de Resultado
- **LLM:** Claude Haiku (tarefa estruturada, sem raciocínio)
- **Skill:** `linguagem-licitacao`, `follow-up-resultado`
- **Trigger:** Cron diário às 08:00 AM — roda APÓS o maestro
- **Função:** Verifica quais licitações têm `data_abertura = hoje`, busca os logs correspondentes com `follow_up_enviado = false`, e envia mensagem perguntando o resultado.
- **Fluxo:**
  1. Busca licitações com abertura hoje:
     ```sql
     SELECT ld.*, lc.titulo, lc.orgao, lc.valor_estimado
     FROM logs_disparo ld
     JOIN licitacoes_cache lc ON lc.id_licitacao_gov = ld.id_licitacao_gov
     WHERE DATE(lc.data_abertura AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
       AND ld.status_envio = 'enviado'
       AND ld.follow_up_enviado = false;
     ```
  2. Para cada registro: envia mensagem de follow-up via Evolution API
  3. Atualiza `follow_up_enviado = true` e `status_participacao = 'aguardando'`
  4. Registra log de execução

- **Template da mensagem de follow-up:**
  ```
  📋 *Atualização de Licitação*

  Hoje foi o prazo de abertura da licitação que enviamos para vocês:

  *[TÍTULO DA LICITAÇÃO]*
  🏛 [Órgão]
  💰 R$ [Valor estimado]

  Vocês participaram? Qual foi o resultado?

  1️⃣ Ganhamos! 🏆
  2️⃣ Participamos, mas perdemos
  3️⃣ Não participamos desta vez

  _(Responda com o número da opção)_
  ```

#### `analista-mercado.yaml` — Inteligência Competitiva
- **LLM:** Claude Sonnet (análise quantitativa + geração de texto estratégico)
- **Skill:** `analise-mercado`, `compras-gov-api`, `falha-segura-lic`
- **Trigger:** Cron diário às 07:30 PM — envia briefing na véspera do prazo
- **Planos:** Pro e Premium apenas — Básico não recebe briefing
- **Função:** Para cada licitação com `data_abertura = amanhã`, busca licitações históricas similares via API Dados Abertos, calcula percentuais típicos de desconto dos vencedores, gera um briefing estratégico e envia via WhatsApp.

- **Fluxo:**
  1. Busca licitações com abertura amanhã que empresas Pro/Premium vão participar:
     ```sql
     SELECT ld.*, lc.*
     FROM logs_disparo ld
     JOIN licitacoes_cache lc ON lc.id_licitacao_gov = ld.id_licitacao_gov
     JOIN empresas e ON e.id = ld.empresa_id
     WHERE DATE(lc.data_abertura AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE + 1
       AND ld.status_envio = 'enviado'
       AND e.plano IN ('pro', 'premium')
       AND NOT EXISTS (
         SELECT 1 FROM analise_mercado am
         WHERE am.empresa_id = ld.empresa_id
           AND am.id_licitacao_gov = ld.id_licitacao_gov
       );
     ```
  2. Para cada licitação: busca itens e resultados via API em 3 etapas
     ```
     // Etapa A: licitações encerradas similares por período
     GET https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao
       ?dataInicial={6 meses atrás AAAAMMDD}
       &dataFinal={ontem AAAAMMDD}
       &codigoModalidadeContratacao=6
       &uf={uf da licitação alvo}

     // Etapa B: itens de cada licitação selecionada
     // ⚠️ URL usa api/pncp (não api/consulta) — GET público sem autenticação
     GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens
       Usar apenas itens com situacaoCompraItem=2 E temResultado=true

     // Etapa C: valor do vencedor por item (valorUnitarioHomologado NÃO está em /itens)
     GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/resultados
       Campo chave: valorUnitarioHomologado (preço real do vencedor)
     ```
  4. Se `licitacoes_analisadas >= 3`: gera briefing completo com Sonnet
  5. Se `licitacoes_analisadas < 3`: gera mensagem alternativa honesta (sem percentuais)
  6. Salva análise em `analise_mercado`
  7. Envia WhatsApp e atualiza `whatsapp_enviado = true`
  6. Envia WhatsApp com briefing estratégico
  7. Atualiza `whatsapp_enviado = true`

- **Endpoint API PNCP para histórico:**
  ```
  // Licitações encerradas similares (para calcular percentuais históricos)
  GET https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao
    Params: codigoModalidadeContratacao=6, uf={estado}, 
            dataInicial={6 meses atrás em AAAAMMDD},
            dataFinal={ontem em AAAAMMDD}

  // Detalhes com valor homologado (vencedor) de uma licitação específica
  GET https://pncp.gov.br/api/consulta/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}
    Campo relevante: valorTotalHomologado (preenchido após encerramento)
  ```

- **Template da mensagem de briefing:**
  ```
  📊 *Inteligência de mercado — Briefing para amanhã*

  Sua licitação abre amanhã:
  *[TÍTULO]*
  💰 Valor de referência: R$ [valor]
  📅 Abertura: [data e hora]

  ──────────────────────
  📈 O que o mercado mostra:

  Analisamos [N] licitações similares nos últimos 6 meses:

  • Vencedores ficaram em média [X]% abaixo da referência
  • Lance mais baixo aprovado: [Y]% abaixo
  • Lance mais alto que ainda venceu: [Z]% abaixo

  💡 Para competir nesta licitação, considere
  ficar entre *R$ [min]* e *R$ [max]*

  ──────────────────────
  ⚠️ Atenção antes de entrar:
  • Verifique se suas certidões estão em dia no SICAF
  • Confirme que sua proposta atende todas as
    especificações técnicas do edital

  🔗 Edital completo: [link]

  ──────────────────────
  Licitaí · Inteligência Competitiva
  _(Disponível nos planos Pro e Premium)_
  ```

- **Quando não há histórico suficiente (< 3 licitações similares):**
  ```
  📊 *Briefing para amanhã*

  Sua licitação abre amanhã:
  *[TÍTULO]*
  💰 Valor de referência: R$ [valor]

  Não encontramos histórico suficiente de licitações
  similares para gerar uma análise de preço confiável.

  💡 Dica geral: licitações desta modalidade costumam
  ter lances entre 5% e 15% abaixo da referência.
  Verifique seus custos e margem antes de definir o preço.

  🔗 Edital completo: [link]
  ```

### 4.3 Webhook de Resposta — `/api/whatsapp/resposta`

Quando o cliente responde "1", "2" ou "3" no WhatsApp, a Evolution API dispara um webhook para este endpoint Next.js.

**Lógica do endpoint:**

```typescript
// POST /api/whatsapp/resposta
// Body enviado pela Evolution API:
// { from: "5511999999999", body: "1" }

const mapeamento = {
  '1': 'ganhou',
  '2': 'perdeu',
  '3': 'nao_participou',
}

// 1. Identificar empresa pelo número de WhatsApp
const { data: numero } = await supabase
  .from('whatsapp_numeros')
  .select('empresa_id')
  .eq('numero', from)
  .single()

// 2. Buscar o log mais recente desta empresa com status 'aguardando'
const { data: log } = await supabase
  .from('logs_disparo')
  .select('id')
  .eq('empresa_id', numero.empresa_id)
  .eq('status_participacao', 'aguardando')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

// 3. Atualizar o status
await supabase
  .from('logs_disparo')
  .update({
    status_participacao: mapeamento[body] ?? null,
    follow_up_respondido: true,
  })
  .eq('id', log.id)

// 4. Se ganhou: pedir o valor do contrato (opcional)
if (body === '1') {
  await enviarWhatsApp(from,
    '🏆 Parabéns! Qual foi o valor do contrato? ' +
    '(Responda com o valor em reais ou "pular" para ignorar)'
  )
}
```

**Resposta de confirmação ao cliente:**

| Resposta | Mensagem enviada de volta |
|----------|--------------------------|
| `1` (ganhou) | "🏆 Parabéns pela vitória! Vamos registrar aqui. Qual foi o valor do contrato? (ou responda 'pular')" |
| `2` (perdeu) | "Registrado! Na próxima você ganha. Continuamos monitorando novas oportunidades para vocês 💪" |
| `3` (não participou) | "Entendido! Se quiser ajustar os filtros para receber licitações mais relevantes, acesse o painel." |

### 4.4 Lógica de Deduplicação (CRÍTICO)

Antes de qualquer envio, o maestro executa:

```sql
SELECT 1 FROM logs_disparo
WHERE empresa_id = $1
AND id_licitacao_gov = $2
LIMIT 1;
```

Se retornar resultado: **pular** (não enviar, não logar novamente).
Se não retornar: **enviar** e inserir em `logs_disparo`.

Isso garante que a mesma licitação nunca chegue duas vezes para a mesma empresa.

---

## 5. MODELO DE PREÇOS

| Feature | Básico R$97/mês | Pro R$197/mês | Premium R$397/mês |
|---------|:-:|:-:|:-:|
| Números de WhatsApp | 1 | Até 5 | Até 10 |
| Filtros de busca | 3 | 10 | Ilimitado |
| Alertas diários | Ilimitado | Ilimitado | Ilimitado |
| Follow-up de resultado | ✅ | ✅ | ✅ |
| **Inteligência competitiva** | ❌ | ✅ | ✅ |
| **Briefing de mercado (véspera)** | ❌ | ✅ | ✅ |
| Histórico de análises no painel | ❌ | 3 meses | 12 meses |
| Suporte | Email | WhatsApp | WhatsApp prioritário |

> **Argumento de upgrade:** *"Com R$97/mês você sabe que a licitação existe. Com R$197/mês você sabe quanto cobrar para ganhar."* — essa frase fecha o upgrade.

**Estratégia de validação:** Primeiros 5 clientes fundadores pagam R$47/mês no Básico (50% off por 3 meses). Na conversa de upgrade, mostre um briefing real de exemplo — isso fecha o contrato.

---

## 6. MÉTRICAS DO DASHBOARD (baseadas em `logs_disparo` e `analise_mercado`)

O dashboard exibe métricas calculadas automaticamente. Nenhuma exige entrada manual além da resposta ao follow-up.

| Métrica | Fonte | Query base |
|---------|-------|-----------|
| Alertas hoje | `logs_disparo` | `COUNT WHERE DATE(created_at) = hoje AND status_envio = 'enviado'` |
| Alertas este mês | `logs_disparo` | `COUNT WHERE DATE_TRUNC('month', created_at) = mês atual` |
| Participações | `logs_disparo` | `COUNT WHERE status_participacao IN ('ganhou','perdeu')` |
| Vitórias | `logs_disparo` | `COUNT WHERE status_participacao = 'ganhou'` |
| Contratos ganhos (R$) | `logs_disparo` | `SUM(valor_contrato) WHERE status_participacao = 'ganhou'` |
| Briefings enviados | `analise_mercado` | `COUNT WHERE whatsapp_enviado = true` |

**Regras de exibição:**
- Se `valor_contrato` for null em todos os registros de vitória: mostrar só contagem, nunca R$0
- Banner de ROI só aparece se `SUM(valor_contrato) > 0`
- Seção "Inteligência de Mercado" visível apenas para planos Pro e Premium

---

## 7. SEGURANÇA

1. **RLS obrigatório** em todas as tabelas desde o primeiro dia
2. **Service key do Supabase** apenas no backend/agentes — nunca no browser
3. **Números de WhatsApp** armazenados sem criptografia (não são dados sensíveis por LGPD)
4. **Sem armazenamento de senhas** de portais governamentais (diferente do Fiscal — aqui só consumimos API pública)
5. **HTTPS em tudo** — Vercel fornece SSL automático
6. **Variáveis de ambiente** para todas as chaves de API — nunca em código ou git
