# LICITAÍ — UI SPECIFICATION

## DOCUMENT CLASSIFICATION
- **Document Type:** UI Specification
- **Authority Level:** LEVEL 3 — Visual Source of Truth
- **Version:** 1.0

> UI só é construída após a Fase 4 (validação com clientes reais) estar concluída.

---

## FILOSOFIA DE DESIGN

1. **Configuração rápida** — o cliente entra, configura o que quer receber em menos de 3 minutos, e sai
2. **O valor está no WhatsApp** — o painel é secundário; o alerta é o produto
3. **Clareza sobre beleza** — donos de empresa precisam entender tudo sem treinamento
4. **Mobile-first** — muitos acessarão pelo celular ao receber o alerta

---

## DESIGN TOKENS

```css
/* Cores primárias */
--color-navy:       #1E3A8A;  /* azul marinho — header, sidebar, botões principais */
--color-emerald:    #10B981;  /* verde esmeralda — sucesso, alertas encontrados, ativo */
--color-surface:    #F3F4F6;  /* cinza claro — fundo de página */
--color-card:       #FFFFFF;  /* branco — fundo de cards */
--color-border:     #E5E7EB;  /* cinza — bordas */
--color-text-1:     #111827;  /* cinza-900 — texto principal */
--color-text-2:     #6B7280;  /* cinza-500 — texto secundário */

/* Status */
--color-match-bg:   #D1FAE5;  /* verde-100 — licitação encontrada */
--color-match-text: #065F46;  /* verde-900 */
--color-fail-bg:    #F3F4F6;  /* cinza — falha técnica */
--color-fail-text:  #374151;  /* cinza-700 */
```

### Tipografia
- **Font:** Inter (Google Fonts)
- **Peso:** 400 regular, 500 medium — nunca 600+
- **CNPJs e IDs:** `font-mono`
- **Valores em R$:** tabular-nums

### Badge de Status dos Alertas

```tsx
const alertaConfig = {
  enviado: { label: 'Enviado',      bg: 'bg-green-100',  text: 'text-green-800' },
  falha:   { label: 'Falha',        bg: 'bg-gray-100',   text: 'text-gray-600'  },
  pulado:  { label: 'Já enviado',   bg: 'bg-gray-50',    text: 'text-gray-400'  },
}
```

---

## LAYOUT GLOBAL

### Sidebar (desktop) — fundo #1E3A8A (navy)
```
[L]  Licitaí
─────────────────────
  Dashboard
  Configurar Alertas
  Meus Números
  Histórico          [badge: N novos hoje]
─────────────────────
  Configurações
  → Sair
```

### Header (todas as páginas)
```
[título da página]              [Razão Social]
                                 PLANO BÁSICO   [avatar iniciais]
```

---

## TELA 1 — DASHBOARD
**Rota:** `/dashboard`

### Layout
```
"Bom dia, [Nome]!"
"Seus alertas de licitações de hoje."

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Alertas Hoje │ │ Este Mês     │ │ Participações│ │ Vitórias 🏆  │
│     [N]      │ │    [N]       │ │    [N]       │ │    [N]       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

── Aparece só se houver vitória com valor informado ────────────
  🏆 R$ [X.XXX.XXX] em contratos ganhos este mês via Licitaí
────────────────────────────────────────────────────────────────

Últimos Alertas (5 registros)               [Ver histórico →]
─────────────────────────────────────────────────────────────────
LICITAÇÃO | ÓRGÃO | VALOR EST. | PRAZO | RESULTADO
```

### Cards de métrica
- Fundo: `#F3F4F6` (surface, sem borda)
- Ícone 32×32px à esquerda (emerald para positivos, gray para neutros)
- Card "Vitórias": ícone troféu emerald quando > 0, gray quando 0
- Label: 11px uppercase slate-500
- Valor: 26px font-weight 500

### Banner de ROI (condicional)
Só renderiza se `SUM(valor_contrato) > 0` no mês atual:
- Fundo `#F0FDF4` (green-50), borda `#BBF7D0` (green-200)
- Texto green-800: "🏆 Vocês ganharam R$ X.XXX em contratos este mês via Licitaí"
- Se não houver valor informado: não exibir o banner (nunca mostrar R$0)

### Coluna RESULTADO na tabela

| `status_participacao` | Exibição |
|-----------------------|----------|
| `null` | — (gray-400) |
| `aguardando` | ponto amarelo + "Aguardando" |
| `ganhou` | ponto verde + "Ganhou" (green-700) |
| `perdeu` | "Perdeu" (gray-500) |
| `nao_participou` | "Não participou" (gray-400) |

### Tabela "Últimos Alertas"
- Coluna LICITAÇÃO: primeiros 60 chars + tooltip no hover com texto completo
- Coluna VALOR: `R$ X.XXX.XXX` formatado, ou `—` se null
- Coluna PRAZO: `DD/MM/AAAA` — se < 3 dias: texto red-600 com ponto vermelho

