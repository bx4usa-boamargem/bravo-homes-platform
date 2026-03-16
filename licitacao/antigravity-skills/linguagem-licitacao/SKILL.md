---
name: linguagem-licitacao
description: "Transforma dados técnicos brutos de licitações em mensagens WhatsApp claras, humanas e acionáveis para donos de empresa. Define o template obrigatório de alerta."
---

# Linguagem Licitação — Template de Alertas WhatsApp

## Princípio

O cliente recebe o alerta no celular às 06h. Ele está acordando, tomando café. A mensagem precisa ser lida em 30 segundos e dizer exatamente o que ele precisa saber para decidir se vai participar ou não.

## Template Obrigatório — Alerta de Licitação

```
🔔 *Nova Licitação para você!*

*[TÍTULO HUMANIZADO — máx 80 chars]*

🏛 Órgão: [nome do órgão]
📍 Estado: [UF] 
💰 Valor estimado: R$ [valor formatado]
📅 Prazo: [DD/MM/AAAA] (Usar data_encerramento da licitacoes_cache)
📋 Modalidade: [Pregão Eletrônico / Dispensa de Licitação / etc.]

[Resumo em 2 linhas do que está sendo licitado, em linguagem simples]

🔗 Ver edital completo: [link]

─────────────────
Licitaí · Monitoramento automático
```

## Exemplos de Transformação

### Dado bruto → Mensagem humanizada

**Objeto bruto da API:**
`"AQUISIÇÃO DE MATERIAL MÉDICO HOSPITALAR, CONFORME ESPECIFICAÇÕES CONSTANTES NO TERMO DE REFERÊNCIA, ANEXO I DO EDITAL"`

**Título humanizado:**
`"Compra de material médico-hospitalar"`

---

**Valor bruto:** `285000.00`
**Formatado:** `R$ 285.000,00`

---

**Data bruta:** `"2025-03-20T10:00:00-03:00"`
**Formatada:** `20/03/2025`

## Quando o valor não está disponível

```
💰 Valor estimado: A consultar no edital
```

## Quando há múltiplas licitações no mesmo dia

Se a empresa tem mais de 1 licitação no dia, agrupe em uma única mensagem:

```
🔔 *[N] novas licitações para você hoje!*

*1. [Título da licitação 1]*
🏛 [Órgão] · 📍 [UF] · 💰 R$ [valor] · 📅 [prazo]
🔗 [link]

*2. [Título da licitação 2]*
🏛 [Órgão] · 📍 [UF] · 💰 R$ [valor] · 📅 [prazo]
🔗 [link]

─────────────────
Licitaí · Monitoramento automático
```

## Quando não há licitações no dia

NÃO envie mensagem. Silêncio é melhor que "Nenhuma licitação hoje" — isso esgota o cliente.

## Regras de Linguagem

- Use português brasileiro informal mas profissional
- NUNCA use termos técnicos como "UASG", "PNCP", "SRP", "PE" sem explicar
- "Pregão Eletrônico" pode ser abreviado como "Pregão online" na mensagem
- "Concorrência Pública" → "Concorrência"
- "Dispensa de Licitação" → "Compra direta (dispensa)"
- Valores sempre com R$ e ponto de milhar: `R$ 1.250.000,00`
- Datas sempre no formato `DD/MM/AAAA`

## Tom da mensagem

Animado mas sério. É uma oportunidade de negócio — não é spam. O cliente pagou para receber isso. Trate como uma informação valiosa, não como marketing.
