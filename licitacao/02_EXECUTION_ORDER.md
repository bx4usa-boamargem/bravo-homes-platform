# LICITAÍ — DEVELOPMENT EXECUTION ORDER

## DOCUMENT CLASSIFICATION
- **Document Type:** Execution Order
- **Authority Level:** LEVEL 2 — Sequência de Implementação
- **Version:** 1.0

> Nenhuma fase pode ser pulada. UI só começa depois que o engine estiver funcionando.

---

## REGRAS DE FASE

1. **Validação antes de código** — Fase 0 é obrigatória. Sem ela, nada começa.
2. **Engine antes de UI** — o agente precisa enviar WhatsApp real antes de você abrir o Lovable.
3. **Nomes canônicos** — use EXATAMENTE os nomes do PRD. Sem exceções.
4. **MVP enxuto** — se não está no PRD, não entra. CRM, Kanban, relatórios financeiros são V2.

---

## FASE 0: VALIDAÇÃO — ANTES DE QUALQUER CÓDIGO
**Duração: 2 semanas | Custo: R$0**

> Esta é a fase mais importante. Se pular aqui, você pode construir 4 semanas de produto para ninguém.

### Como encontrar os 10 prospects
1. Acesse `compras.gov.br` → pesquise licitações encerradas nos últimos 30 dias
2. Os vencedores aparecem no resultado — nome da empresa é público
3. Pesquise no Google/LinkedIn pelo dono ou responsável comercial
4. Empresas com 2–20 funcionários são o alvo ideal

### Script de abordagem (WhatsApp ou LinkedIn)
```
"Oi [nome], vi que a [empresa] participou de licitações recentemente.
Estou desenvolvendo uma ferramenta que monitora automaticamente todas
as licitações do governo na área de vocês e avisa no WhatsApp quando
sai uma oportunidade nova. Você toparia me dar 15 minutos para entender
como vocês fazem isso hoje?"
```

### O que perguntar na conversa (não venda ainda)
- Como vocês sabem quando sai uma licitação nova hoje?
- Quantas por semana costumam aparecer na área de vocês?
- Já perderam alguma por não saberem a tempo?
- Tem alguém dedicado a monitorar isso ou é manual?
- Quanto vale uma licitação típica ganha para vocês?

### Teste de disposição para pagar (semana 2)
Para os 3–5 mais engajados, volte com:
```
"Baseado no que você me contou, vou lançar o [nome]. Por R$97/mês
você recebe alerta no WhatsApp toda vez que sair licitação na sua área,
com resumo completo e prazo. Estou abrindo 5 vagas com preço especial
de R$47/mês pelos primeiros 3 meses. Você toparia ser um dos primeiros?"
```

### Critério de avanço
- **2 de 5 disserem sim (ou pedirem para ver mais):** avance para Fase 1
- **Todos hesitarem:** entenda a objeção. Ajuste o produto ou o preço antes de construir.

### Checklist Fase 0
- [ ] 10 empresas identificadas no compras.gov.br
- [ ] 10 abordagens realizadas
- [ ] 5 conversas de 15 minutos feitas
- [ ] Padrão de dor confirmado (estão perdendo licitações por falta de monitoramento)
- [ ] Pelo menos 2 dispostos a pagar
- [ ] Preço de R$97/mês não gerou resistência forte

---

## FASE 1: FUNDAÇÃO TÉCNICA
**Duração: Dias 1–3 da construção**

### Tarefas
- [ ] Criar projeto no Supabase (plano free)
- [ ] Executar o SQL do PRD Seção 3.2 (5 tabelas exatas)
- [ ] Aplicar as 5 policies RLS do PRD Seção 3.3
- [ ] Criar conta na Vercel e conectar repositório GitHub
- [ ] Inicializar projeto Next.js 14 com Tailwind CSS
- [ ] Configurar Supabase Auth (email/senha para MVP)
- [ ] Criar arquivo `.env.local` com todas as variáveis
- [ ] Adicionar `.env*` ao `.gitignore` ANTES do primeiro push

