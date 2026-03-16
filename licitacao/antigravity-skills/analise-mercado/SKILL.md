---
name: analise-mercado
description: "Define a lógica de análise competitiva de licitações para o agente analista-mercado.yaml. Inclui como buscar histórico via API do PNCP, calcular percentuais de desconto dos vencedores, e gerar o briefing estratégico enviado via WhatsApp na véspera do prazo."
---

# Análise de Mercado — Inteligência Competitiva de Licitações

## Propósito

O Licitaí não apenas avisa que a licitação existe — ele prepara o cliente para ganhar. Esta skill define como transformar dados históricos públicos de licitações encerradas em inteligência acionável: quanto os vencedores costumam cobrar, qual a faixa segura para competir sem ser desclassificado por preço inexequível.

**Importante:** Os dados vêm 100% da API pública do PNCP. Nenhum scraping. Nenhum acesso a salas de disputa em tempo real. Apenas resultados históricos já encerrados e publicados.

---

## Fluxo de Análise

### Passo 1 — Identificar a licitação alvo

Receber do maestro:
```json
{
  "empresa_id": "uuid",
  "id_licitacao_gov": "string",
  "titulo": "Aquisição de material médico-hospitalar",
  "objeto": "Texto completo do objeto...",
  "uf": "RJ",
  "cnae_item": "47.72-5",
  "valor_estimado": 280000,
  "data_abertura": "2025-03-15T10:00:00-03:00",
  "link_edital": "https://..."
}
```

### Passo 2 — Buscar licitações históricas similares

**Decisão arquitetural confirmada:** a API Consulta do PNCP **não tem filtro de texto** (confirmado pelo manual oficial e por pesquisa da Transparência Brasil, junho/2024). Não existe parâmetro `termo=`, `q=`, `objeto=` ou similar. O filtro por similaridade acontece no código do agente, não na API.

**Etapa A — buscar licitações encerradas por período (API Consulta pública):**
```
GET https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao
  Params obrigatórios:
    dataInicial={6 meses atrás em AAAAMMDD}    ex: 20240915
    dataFinal={ontem em AAAAMMDD}              ex: 20250314
    codigoModalidadeContratacao=6
  Params opcionais:
    uf={uf da licitação alvo}   ← estreita o universo
    tamanhoPagina=500           ← máximo para reduzir chamadas
    pagina=1

  ⚠️ NÃO existe filtro de texto neste endpoint.
  ⚠️ Formato de data: AAAAMMDD sem separadores (20241001, não 2024-10-01)
```

**Etapa B — filtrar por similaridade NO CÓDIGO (não na API):**
```typescript
const palavras = extrairPalavrasChave(licitacaoAlvo.objetoCompra)
// ex: ["seringa", "luva", "material hospitalar"]

const similares = resultado.data.filter(lic =>
  palavras.filter(p =>
    lic.objetoCompra.toLowerCase().includes(p.toLowerCase())
  ).length >= 2  // mínimo 2 palavras em comum
)

// Top 15 mais similares (mais palavras em comum primeiro)
const top15 = similares
  .sort((a, b) => contarMatches(b, palavras) - contarMatches(a, palavras))
  .slice(0, 15)
```

**Etapa C — buscar itens de cada licitação (URL CORRETA: api/pncp, não api/consulta):**
```
GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/itens
  Sem parâmetros de query. Retorna array direto (sem wrapper de paginação).
  Path params (obrigatórios):
    cnpj             → CNPJ do órgão, 14 dígitos sem máscara
    anoCompra        → ex: 2025
    sequencialCompra → ex: 1

Campos relevantes do retorno:
  numeroItem               → número do item (usar na próxima chamada)
  descricao                → texto do item
  valorUnitarioEstimado    → preço de referência do governo
  situacaoCompraItem       → 2 = Homologado
  situacaoCompraItemNome   → "Homologado"
  temResultado             → true = tem vencedor declarado ← checar antes de chamar /resultados

Usar APENAS itens com situacaoCompraItem = 2 E temResultado = true.
Ignorar: 1=Em Andamento, 3=Anulado, 4=Deserto, 5=Fracassado
```

**Etapa D — buscar o valor do vencedor por item (chamada separada):**

⚠️ `valorUnitarioHomologado` NÃO está no endpoint `/itens`. Está em `/resultados`.

```
GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/itens/{numeroItem}/resultados
  Sem parâmetros. Retorna array (normalmente 1 elemento).

Campos relevantes:
  valorUnitarioHomologado  → preço real do vencedor ← o que importa para o cálculo
  valorTotalHomologado     → valorUnitarioHomologado × quantidadeHomologada
  quantidadeHomologada     → quantidade contratada
  nomeRazaoSocialFornecedor → nome do vencedor (informativo)
  dataResultado            → data da homologação
```

Fazer esta chamada apenas para itens onde `temResultado = true`.
```

### Passo 3 — Calcular estatísticas

```python
# Para cada licitação histórica similar:
desconto_pct = (valor_referencia - valor_vencedor) / valor_referencia * 100

