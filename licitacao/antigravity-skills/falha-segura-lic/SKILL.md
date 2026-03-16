---
name: falha-segura-lic
description: "Protocolo de tratamento de erros, retries e situações de falha para os agentes do Licitaí. Define o que fazer quando a API do governo falha, o WhatsApp não envia, ou o banco de dados retorna erro."
---

# Falha Segura — Protocolo de Erros do Licitaí

## Princípio

Uma falha silenciosa é pior que uma falha ruidosa. Se algo der errado, o agente DEVE registrar, DEVE notificar, e NUNCA deve ficar em loop silencioso.

## Tabela de Erros e Ações

| Situação | Ação |
|----------|------|
| API compras.gov.br timeout | Retry 3x com backoff (ver abaixo). Após 3 falhas: logar + notificar operador |
| API retorna 500/503 | Aguardar 5 min + retry. Manutenção é comum entre 23h-06h |
| API retorna 404 | Registrar erro de configuração — endpoint incorreto |
| Supabase INSERT falha | Logar o erro + continuar para próxima empresa (não travar toda a fila) |
| Evolution API não responde | Retry 2x. Registrar `status_envio = 'falha'` em `logs_disparo` |
| WhatsApp número inativo | Registrar `status_envio = 'falha'` + não tentar de novo no mesmo dia |
| Filtro da empresa vazio | Pular empresa + logar aviso (não é erro crítico) |
| Zero licitações no dia | Execução normal — não enviar nada, logar "0 licitações encontradas" |

## Protocolo de Retry para API do Governo

```
Tentativa 1: imediata
  ↳ OK → continua
  ↳ Falha → aguarda 5 minutos

Tentativa 2: +5 min
  ↳ OK → continua
  ↳ Falha → aguarda 15 minutos

Tentativa 3: +15 min
  ↳ OK → continua
  ↳ Falha → ENCERRA busca do dia + NOTIFICA OPERADOR
           (não envia alertas com dados incompletos)
```

## Protocolo de Retry para WhatsApp

```
Tentativa 1: imediata
  ↳ OK → registra 'enviado' em logs_disparo
  ↳ Falha → aguarda 2 minutos

Tentativa 2: +2 min
  ↳ OK → registra 'enviado'
  ↳ Falha → registra 'falha' + CONTINUA para próximo número
            (não travar a fila inteira por 1 número com problema)
```

## O que o Maestro deve logar ao final de cada execução

```json
{
  "data_execucao": "2025-03-14T06:00:00-03:00",
  "licitacoes_encontradas": 47,
  "empresas_processadas": 12,
  "alertas_enviados": 8,
  "alertas_pulados_dedup": 3,
  "alertas_falha": 1,
  "empresas_sem_match": 4,
  "duracao_segundos": 142,
  "erros": []
}
```

## Alerta para o operador (você)

O Maestro deve te notificar via Telegram ou Slack se:
- Mais de 20% das empresas ativas não receberam alerta (possível falha na API)
- A API do governo falhou nas 3 tentativas
- A Evolution API está inacessível
- A execução levou mais de 10 minutos (possível loop)

## O que NUNCA fazer

- NUNCA enviar alerta com dados incompletos ou errados
- NUNCA considerar que "sem resultado" é o mesmo que "API funcionou"
- NUNCA deixar uma empresa em loop infinito — use timeout por empresa (máx 2 min)
- NUNCA travar a fila inteira por causa de 1 empresa com problema
