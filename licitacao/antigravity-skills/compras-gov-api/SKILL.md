---
name: compras-gov-api
description: "Expertise técnica na API pública do Portal Nacional de Contratações Públicas (PNCP / compras.gov.br). Inclui endpoints, parâmetros, estrutura de resposta e tratamento de erros típicos."
---

# Compras Gov API — Portal de Contratações Públicas

## APIs Disponíveis (usar em ordem de preferência)

### URL Base Correta — API de Consultas (pública, sem autenticação)
```
https://pncp.gov.br/api/consulta
```

> ⚠️ ATENÇÃO: Esta é a URL correta. NÃO usar `https://pncp.gov.br/api/pncp` — essa é a API de Manutenção (usada pelos órgãos públicos para publicar dados, requer autenticação). O Licitaí só lê dados, nunca escreve.

### Endpoint principal do `buscador.yaml`

```
GET /v1/contratacoes/publicacao
```

**Parâmetros — completos (fonte: Manual Oficial API Consultas v1.0):**

| Parâmetro | Tipo | Obrigatório | Formato | Descrição |
|-----------|------|:-----------:|---------|-----------|
| `dataInicial` | Data | **SIM** | `AAAAMMDD` | Data inicial da busca |
| `dataFinal` | Data | **SIM** | `AAAAMMDD` | Data final da busca |
| `codigoModalidadeContratacao` | Inteiro | **SIM** | ver tabela | Modalidade da licitação |
| `codigoModoDisputa` | Inteiro | Não | ver tabela | Modo de disputa (1=Aberto) |
| `uf` | String | Não | `SP`, `RJ`... | Filtrar por estado |
| `codigoMunicipioIbge` | String | Não | ex: `3550308` | Filtrar por município (IBGE) |
| `cnpj` | String | Não | 14 dígitos | CNPJ do órgão comprador |
| `codigoUnidadeAdministrativa` | String | Não | ex: `194035` | Código da unidade do órgão |
| `idUsuario` | Inteiro | Não | ex: `3` | ID do sistema que publicou |
| `tamanhoPagina` | Inteiro | Não | padrão: **50**, máx: **500** | Registros por página |
| `pagina` | Inteiro | **SIM** | padrão: 1 | Número da página |

> ⚠️ `codigoModalidadeContratacao` é **obrigatório** — a API recusa sem ele.
> ⚠️ `dataInicial` e `dataFinal` são formato `AAAAMMDD` — NÃO ISO, NÃO com barras.
> ✓ Usar `tamanhoPagina=500` para eficiência — reduz o número de chamadas do buscador.
> ✓ `codigoMunicipioIbge` será usado no MVP para clientes que filtram por cidade específica.

**Tabela de modos de disputa (codigoModoDisputa):**

| Código | Nome | Uso no Licitaí |
|--------|------|----------------|
| `1` | Aberto | Padrão para Pregão Eletrônico |
| `2` | Fechado | Ignorar no MVP |
| `3` | Aberto-Fechado | Opcional |
| `4` | Dispensa Com Disputa | Para modalidade 8 |
| `5` | Não se aplica | Ignorar |

**Tabela de modalidades (codigoModalidadeContratacao):**

| Código | Nome | Prioridade |
|--------|------|-----------|
| `6` | Pregão — Eletrônico | 🔴 Principal (90%+ dos casos) |
| `8` | Dispensa de Licitação | 🟡 2ª prioridade — contratos menores, menos concorrência |
| `4` | Concorrência — Eletrônica | 🟡 3ª prioridade — contratos grandes |
| `9` | Inexigibilidade | Opcional |
| `1` | Leilão — Eletrônico | Ignorar no MVP |
| `2` | Diálogo Competitivo | Ignorar no MVP |

**Estratégia do buscador:** fazer chamadas separadas por modalidade. Começar sempre com `6` (Pregão Eletrônico). Chamar `8` (Dispensa de Licitação) e `4` (Concorrência Eletrônica) em seguida. Demais modalidades são opcionais no MVP.

### Exemplo de chamada real (Pregão Eletrônico, hoje, todos os estados)
```
GET https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao
  ?dataInicial=20250315
  &dataFinal=20250315
  &codigoModalidadeContratacao=6
  &tamanhoPagina=50
  &pagina=1
```

### Exemplo com filtro de estado
```
GET https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao
  ?dataInicial=20250315
  &dataFinal=20250315
  &codigoModalidadeContratacao=6
  &uf=SP
  &tamanhoPagina=50
  &pagina=1
```

### Como formatar a data para a chamada
```typescript
// AAAAMMDD — não usar new Date().toISOString()
const hoje = new Date()
const dataFormatada = [
  hoje.getFullYear(),
  String(hoje.getMonth() + 1).padStart(2, '0'),
  String(hoje.getDate()).padStart(2, '0')
].join('')
// Resultado: "20250315"
```