---

## TELA 2 — CONFIGURAR ALERTAS
**Rota:** `/configurar`

Esta é a tela mais importante do produto. O cliente configura aqui o que quer monitorar.

### Layout
```
"Configurar Alertas"
"Defina o que você quer monitorar. Salvamos automaticamente."

┌─────────────────────────────────────────────────────────────┐
│ Palavras-chave                                              │
│ [seringa          × ] [luva descartável × ] [+ adicionar]  │
│ Dica: use termos que aparecem no objeto das licitações      │
├─────────────────────────────────────────────────────────────┤
│ CNAE (atividade econômica)                                  │
│ [47.72-5 Comércio de prod. farmacêuticos × ] [+ adicionar] │
│ Dica: use seu CNAE principal ou secundário                  │
├─────────────────────────────────────────────────────────────┤
│ Estados (deixe vazio para receber de todo o Brasil)         │
│ [SP ×] [RJ ×] [MG ×]  [+ adicionar]                        │
├─────────────────────────────────────────────────────────────┤
│ Valor mínimo da licitação                                   │
│ R$ [____________]  (deixe 0 para receber todas)             │
└─────────────────────────────────────────────────────────────┘

[Salvar configurações]   (botão emerald)
```

### Comportamento dos campos de tag
- Chips removíveis com ×
- Enter ou vírgula adiciona novo chip
- Máximo de chips por campo conforme plano:
  - Básico: 5 palavras-chave, 2 CNAEs, 3 estados
  - Pro: 20 palavras-chave, 5 CNAEs, 10 estados
  - Premium: ilimitado
- Salvar com debounce de 1s (auto-save silencioso) + botão explícito

### Dica de CNAE
- Campo de CNAE tem busca: ao digitar "farmac" mostra sugestões
- Usar tabela local de CNAEs (baixar do IBGE, ~2MB, embutir no projeto)

---

## TELA 3 — MEUS NÚMEROS
**Rota:** `/numeros`

### Layout
```
"Números de WhatsApp"
"Os alertas serão enviados para estes números."
                                          [+ Adicionar Número]

┌────────────────────────────────────────────────────┐
│  +55 (11) 99999-9999    [ATIVO]    [✎ editar] [🗑] │
│  +55 (11) 88888-8888    [ATIVO]    [✎ editar] [🗑] │
└────────────────────────────────────────────────────┘

Limite do seu plano: 2 de 3 números usados (Plano Básico)
```

### Modal "Adicionar Número"
```
Número de WhatsApp *
[+55 (___) _____-____]   (máscara automática)

Importante: este número vai receber uma mensagem de teste
agora para confirmar que está ativo.

[Cancelar]    [Adicionar e Testar]
```

Ao adicionar: disparar mensagem de teste via Evolution API:
> "Olá! Este é um teste do Licitaí. Seu número foi cadastrado com sucesso para receber alertas de licitações. 🎉"

---

## TELA 4 — HISTÓRICO
**Rota:** `/historico`

### Layout
```
"Histórico de Alertas"
"Todas as licitações que encontramos para você."

[Buscar por título ou órgão...]    [Filtrar por data ▾]

─────────────────────────────────────────────────────────────────
DATA     │ LICITAÇÃO                    │ VALOR EST.  │ PRAZO  │ STATUS
─────────────────────────────────────────────────────────────────
14/03    │ Aquisição de material...     │ R$ 280.000  │ 20/03  │ ✓ Enviado
13/03    │ Serviços de limpeza pred...  │ R$ 45.000   │ 18/03  │ ✓ Enviado
12/03    │ Fornecimento de equipa...    │ —           │ 15/03  │ ✗ Falha
```

### Linha expandível (clique na row)
Ao clicar, expande mostrando:
```
Objeto completo: [texto completo da licitação]
Órgão: [nome do órgão]
UF: [estado]
Modalidade: Pregão Eletrônico
[Acessar Edital ↗]   (link para compras.gov.br)
```

### Empty state
```
Nenhum alerta encontrado ainda.
Os alertas são enviados diariamente às 06:00.
Configure seus filtros para começar a receber.
[Ir para Configurações →]
```

---

## TELA 5 — INTELIGÊNCIA DE MERCADO
**Rota:** `/inteligencia`
**Visível:** Apenas Pro e Premium — Básico vê card de upgrade no lugar