# Calcular sobre a lista de descontos:
media = mean(descontos)
minimo = min(descontos)       # maior desconto aprovado (sem desclassificação)
maximo = max(descontos)       # menor desconto dos vencedores
percentil_25 = percentile(descontos, 25)
percentil_75 = percentile(descontos, 75)

# Faixa sugerida para a licitação alvo:
valor_sugerido_min = valor_estimado * (1 - percentil_75 / 100)
valor_sugerido_max = valor_estimado * (1 - percentil_25 / 100)
```

**Salvar em `analise_mercado`:**
```sql
INSERT INTO analise_mercado (
  empresa_id, id_licitacao_gov,
  licitacoes_analisadas,
  vencedor_medio_pct,    -- media dos descontos
  lance_minimo_pct,      -- minimo (maior desconto aprovado)
  lance_maximo_pct,      -- maximo (menor desconto vencedor)
  valor_referencia,      -- valor_estimado da licitação alvo
  valor_sugerido_min,
  valor_sugerido_max,
  resumo_texto           -- texto gerado no Passo 4
) VALUES (...);
```

### Passo 4 — Gerar texto humanizado (Claude Sonnet)

Use as estatísticas calculadas para gerar o briefing em português natural:

**Prompt interno para geração do texto:**
```
Você é um consultor especializado em licitações públicas brasileiras.
Com base nas estatísticas abaixo, gere um briefing estratégico conciso
e acionável para o cliente, em português informal mas profissional.

Licitação: [titulo]
Órgão: [orgao], UF: [uf]
Valor de referência: R$ [valor_estimado]
Licitações similares analisadas: [N]
Média de desconto dos vencedores: [X]%
Menor desconto aprovado: [Y]% (lance mais agressivo sem desclassificação)
Maior desconto dos vencedores: [Z]% (quem deu menos desconto e ainda ganhou)
Faixa sugerida: R$ [min] a R$ [max]

Regras:
- Máximo 5 linhas de análise
- Sempre mencionar a importância de checar documentação no SICAF
- Tom: direto, como um colega experiente dando uma dica rápida
- Não usar jargão técnico desnecessário
- Não garantir vitória — use "tende a", "costuma", "histórico mostra"
```

---

## Templates de Mensagem WhatsApp

### Template principal (com histórico suficiente ≥ 3 licitações)

```
📊 *Inteligência de mercado — Briefing para amanhã*

Sua licitação abre amanhã:
*[TÍTULO — máx 70 chars]*
🏛 [Órgão]
💰 Referência: R$ [valor formatado]
📅 Abertura: [data e hora]

──────────────────────
📈 O que o histórico mostra:

Analisamos [N] licitações similares (últimos 6 meses):

• Vencedores ficaram em média [X]% abaixo da referência
• Lance mais agressivo aprovado: -[Y]% (sem desclassificação)
• Quem deu menos desconto e ganhou: -[Z]%

💡 Para competir, considere ficar entre
*R$ [min]* e *R$ [max]*

──────────────────────
⚠️ Antes de entrar:
Confira suas certidões no SICAF e verifique se
sua proposta atende todas as especificações técnicas.

🔗 [link do edital]
──────────────────────
Licitaí · Inteligência Competitiva · Plano Pro
```

### Template alternativo (histórico insuficiente < 3 licitações)

```
📊 *Briefing para amanhã — [TÍTULO curto]*

Sua licitação abre amanhã:
🏛 [Órgão] · 💰 R$ [valor] · 📅 [data e hora]

Não encontramos histórico suficiente de licitações
similares para gerar uma análise de preço confiável.

💡 Referência geral: licitações desta modalidade
costumam ter lances entre 5% e 15% abaixo da
referência. Calcule seus custos reais antes de definir.

⚠️ Confira suas certidões no SICAF antes de participar.

🔗 [link do edital]
──────────────────────
Licitaí · Inteligência Competitiva
```

---

## Nota — disponibilidade

Esta feature está disponível para os planos **Pro e Premium**. Clientes do Básico não recebem o briefing — o painel exibe um card de upgrade no lugar.

Quando `licitacoes_analisadas < 3`: usar obrigatoriamente o template alternativo ("histórico insuficiente"). Nunca calcular percentuais com menos de 3 amostras — o número seria estatisticamente inválido e poderia levar o cliente a dar um lance errado.

## Regras Críticas

- NUNCA garantir que o cliente vai ganhar usando a faixa sugerida
- NUNCA usar dados de licitações abertas (sala de disputa em tempo real) — apenas resultados encerrados
- NUNCA calcular com menos de 3 licitações similares — usar template alternativo
- SEMPRE mencionar SICAF e documentação — cliente desclassificado por documento é perda evitável
- Percentuais negativos no texto sempre como "X% abaixo da referência", não como número negativo
- Valores sempre formatados: R$ 280.000 (ponto de milhar, sem centavos quando o valor for redondo)
- Se `valor_estimado` da licitação for null: não gerar análise, enviar apenas template alternativo com aviso
