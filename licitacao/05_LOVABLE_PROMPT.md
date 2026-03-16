# PROMPT LOVABLE — LICITAÍ

---

## CONTEXTO DO PROJETO

Crie uma plataforma SaaS chamada **Licitaí** para empresas brasileiras que participam de licitações públicas federais. O produto monitora automaticamente o Portal de Compras do Governo e envia alertas via WhatsApp quando surgem licitações relevantes para cada empresa.

**Usuário principal:** Dono ou responsável comercial de pequena empresa, acessa o painel para configurar o que quer monitorar e ver o histórico de alertas recebidos.

---

## STACK TÉCNICA

- **Framework:** Next.js 14 com App Router
- **Autenticação:** Supabase Auth (email/senha)
- **Banco de dados:** Supabase (PostgreSQL)
- **Estilização:** Tailwind CSS
- **Linguagem:** TypeScript
- **Ícones:** Lucide React

---

## DESIGN SYSTEM

### Paleta de cores

```
Primária (Navy):      #1E3A8A   → header, sidebar, botões principais
Sucesso (Emerald):    #10B981   → alertas encontrados, status ativo, CTAs
Surface:              #F3F4F6   → fundo da página
Card:                 #FFFFFF   → fundo dos cards
Borda:                #E5E7EB   → todas as bordas
Texto principal:      #111827   → gray-900
Texto secundário:     #6B7280   → gray-500

Alerta enviado:    bg #D1FAE5 / text #065F46   (green-100 / green-900)
Alerta falha:      bg #F3F4F6 / text #374151   (gray-100 / gray-700)
Prazo urgente:     text #DC2626                 (red-600, < 3 dias)
```

### Tipografia
- Font: `Inter` via Google Fonts
- Peso: 400 e 500 apenas
- Valores monetários: `tabular-nums`
- IDs e CNPJs: `font-mono`

---

## SCHEMA DO BANCO (Supabase)

Tipos TypeScript para as 5 tabelas:

```typescript
// empresas — clientes da plataforma
interface Empresa {
  id: string
  supabase_user_id: string
  razao_social: string
  cnpj?: string
  email: string
  plano: 'basico' | 'pro' | 'premium'
  ativo: boolean
  created_at: string
}

// whatsapp_numeros — números por empresa
interface WhatsappNumero {
  id: string
  empresa_id: string
  numero: string   // formato: 5511999999999
  ativo: boolean
  created_at: string
}

// filtros_busca — configuração de monitoramento
interface FiltroBusca {
  id: string
  empresa_id: string
  palavras_chave: string[]
  cnaes: string[]
  estados: string[]
  valor_minimo: number
  ativo: boolean
  updated_at: string
}

// licitacoes_cache — cache diário da API do governo
interface LicitacaoCache {
  id_licitacao_gov: string
  titulo: string
  objeto?: string
  orgao?: string
  uf?: string
  modalidade?: string
  data_abertura?: string
  valor_estimado?: number
  link_edital?: string
  data_publicacao: string
  created_at: string
}

// logs_disparo — histórico de alertas enviados
interface LogDisparo {
  id: string
  empresa_id: string
  id_licitacao_gov: string
  numero_whatsapp: string
  status_envio: 'enviado' | 'falha' | 'pulado'
  created_at: string
}
```

---

## LAYOUT GLOBAL

### Sidebar (desktop) — fundo #1E3A8A

```
[L]  Licitaí          ← logo: quadrado emerald com "L" + nome
──────────────────
  Dashboard
  Configurar Alertas
  Meus Números
  Histórico         ← badge vermelho com contagem de hoje
──────────────────
  Configurações
  → Sair
```

### Header
```
[Título da página]               [Razão Social]
                                  PLANO BÁSICO   [iniciais em círculo]
```

---

## TELA 1 — DASHBOARD `/dashboard`

### Layout
```
"Bom dia, [Nome]!"
"Seus alertas de licitações de hoje."

[Card: Alertas Hoje]  [Card: Este Mês]  [Card: Total Enviado]

Últimos Alertas (5 linhas)                    [Ver histórico →]
LICITAÇÃO | ÓRGÃO | VALOR | PRAZO | STATUS
```

### Cards de métrica
- Fundo `#F3F4F6` sem borda
- Ícone 32×32px no topo esquerdo do card (cor emerald para positivos)
- Label: 11px uppercase gray-500
- Número: 26px font-weight 500

### Queries Supabase

```typescript
// Alertas de hoje
const hoje = new Date().toISOString().split('T')[0]
const { count: alertasHoje } = await supabase
  .from('logs_disparo')
  .select('*', { count: 'exact', head: true })
  .eq('empresa_id', empresaId)
  .eq('status_envio', 'enviado')
  .gte('created_at', `${hoje}T00:00:00`)

// Últimos 5 alertas com dados da licitação
const { data } = await supabase
  .from('logs_disparo')
  .select(`*, licitacoes_cache(titulo, orgao, valor_estimado, data_abertura, link_edital)`)
  .eq('empresa_id', empresaId)
  .eq('status_envio', 'enviado')
  .order('created_at', { ascending: false })
  .limit(5)
```

### Coluna PRAZO
- Normal: `DD/MM/AAAA` gray-700
- Menos de 3 dias: `DD/MM/AAAA` red-600 com ponto vermelho

