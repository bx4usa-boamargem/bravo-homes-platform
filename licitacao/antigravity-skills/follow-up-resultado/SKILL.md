---
name: follow-up-resultado
description: "Define o template e a lógica de follow-up de resultado para o agente notificador-resultado.yaml. Enviado no dia da abertura da licitação para perguntar ao cliente se ganhou, perdeu ou não participou. Inclui respostas de confirmação para cada cenário."
---

# Follow-up de Resultado — Templates e Lógica

## Quando enviar

Enviar apenas quando:
- `licitacoes_cache.data_abertura` = hoje (dia atual em Brasília)
- `logs_disparo.status_envio = 'enviado'`
- `logs_disparo.follow_up_enviado = false`

Nunca enviar se `follow_up_enviado = true` — já foi perguntado.

---

## Template da Mensagem de Follow-up

```
📋 *Atualização de Licitação*

Hoje foi o prazo de abertura da licitação que enviamos para vocês:

*[TÍTULO DA LICITAÇÃO — máx 80 chars]*
🏛 [Órgão]
💰 R$ [Valor estimado] _(ou "Valor a consultar" se null)_

Vocês participaram? Qual foi o resultado?

1️⃣ Ganhamos! 🏆
2️⃣ Participamos, mas perdemos
3️⃣ Não participamos desta vez

_(Responda com o número da opção)_
```

---

## Respostas de Confirmação por Cenário

### Resposta "1" — Ganhou
```
🏆 *Parabéns pela vitória!*

Que ótima notícia! Vamos registrar aqui.

Qual foi o valor do contrato assinado?
_(Responda com o valor em reais, ex: 280000, ou responda "pular" para não informar)_
```

Após receber o valor ou "pular":
```
✅ Registrado! Continue participando — quanto mais licitações vocês
vencerem, mais o Licitaí prova o seu valor para o negócio. 💪
```

### Resposta "2" — Perdeu
```
Registrado! Faz parte do jogo — na próxima vocês ganham. 💪

Continuamos monitorando novas oportunidades para vocês todos os dias.
Se quiser ajustar os filtros para receber licitações ainda mais alinhadas
com o negócio de vocês, acesse o painel: [link]
```

### Resposta "3" — Não participou
```
Entendido! Registrado aqui.

Se quiser ajustar os critérios para receber licitações mais relevantes,
acesse o painel e atualize seus filtros: [link]

Continuamos monitorando para vocês. 👍
```

### Resposta inválida (qualquer outra coisa)
Ignorar silenciosamente. Não responder, não registrar erro.
O webhook descarta mensagens que não são "1", "2" ou "3".

---

## Tratamento do Valor do Contrato

Quando o cliente responde ao pedido de valor após "Ganhamos":

| Resposta do cliente | Ação |
|--------------------|------|
| Número (ex: "280000", "280.000", "R$280k") | Normalizar para numeric, salvar em `valor_contrato` |
| "pular" / "não sei" / "depois" | Salvar `valor_contrato = null`, confirmar mesmo assim |
| Qualquer outra coisa | Tentar interpretar como número. Se não conseguir: salvar null e confirmar |

Normalização básica de valor:
```
"R$ 280.000,00" → 280000
"280k"          → 280000
"280 mil"       → 280000
"1.2mi"         → 1200000
```

---

## Regras Importantes

- NUNCA enviar o follow-up antes das 08:00 AM — cliente ainda pode estar dormindo
- NUNCA reenviar o follow-up se `follow_up_enviado = true`
- NUNCA enviar para licitação sem `data_abertura` definida
- Um cliente pode ter múltiplas licitações com abertura no mesmo dia — enviar uma mensagem separada para cada uma
- Se a empresa tiver múltiplos números, enviar o follow-up apenas para o número principal (primeiro número ativo cadastrado)