### Variáveis de ambiente obrigatórias
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # frontend — leitura pública com RLS
SUPABASE_SERVICE_KEY=              # backend/agentes APENAS — nunca no browser
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=
```

### Checklist de aceitação
- [ ] Usuário consegue se cadastrar e logar via Supabase Auth
- [ ] RLS testado: usuário A não vê dados do usuário B (testar via SQL console)
- [ ] Deploy no Vercel funcionando com variáveis de ambiente configuradas

---

## FASE 2: SKILLS E AGENTS DO ANTIGRAVITY
**Duração: Dias 4–6**

### 2.1 Instalar Skills Globais
Copie para `C:\Users\wylla\.gemini\antigravity\skills\`:

| Pasta | Arquivo | Propósito |
|-------|---------|-----------|
| `contexto-produto-lic\` | `SKILL.md` | Identidade e escopo dos agentes |
| `compras-gov-api\` | `SKILL.md` | Expertise na API do compras.gov.br |
| `linguagem-licitacao\` | `SKILL.md` | Traduz dados brutos em mensagem humana |
| `falha-segura-lic\` | `SKILL.md` | Protocolo de retry e tratamento de erros |
| `deduplicacao\` | `SKILL.md` | Regras anti-duplicata |

### 2.2 Criar Agents no Antigravity AIOS
Use EXATAMENTE estes nomes de arquivo:

| Arquivo | LLM | Horário | Função |
|---------|-----|---------|--------|
| `maestro.yaml` | Claude Haiku | 06:00 AM | Orquestrador geral |
| `buscador.yaml` | Claude Haiku | (chamado pelo maestro) | Consome API compras.gov.br |
| `cruzador.yaml` | Claude Haiku | (chamado pelo maestro) | Match filtros × licitações |
| `resumidor.yaml` | Claude Sonnet | (chamado pelo maestro) | Gera texto WhatsApp do alerta |
| `analista-mercado.yaml` | Claude Sonnet | 07:30 PM | Briefing competitivo (Pro/Premium) |
| `notificador-resultado.yaml` | Claude Haiku | 08:00 AM | Follow-up de resultado |

### 2.3 Teste do Buscador
- [ ] `buscador.yaml` chama a API do compras.gov.br e retorna licitações do dia
- [ ] Dados salvos corretamente na tabela `licitacoes_cache`
- [ ] Sem erros de schema (conferir campos obrigatórios)

### Checklist de aceitação
- [ ] 4 agents criados com nomes corretos
- [ ] 5 skills instaladas em `C:\Users\wylla\.gemini\antigravity\skills\`
- [ ] `buscador.yaml` rodou com sucesso e populou `licitacoes_cache`
- [ ] Pelo menos 5 licitações salvas na tabela de cache

---

## FASE 3: ENGINE DE MATCH E DISPARO
**Duração: Dias 7–12**

### Tarefas
- [ ] Configurar VPS (Hetzner ou DigitalOcean, ~R$20/mês)
- [ ] Instalar Evolution API no VPS
- [ ] Conectar número de WhatsApp (seu número pessoal para teste)
- [ ] Criar `cruzador.yaml` com a lógica de match do PRD Seção 4.1
- [ ] Criar `resumidor.yaml` com template da skill `linguagem-licitacao`
- [ ] Criar `maestro.yaml` orquestrando tudo
- [ ] Criar `notificador-resultado.yaml` com template de follow-up
- [ ] Criar endpoint Next.js `POST /api/whatsapp/resposta` (webhook de respostas)
- [ ] Configurar Evolution API para disparar o webhook ao receber mensagem
- [ ] Testar fluxo completo manualmente

### Configuração do Webhook (Evolution API → Next.js)

No painel da Evolution API, configurar:
```
Webhook URL: https://[seu-dominio].vercel.app/api/whatsapp/resposta
Eventos: messages.upsert (mensagens recebidas)
```

O endpoint `/api/whatsapp/resposta` recebe a mensagem, identifica o cliente pelo número, busca o log com `status_participacao = 'aguardando'` mais recente, e atualiza o banco conforme a resposta (1, 2 ou 3).

### Teste end-to-end obrigatório — Fluxo de alerta
1. Inserir 1 empresa teste no Supabase com filtros configurados
2. Rodar o Maestro manualmente
3. WhatsApp chegou no número de teste com a licitação?
4. Resultado salvo em `logs_disparo` com `status_envio = 'enviado'`?
5. Rodar de novo — licitação foi pulada (deduplicação funcionou)?

### Teste end-to-end obrigatório — Fluxo de follow-up
1. Inserir manualmente uma licitação em `licitacoes_cache` com `data_abertura = hoje`
2. Garantir que existe um `log_disparo` correspondente com `follow_up_enviado = false`
3. Rodar `notificador-resultado.yaml` manualmente
4. WhatsApp chegou com a mensagem de follow-up?
5. `follow_up_enviado` foi atualizado para `true`?
6. Responder "1" no WhatsApp de teste
7. Webhook foi disparado? `status_participacao` foi atualizado para `ganhou`?
8. Mensagem de confirmação chegou pedindo o valor?

### Checklist de aceitação
- [ ] Fluxo de alerta completo roda sem erro manual
- [ ] Fluxo de follow-up completo roda sem erro manual
- [ ] Webhook recebe resposta e atualiza banco corretamente
- [ ] Respostas inválidas (ex: "oi", "5") são ignoradas graciosamente
- [ ] `logs_disparo` reflete status correto após todo o ciclo

---

## FASE 3B: INTELIGÊNCIA COMPETITIVA (analista-mercado)
**Duração: Dias 13–15 | Obrigatório no V1**

> Esta fase faz parte do produto principal. É o principal argumento de upgrade Básico → Pro. Construir junto com o fluxo base.

### Tarefas
- [ ] Criar `analista-mercado.yaml` com skill `analise-mercado`
- [ ] Criar tabela `analise_mercado` no Supabase com RLS
- [ ] Testar chamada à API do PNCP para resultados históricos:
  ```
  GET https://pncp.gov.br/api/pncp/v1/contratacoes/publicacoes
    Params: q="material hospitalar", uf="RJ", dataInicial=6 meses atrás
  ```
- [ ] Validar que a API retorna lances e valores de contratos encerrados
- [ ] Criar lógica de cálculo de percentuais (min, max, média de desconto)
- [ ] Testar geração de texto pelo Sonnet com dados reais
- [ ] Testar envio do briefing via WhatsApp no número de teste

### Teste end-to-end obrigatório — Briefing
1. Inserir licitação com `data_abertura = amanhã` em `licitacoes_cache`
2. Empresa de teste deve ser `plano = 'pro'`
3. Rodar `analista-mercado.yaml` manualmente
4. API do PNCP retornou histórico?
5. Cálculos de percentual estão corretos?
6. WhatsApp chegou com briefing formatado?
7. Registro salvo em `analise_mercado` com `whatsapp_enviado = true`?
8. Rodar de novo — segundo envio foi bloqueado pelo `UNIQUE` constraint?

### Checklist de aceitação
- [ ] Briefing chega via WhatsApp com dados reais da API
- [ ] Quando histórico insuficiente (< 3 licitações): mensagem alternativa enviada corretamente
- [ ] Deduplicação funciona (mesmo `empresa_id + id_licitacao_gov` não é enviado duas vezes)
- [ ] Plano Básico não recebe o briefing (filtrado pela query)

---

## FASE 4: VALIDAÇÃO COM CLIENTES REAIS
**Duração: Dias 13–20 | SEM FRONTEND AINDA**

> Não construa nenhuma tela ainda. Insira os dados dos clientes piloto diretamente no Supabase.

### Tarefas
- [ ] Pegar os 2–3 clientes que disseram "sim" na Fase 0
- [ ] Inserir manualmente na tabela `empresas`
- [ ] Inserir filtros deles na tabela `filtros_busca` (palavras-chave, CNAE, estados)
- [ ] Inserir números de WhatsApp na tabela `whatsapp_numeros`
- [ ] Rodar o Maestro manualmente às 06:00 AM por 5 dias úteis consecutivos
- [ ] Estar online durante cada rodada para resolver falhas
- [ ] Coletar feedback após cada entrega

### Perguntas de feedback para o cliente
- O alerta chegou no horário? (meta: antes das 07:00)
- As licitações eram relevantes para vocês?
- Teve alguma que não fazia sentido? (ajustar filtros)
- O resumo estava claro e suficiente?
- O que estava faltando?

### Critério de avanço para a UI
- [ ] 3 clientes recebem alertas por 3 dias consecutivos sem falha
- [ ] Pelo menos 1 cliente diz que viu uma licitação que não teria visto sem o produto
- [ ] Pelo menos 1 pagamento recebido (pode ser Pix manual agora)

---

## FASE 5: FRONTEND MÍNIMO (LOVABLE)
**Duração: Dias 21–30**

> Só build o que foi validado. Não adicione features que os clientes não pediram.

### Telas a construir (ordem de prioridade)
1. `/auth` — Login e cadastro (Supabase Auth)
2. `/dashboard` — Métricas simples + últimos alertas
3. `/configurar` — Palavras-chave, CNAE, estados, valor mínimo
4. `/numeros` — Gerenciar números de WhatsApp
5. `/historico` — Log de alertas enviados

### Checklist de aceitação
- [ ] Cliente consegue se cadastrar, configurar filtros e ver histórico sem ajuda
- [ ] RLS testado no frontend (usuário A não vê dados do B)
- [ ] Deploy no Vercel com domínio próprio
- [ ] 3 clientes piloto migraram para o painel

---

## FASE 6: AUTOMAÇÃO E CRESCIMENTO
**Após 10 clientes pagando**

- [ ] Configurar Supabase Scheduled Function (cron 06:00 AM)
- [ ] Bot de alerta interno (Telegram) se >20% das execuções falharem
- [ ] Integrar Asaas para cobrança recorrente automática
- [ ] Montar página de landing para aquisição orgânica
- [ ] Avaliar upgrade Supabase Pro se necessário