---

## TELA 2 — CONFIGURAR ALERTAS `/configurar`

### Layout
```
"Configurar Alertas"
"Defina o que você quer monitorar. Qualquer licitação que bater
nos seus critérios chega no seu WhatsApp automaticamente."

┌─────────────────────────────────────────────────────────┐
│ Palavras-chave                                          │
│ [seringa ×] [luva ×] [material hospitalar ×] [+ Add]   │
│ Dica: termos que aparecem no objeto da licitação        │
├─────────────────────────────────────────────────────────┤
│ CNAE (atividade econômica)                              │
│ [47.72-5 × ] [+ Adicionar]                              │
│ Dica: use seu CNAE principal ou secundários             │
├─────────────────────────────────────────────────────────┤
│ Estados (vazio = todo o Brasil)                         │
│ [SP ×] [RJ ×] [+ Adicionar]                             │
├─────────────────────────────────────────────────────────┤
│ Valor mínimo                                            │
│ R$ [___________]  (0 = sem limite mínimo)               │
└─────────────────────────────────────────────────────────┘

[Salvar configurações]   ← botão emerald
```

### Comportamento dos chips
- Enter ou vírgula adiciona novo chip
- Chips com botão × para remover
- Auto-save com debounce 1s + botão explícito

### Limites por plano
```typescript
const limites = {
  basico:  { palavras: 5,   cnaes: 2,  estados: 3  },
  pro:     { palavras: 20,  cnaes: 5,  estados: 10 },
  premium: { palavras: 999, cnaes: 999, estados: 27 },
}
```

---

## TELA 3 — MEUS NÚMEROS `/numeros`

### Layout
```
"Números de WhatsApp"
"Os alertas serão enviados para estes números."
                                      [+ Adicionar Número]

+55 (11) 99999-9999   [ATIVO]   [editar] [remover]
+55 (11) 88888-8888   [ATIVO]   [editar] [remover]

2 de 3 números usados (Plano Básico)
```

### Modal Adicionar Número
```
Número *
[+55 (  )     -    ]   ← máscara automática

[Cancelar]   [Adicionar e Testar]
```

Ao adicionar: chamar API route `/api/whatsapp/testar` que envia:
> "Olá! Número cadastrado com sucesso no Licitaí. Você receberá alertas de licitações aqui. 🎉"

---

## TELA 4 — HISTÓRICO `/historico`

### Layout
```
"Histórico de Alertas"
"Todas as licitações que encontramos para você."

[Buscar...]                               [Filtrar por data ▾]

DATA  | LICITAÇÃO (60 chars)  | VALOR  | PRAZO  | STATUS
──────────────────────────────────────────────────────────
14/03 | Aquisição de mat...   | 280k   | 20/03  | ✓ Enviado
13/03 | Serviços de limp...   | 45k    | 18/03  | ✓ Enviado
```

### Row expandível
Clique na linha para expandir:
```
Objeto completo: [texto completo]
Órgão: [nome]  |  UF: SP  |  Modalidade: Pregão Eletrônico
[Acessar Edital ↗]
```

### Empty state
```
Nenhum alerta enviado ainda.
Os alertas chegam diariamente às 06:00.
[Configurar meus filtros →]
```

---

## COMPONENTES OBRIGATÓRIOS

### Badge de status
```tsx
const BadgeStatus = ({ status }: { status: 'enviado' | 'falha' | 'pulado' }) => {
  const config = {
    enviado: { label: 'Enviado', bg: 'bg-green-100', text: 'text-green-800' },
    falha:   { label: 'Falha',   bg: 'bg-gray-100',  text: 'text-gray-600'  },
    pulado:  { label: 'Repetido',bg: 'bg-gray-50',   text: 'text-gray-400'  },
  }
  const { label, bg, text } = config[status]
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bg} ${text}`}>{label}</span>
}
```

### Loading skeleton (usar em todas as tabelas)
```tsx
const SkeletonRow = () => (
  <div className="flex gap-4 py-3 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-20" />
    <div className="h-4 bg-gray-200 rounded flex-1" />
    <div className="h-4 bg-gray-200 rounded w-24" />
  </div>
)
```

### Formatação de valores
```typescript
const formatarValor = (v?: number) =>
  v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—'

const formatarData = (d?: string) =>
  d ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d)) : '—'
```

---

## REGRAS DE IMPLEMENTAÇÃO

1. **NUNCA usar service key no browser** — somente anon key + JWT do usuário logado
2. **RLS ativo** em todas as tabelas — não desabilitar para debug
3. **Mobile-first** — sidebar vira bottom nav no mobile
4. **Sentence case** em labels — nunca CAPS LOCK
5. **Empty states** em toda tabela — nunca tela em branco
6. **Skeleton** nas tabelas enquanto carrega — nunca spinner bloqueante

---

## ORDEM DE BUILD NO LOVABLE

1. Layout global (sidebar + header + Supabase Auth)
2. Dashboard com cards e tabela de últimos alertas
3. Configurar Alertas com chips de palavras-chave, CNAE e estados
4. Meus Números com modal e teste de envio
5. Histórico com busca e row expandível
6. Configurações de conta e plano
