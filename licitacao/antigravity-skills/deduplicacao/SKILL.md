---
name: deduplicacao
description: "Regras absolutas de deduplicação para garantir que a mesma licitação nunca seja enviada duas vezes para a mesma empresa. Esta skill é crítica para evitar spam e preservar a confiança do cliente."
---

# Deduplicação — Regras Anti-Duplicata

## Por que isso é crítico

Se o cliente receber a mesma licitação duas vezes, ele vai achar que o produto está quebrado e vai cancelar. A deduplicação é a principal proteção de retenção do produto.

## A Regra Principal

Antes de qualquer envio, SEMPRE verificar:

```sql
SELECT 1
FROM logs_disparo
WHERE empresa_id = '{empresa_id}'
  AND id_licitacao_gov = '{id_licitacao}'
LIMIT 1;
```

- **Retornou resultado** → `status = 'pulado'` — NÃO enviar, NÃO inserir novo registro
- **Não retornou** → enviar e inserir em `logs_disparo` com `status = 'enviado'`

## Quando inserir em `logs_disparo`

SOMENTE após o envio bem-sucedido:

```sql
INSERT INTO logs_disparo (
  empresa_id,
  id_licitacao_gov,
  numero_whatsapp,
  status_envio
) VALUES (
  '{empresa_id}',
  '{id_licitacao_gov}',
  '{numero}',
  'enviado'
);
```

Se o envio falhar: inserir com `status_envio = 'falha'`.

Na próxima execução, o agente vai tentar de novo pois `'falha'` ≠ `'enviado'`.
Só `'enviado'` bloqueia reenvio.

## Constraint de banco (garante integridade)

A tabela `logs_disparo` tem `UNIQUE(empresa_id, id_licitacao_gov)`.
Isso significa que mesmo se o agente tentar inserir duplicata por bug, o banco vai rejeitar.

## Cenários especiais

### Empresa atualiza os filtros
Se a empresa muda os filtros e uma licitação antiga agora faz match — NÃO enviar.
A checagem em `logs_disparo` garante isso automaticamente.

### Licitação reaberta pelo órgão
A API pode republicar a mesma licitação com nova data de abertura.
Se o `id_licitacao_gov` for o mesmo — NÃO enviar novamente.
Se for um novo ID — enviar normalmente (é considerada uma nova licitação).

### Múltiplos números na mesma empresa
Para empresa com 3 números cadastrados:
- Verificar deduplicação por `(empresa_id, id_licitacao_gov)` — não por número
- Se passou a verificação, enviar para TODOS os números ativos da empresa
- Registrar um log por número enviado

```sql
-- Verificação única por empresa+licitação
SELECT 1 FROM logs_disparo
WHERE empresa_id = $1 AND id_licitacao_gov = $2;

-- Se não existe: buscar todos os números e enviar para cada um
SELECT numero FROM whatsapp_numeros
WHERE empresa_id = $1 AND ativo = true;

-- Registrar um log por número
INSERT INTO logs_disparo (empresa_id, id_licitacao_gov, numero_whatsapp, status_envio)
VALUES ($1, $2, $3, 'enviado');
```