### Todos os endpoints da API Consulta — mapeados para o Licitaí

```
BASE URL: https://pncp.gov.br/api/consulta

─────────────────────────────────────────
ENDPOINTS USADOS NO MVP
─────────────────────────────────────────

// buscador.yaml — 06h diariamente
GET /v1/contratacoes/publicacao
  Obrigatórios: dataInicial, dataFinal, codigoModalidadeContratacao, pagina
  Opcionais:    codigoModoDisputa, uf, codigoMunicipioIbge, cnpj, tamanhoPagina(500)
  Retorna:      { data:[], totalRegistros, totalPaginas, paginasRestantes, empty }

// notificador-resultado.yaml — verificar se licitação ainda está aberta antes do follow-up
GET /v1/contratacoes/proposta
  Obrigatórios: dataFinal, codigoModalidadeContratacao, pagina
  Opcionais:    uf, codigoMunicipioIbge, cnpj, tamanhoPagina(500 padrão)
  ⚠️ Só dataFinal — sem dataInicial! Retorna tudo ainda aberto até essa data.

─────────────────────────────────────────
ENDPOINTS USADOS NO ANALISTA-MERCADO
─────────────────────────────────────────

// analista-mercado.yaml — Etapa A: buscar histório de licitações
GET /v1/contratacoes/publicacao (mesmo endpoint, datas no passado)

// analista-mercado.yaml — Etapa C: valor do vencedor por item
// ⚠️ Estes usam api/pncp (não api/consulta) — GET público sem autenticação
GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens
  Sem params de query. Retorna array direto (sem wrapper).
  Checar: situacaoCompraItem=2 (Homologado) E temResultado=true

GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens/{numItem}/resultados
  Campo chave: valorUnitarioHomologado ← preço real do vencedor
  Usar apenas: situacaoCompraItemResultadoId=1 (Informado). Ignorar 2 (Cancelado).

─────────────────────────────────────────
ENDPOINTS PARA FEATURES FUTURAS
─────────────────────────────────────────

// Atas de Registro de Preço — fonte secundária para analista-mercado
GET /v1/atas
  Obrigatórios: dataInicial, dataFinal, pagina
  Opcionais:    cnpj, codigoUnidadeAdministrativa, idUsuario, tamanhoPagina(500)
  Retorna: objetoContratacao, vigenciaInicio, vigenciaFim, numeroControlePNCPCompra
  Uso: cruzar com /itens para preços vigentes (mais atuais que licitações encerradas)

// Contratos assinados — valor final real
GET /v1/contratos
  Obrigatórios: dataInicial, dataFinal, pagina
  Opcionais:    cnpjOrgao, codigoUnidadeAdministrativa, usuarioId, tamanhoPagina(500)
  Campos chave: valorGlobal, nomeRazaoSocialFornecedor, numeroControlePNCPCompra

// Histórico de alterações — detectar suspensões
GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/historico
  Uso: verificar se licitação foi suspensa ou cancelada antes de enviar follow-up
```

## Estrutura de Resposta (campos relevantes)

```json
{
  "numeroControlePNCP": "...",        → usar como id_licitacao_gov
  "objetoCompra": "...",              → campo objeto na tabela
  "orgaoEntidade": {
    "razaoSocial": "...",             → campo orgao
    "ufSigla": "..."                  → campo uf
  },
  "dataPublicacaoPncp": "...",        → campo data_publicacao
  "dataAberturaProposta": "...",      → campo data_abertura
  "valorTotalEstimado": 0.00,         → campo valor_estimado
  "linkSistemaOrigem": "..."          → campo link_edital
}
```

## Estrutura real do JSON da API (campo a campo)

```json
{
  "numeroControlePNCP": "00394494000136-1-000616/2024", → id_licitacao_gov (PK)
  "anoCompra": 2024,                                    → guardar para fallback do link
  "sequencialCompra": 616,                              → guardar para fallback do link
  "orgaoEntidade": {
    "cnpj": "00394494000136",                           → guardar para fallback do link
    "razaoSocial": "MINISTERIO DA JUSTICA..."           → orgao (normalizar caixa)
  },
  "unidadeOrgao": {
    "ufSigla": "DF",                                    → uf ✓ pronto
    "municipioNome": "Brasília"                         → ignorar no MVP
  },
  "modalidadeNome": "Pregão - Eletrônico",              → modalidade ✓ pronto
  "objetoCompra": "Aquisição de equipamentos...",       → objeto + titulo (200 chars)
  "informacaoComplementar": "...",                      → passar ao resumidor (não salvar)
  "linkSistemaOrigem": "https://cnetmobile...",         → link_edital ✓ USA DIRETO
  "valorTotalEstimado": 1267548.36,                     → valor_estimado ✓ pronto
  "valorTotalHomologado": 1250000.00,                   → valor_total_homologado ✓ novo (campo útil para V2)
  "dataAberturaProposta": "2024-07-10T09:00:00",        → data_abertura ⚠ SEM timezone
  "dataEncerramentoProposta": "2024-07-16T09:00:00",    → data_encerramento ✓ novo (Campo correto para o Prazo)
  "situacaoCompraNome": "Divulgada no PNCP",            → ignorar MVP
  "dataPublicacaoPncp": "2024-06-25T07:09:09"           → data_publicacao ✓ pronto
}
```

