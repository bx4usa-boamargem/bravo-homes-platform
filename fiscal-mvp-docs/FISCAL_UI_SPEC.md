# FISCAL MVP V1 — UI SPECIFICATION

## DOCUMENT CLASSIFICATION
- **Document Type:** UI Specification
- **Authority Level:** LEVEL 3 — Visual Source of Truth
- **Version:** 1.1
- **Status:** ACTIVE — BINDING

> UI is only built after Phase 2 (engine) is signed off per DEVELOPMENT_EXECUTION_ORDER.

---

## DESIGN PHILOSOPHY

1. **Utility over Beauty** — accountants need speed and clarity, not animations
2. **Status-Driven** — every screen communicates fiscal health at a glance
3. **Mobile-Readable** — accountants check reports on their phones at 08:00 AM
4. **No Surprises** — never hide or soften bad fiscal news. Be clear.

---

## DESIGN TOKENS

### Color Palette

```css
/* Status colors — semantic, never decorative */
--color-limpo-bg:       #dcfce7;  /* green-100 */
--color-limpo-text:     #166534;  /* green-800 */
--color-limpo-border:   #86efac;  /* green-300 */

--color-pendente-bg:    #fee2e2;  /* red-100 */
--color-pendente-text:  #991b1b;  /* red-800 */
--color-pendente-border:#fca5a5;  /* red-300 */

--color-falha-bg:       #f3f4f6;  /* gray-100 */
--color-falha-text:     #374151;  /* gray-700 */
--color-falha-border:   #d1d5db;  /* gray-300 */

--color-verificacao-bg: #fef9c3;  /* yellow-100 */
--color-verificacao-text:#854d0e; /* yellow-800 */
--color-verificacao-border:#fde047; /* yellow-300 */

/* Brand — Navy + action blue */
--color-primary:        #0f2952;  /* Navy — headers, logo */
--color-action:         #1d4ed8;  /* Blue-700 — buttons, links */
--color-surface:        #f8fafc;  /* Slate-50 — page background */
--color-card:           #ffffff;  /* White — card backgrounds */
--color-border:         #e2e8f0;  /* Slate-200 — borders */
--color-text-primary:   #0f172a;  /* Slate-900 */
--color-text-secondary: #64748b;  /* Slate-500 */
```

### Typography
- **Font:** Inter (system-ui fallback)
- **Base:** 14px / line-height 1.5
- **Headings:** 500 weight (not bold)
- **Numbers/Values:** Tabular nums, monospace for CNPJs

### Status Badges Component

```tsx
// Usage: <StatusBadge status="limpo" />
const StatusBadge = ({ status }) => {
  const config = {
    limpo:            { label: 'Limpo',        icon: '✓', bg: 'bg-green-100', text: 'text-green-800' },
    pendente:         { label: 'Pendência',     icon: '!', bg: 'bg-red-100',   text: 'text-red-800'   },
    falha:            { label: 'Falha',         icon: '↺', bg: 'bg-gray-100',  text: 'text-gray-700'  },
    verificacao_manual:{ label: 'Verificar',   icon: '?', bg: 'bg-yellow-100',text: 'text-yellow-800'},
    indisponivel:     { label: 'Indisponível',  icon: '–', bg: 'bg-gray-100',  text: 'text-gray-500'  },
  };
  const { label, icon, bg, text } = config[status] ?? config.falha;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      <span>{icon}</span> {label}
    </span>
  );
};
```

---

## SCREEN 01 — Dashboard
**Route:** `/client/dashboard`
**Purpose:** Morning overview. Accountant sees health at a glance in < 5 seconds.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: "Bom dia, [Nome]"          [logout] [plan] │
├─────────────────────────────────────────────────────┤
│  ┌───────────────┐ ┌───────────────┐ ┌───────────┐  │
│  │ Empresas      │ │ Pendências    │ │ Falhas    │  │
│  │ Monitoradas   │ │ Encontradas   │ │ na Última │  │
│  │    [N]        │ │    [N]  ⚠    │ │   [N] 🔴  │  │
│  └───────────────┘ └───────────────┘ └───────────┘  │
├─────────────────────────────────────────────────────┤
│  Últimas Consultas (5 rows)                         │
│  Empresa | CNPJ | Status | Data | [Ver detalhes]    │
└─────────────────────────────────────────────────────┘
```

### Data Source
```sql
-- Metric 1: Total empresas
SELECT COUNT(*) FROM empresas WHERE contador_id = $1 AND ativo = true;

-- Metric 2: Pendências (latest consulta per empresa)
SELECT COUNT(DISTINCT e.id) FROM empresas e
JOIN consultas c ON c.empresa_id = e.id
WHERE e.contador_id = $1
  AND c.status = 'pendente'
  AND c.created_at = (SELECT MAX(created_at) FROM consultas WHERE empresa_id = e.id);