### Layout
```
"Inteligência de Mercado"
"Análise competitiva das licitações que você vai disputar."

[Card upgrade — só aparece para plano Básico]
────────────────────────────────────────────────────────────────

Briefings recentes:

┌──────────────────────────────────────────────────────────────┐
│ Aquisição de material médico-hospitalar         14/03/2026   │
│ Hospital Federal do RJ · Abertura: amanhã 10:00              │
│                                                              │
│ Referência: R$ 280.000     Analisamos: 12 licitações         │
│                                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ Média venced.│ │ Lance mín.   │ │ Sua faixa    │          │
│ │   -9,2%      │ │   -14,1%     │ │ R$240–R$255k │          │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                              │
│ [Ver briefing completo]           [↗ Acessar edital]        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Serviços de limpeza predial                     13/03/2026   │
│ Min. da Educação · Encerrada                                 │
│                                                              │
│ Referência: R$ 45.000      Analisamos: 8 licitações          │
│ Faixa sugerida: R$ 38.000–R$ 41.000                          │
│ Resultado: ✅ Ganhou · R$ 39.500                             │
└──────────────────────────────────────────────────────────────┘
```

### Card de upgrade (plano Básico — ocupa toda a tela)
```
┌─────────────────────────────────────────────────────────────┐
│  🔒  Inteligência de Mercado — exclusivo Pro e Premium      │
│                                                             │
│  No dia anterior a cada licitação, você recebe no           │
│  WhatsApp uma análise com:                                  │
│  • Faixa de preço dos vencedores históricos                 │
│  • Lance mínimo aprovado (sem desclassificação)             │
│  • Sugestão de faixa para competir                          │
│                                                             │
│  Com R$97 você sabe que a licitação existe.                 │
│  Com R$197 você sabe quanto cobrar para ganhar.             │
│                                                             │
│  [Fazer upgrade para Pro — R$197/mês]                       │
└─────────────────────────────────────────────────────────────┘
```
Fundo `#F8FAFC`, borda `1px dashed #E5E7EB`, ícone cadeado `#9CA3AF`

### Card de histórico insuficiente (Pro/Premium — quando amostras < 3)
```
┌─────────────────────────────────────────────────────────────┐
│  🔬  Histórico insuficiente para esta licitação             │
│                                                             │
│  Não encontramos licitações similares suficientes para      │
│  gerar uma análise de preço confiável.                      │
│                                                             │
│  Dica geral: pregões costumam ter lances entre 5% e 15%     │
│  abaixo do valor de referência.                             │
│                                                             │
│  A análise aparecerá automaticamente quando tivermos        │
│  mais dados históricos para este segmento.                  │
└─────────────────────────────────────────────────────────────┘
```
Fundo `#FEF9C3`, borda `#FDE047`, texto `#854D0E`

### Modal "Briefing completo"
Ao clicar em "Ver briefing completo", abre painel lateral com:
- Texto completo gerado pelo Sonnet
- Gráfico simples (barras) mostrando a distribuição dos lances históricos
- Percentis: mínimo, 25%, mediana, 75%, máximo
- Lista das licitações similares analisadas (título + órgão + valor vencedor)

### Queries Supabase
```typescript
// Buscar briefings da empresa ordenados por data
const { data } = await supabase
  .from('analise_mercado')
  .select(`*, licitacoes_cache(titulo, orgao, data_abertura, valor_estimado, link_edital)`)
  .eq('empresa_id', empresaId)
  .eq('whatsapp_enviado', true)
  .order('created_at', { ascending: false })
  .limit(20)

// Cruzar com resultado (se tiver)
const { data: resultado } = await supabase
  .from('logs_disparo')
  .select('status_participacao, valor_contrato')
  .eq('empresa_id', empresaId)
  .eq('id_licitacao_gov', licitacaoId)
  .single()
```

---

## TELA 6 — CONFIGURAÇÕES
**Rota:** `/configuracoes`

### Seções
1. Dados da empresa — Razão Social, CNPJ, email
2. Meu plano — plano atual + botão upgrade com comparação de features
3. Notificações — toggle para pausar alertas temporariamente
4. Conta — botão para excluir conta (com confirmação)

---

## COMPONENTES COMPARTILHADOS

### Empty States (obrigatório em todas as telas)
- Nunca deixar tabela vazia sem mensagem
- Sempre incluir link de ação (ex: "Configurar filtros")

### Loading States
- Skeleton rows (3 barras cinzas animadas) enquanto carrega tabelas
- Cards de métrica mostram `—` enquanto carregam, nunca `0`

### Responsividade
- Sidebar → bottom nav no mobile (4 ícones)
- Tabelas → cards empilhados no mobile
- Chips de tag → wrap automático

---

## NOTAS DE IMPLEMENTAÇÃO

- Usar Supabase Auth (não Clerk) — mais simples, suficiente para este produto
- **Nunca usar service key no browser** — anon key + JWT do usuário para queries no frontend
- Formatação de valores: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Datas: `new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })`
- CNPJ com máscara: `react-imask`
- Telefone com máscara: `react-imask` com padrão `+55 (00) 00000-0000`