## Mapeamento para tabela `licitacoes_cache`

```typescript
// link_edital: usar linkSistemaOrigem diretamente
// Se virem null (raro), montar o fallback manual
const linkEdital = item.linkSistemaOrigem
  ?? `https://pncp.gov.br/app/editais/${item.orgaoEntidade.cnpj}/${item.anoCompra}/${item.sequencialCompra}`

// CRÍTICO: datas vêm SEM timezone — assumir Brasília (-03:00)
const dataAbertura = item.dataAberturaProposta
  ? item.dataAberturaProposta + '-03:00'
  : null

const dataEncerramento = item.dataEncerramentoProposta
  ? item.dataEncerramentoProposta + '-03:00'
  : null

// Normalizar razaoSocial (vem em CAIXA ALTA)
const orgao = item.orgaoEntidade.razaoSocial
  .toLowerCase()
  .replace(/\b\w/g, (c: string) => c.toUpperCase())

// Título = primeiros 200 chars do objeto
const titulo = item.objetoCompra.substring(0, 200)
```

```sql
INSERT INTO licitacoes_cache (
  id_licitacao_gov,   -- numeroControlePNCP
  titulo,             -- primeiros 200 chars do objetoCompra
  objeto,             -- objetoCompra completo
  orgao,              -- orgaoEntidade.razaoSocial (normalizado)
  uf,                 -- unidadeOrgao.ufSigla
  modalidade,         -- modalidadeNome
  data_abertura,      -- dataAberturaProposta + '-03:00' (OBRIGATÓRIO)
  data_encerramento,  -- dataEncerramentoProposta + '-03:00' (NOVO)
  valor_estimado,     -- valorTotalEstimado (pode ser null)
  valor_total_homologado, -- valorTotalHomologado (NOVO)
  link_edital,        -- linkSistemaOrigem (fallback: montar com cnpj/ano/sequencial)
  data_publicacao     -- dataPublicacaoPncp
) VALUES (...)
ON CONFLICT (id_licitacao_gov) DO NOTHING;
```

## Sobre o campo CNAE — decisão de MVP

O CNAE **não vem no endpoint principal**. Para obtê-lo seria necessária uma chamada extra:
```
GET /pncp/v1/contratacoes/{anoCompra}/{sequencialCompra}/itens
```
Fazer essa chamada para cada licitação tornaria o processo lento e custoso.

**Decisão para o MVP:** não filtrar por CNAE exato. O cruzador faz o match usando `palavras_chave` contra o texto do `objetoCompra`. O cliente cadastra palavras do seu setor (ex: "seringa", "luva", "material hospitalar") em vez de CNAE.

O filtro por CNAE exato pode entrar na V2 quando o volume de licitações justificar a chamada extra.

1. **Rate limiting** — aguarde 1 segundo entre páginas para não ser bloqueado
2. **Paginação** — sempre verificar se há mais páginas (`totalPaginas > pagina`)
3. **Campos nulos** — `valorTotalEstimado` pode ser `null` — tratar como 0
4. **Timeout** — aguardar até 30 segundos antes de considerar falha
5. **Manutenção** — a API pode ficar indisponível entre 23h e 6h (tentar novamente)

## Protocolo de Retry

```
Tentativa 1: imediatamente
  ↳ Sucesso → processa resultado
  ↳ Falha HTTP 5xx → aguarda 5 minutos

Tentativa 2: após 5 minutos
  ↳ Sucesso → processa resultado
  ↳ Falha → aguarda 15 minutos

Tentativa 3: após 15 minutos
  ↳ Sucesso → processa resultado
  ↳ Falha → registra erro + notifica operador + ENCERRA (não envia alertas do dia)
```

## O que NÃO fazer

- NUNCA fazer scraping de telas do compras.gov.br — use apenas as APIs
- NUNCA ignorar a paginação (você vai perder licitações)
- NUNCA sobrescrever registros existentes em `licitacoes_cache`