-- Metric 3: Last 5 consultas
SELECT e.razao_social, e.cnpj, c.status, c.created_at
FROM consultas c JOIN empresas e ON e.id = c.empresa_id
WHERE e.contador_id = $1
ORDER BY c.created_at DESC LIMIT 5;
```

---

## SCREEN 02 — Empresas (CNPJs)
**Route:** `/client/empresas`
**Purpose:** Manage which CNPJs are monitored.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Empresas                     [+ Adicionar Empresa] │
├────────────────────┬──────────────────┬─────────────┤
│  Razão Social      │  CNPJ            │  Ações      │
├────────────────────┼──────────────────┼─────────────┤
│  Acme Ltda         │  12.345.678/0001 │  [✎] [🗑]  │
│  Tech Eireli       │  98.765.432/0001 │  [✎] [🗑]  │
└────────────────────┴──────────────────┴─────────────┘
```

### Modal "Adicionar Empresa"

```
┌─────────────────────────────────────┐
│  Adicionar Empresa            [×]   │
├─────────────────────────────────────┤
│  CNPJ *                             │
│  [__.___.___/____-__]  (masked)     │
│                                     │
│  Razão Social *                     │
│  [_________________________________]│
│                                     │
│  [Cancelar]           [Adicionar]   │
└─────────────────────────────────────┘
```

**Validation rules:**
- CNPJ must pass digit verification algorithm before submit
- Duplicate CNPJ for same `contador_id` returns error: "Este CNPJ já está sendo monitorado"
- Razão Social is required (accountant fills manually for now — no CNPJ lookup API in MVP)

---

## SCREEN 03 — Central de Certidões
**Route:** `/client/consultas`
**Purpose:** Full fiscal status history with PDF access.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Situação Fiscal                                                │
│  Filtrar: [Todos ▾] [Limpo] [Pendência] [Falha] [Verificar]   │
├──────────────┬────────────┬──────────────┬───────────┬─────────┤
│  Empresa     │  Status    │  Atualizado  │ Diagnóstico│ Doc.   │
├──────────────┼────────────┼──────────────┼───────────┼─────────┤
│  Acme Ltda   │ ⚠ Pendência│ 15/01 08:12  │ FGTS Fe...│[PDF ↓] │
│  Tech Eireli │ ✓ Limpo    │ 15/01 08:14  │ Sem pend. │[PDF ↓] │
│  Sol & Cia   │ ↺ Falha    │ 15/01 08:16  │ Portal in.│  —     │
└──────────────┴────────────┴──────────────┴───────────┴─────────┘
```

### Diagnóstico Column
- Show first 60 characters, truncated with `…`
- On hover (desktop) or tap (mobile): show full text in tooltip
- Never show raw technical errors in this column — always translated via `linguagem-contabil` skill

### Documento Column
- `pdf_url` present → show `[↓ Baixar PDF]` as anchor link (opens Google Drive)
- `pdf_url` null + status `limpo` → show `[Gerando…]` (still uploading)
- `pdf_url` null + status `falha` → show `—`

---

## SHARED COMPONENTS

### Page Layout Wrapper
```
┌──────────────────────────────────────────────────────┐
│  [Logo]  FiscalMVP              [Nome]  [Sair]       │  ← Header (navy bg)
├──────────────┬───────────────────────────────────────┤
│  Dashboard   │                                       │
│  Empresas    │   [Page Content Here]                 │
│  Certidões   │                                       │
│              │                                       │
└──────────────┴───────────────────────────────────────┘
     Sidebar (desktop) / Bottom nav (mobile)
```

### Empty States
Each table must have an empty state (not a blank screen):
- Empresas empty: "Nenhuma empresa cadastrada ainda. Clique em '+ Adicionar Empresa' para começar."
- Consultas empty: "Nenhuma consulta realizada. As consultas são executadas automaticamente às 07:30."

### Loading States
- Tables: use skeleton rows (3 gray bars) while fetching — never spinner blocking the full page
- Metric cards: show `—` while loading, not `0` (avoids misleading accountant)

---

## IMPLEMENTATION NOTES

- Use Tailwind CSS utility classes (no custom CSS files)
- Use Supabase JS client with RLS (anon key + user JWT) — NEVER service key in browser
- Use Clerk `useUser()` hook to get `clerk_user_id` for all queries
- CNPJ input must use a mask library (e.g. `react-imask`) — format: `XX.XXX.XXX/XXXX-XX`
- All dates displayed in `dd/MM HH:mm` format (Brasília timezone)
- Tables must be responsive: on mobile, collapse to card layout per row
