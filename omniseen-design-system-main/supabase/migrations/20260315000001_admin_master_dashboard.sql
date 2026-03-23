-- =============================================================================
-- Migration: Admin Master Dashboard
-- Omniseen v3 — ADM MASTER SALA DE CONTROLE
-- Note: users = auth.users (Supabase auth), profiles = public.profiles
-- =============================================================================

-- ── 1. Adicionar colunas admin à tabela profiles ──────────────────────────────
alter table profiles
  add column if not exists is_admin      boolean default false,
  add column if not exists is_suspended  boolean default false,
  add column if not exists last_active_at timestamptz;

-- ── 2. Criar tabela ai_config ─────────────────────────────────────────────────
create table if not exists ai_config (
  id uuid primary key default gen_random_uuid(),
  function_name text not null unique,
  model_name text not null,
  fallback_model text,
  is_economy_mode boolean default false,
  is_premium_mode boolean default false,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

insert into ai_config (function_name, model_name, fallback_model) values
  ('outline',  'gpt-4o',             'gpt-4o-mini'),
  ('writing',  'gpt-4o',             'gpt-4o-mini'),
  ('meta',     'gpt-4o-mini',        'gpt-3.5-turbo'),
  ('image',    'fal-flux-dev',       'pollinations'),
  ('serp',     'serper-api',         null),
  ('places',   'google-places-api',  null)
on conflict (function_name) do nothing;

-- ── 3. Criar tabela agent_logs ────────────────────────────────────────────────
create table if not exists agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  pipeline_type text not null default 'article',
  pipeline_run_id uuid,
  user_id uuid references auth.users(id),
  blog_id uuid references blogs(id),
  article_id uuid references articles(id),
  landing_page_id uuid references landing_pages(id),
  duration_ms integer,
  tokens_used integer default 0,
  cost_usd numeric(10,6) default 0,
  model_used text,
  status text not null default 'success',
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists agent_logs_agent_created_idx on agent_logs (agent_name, created_at desc);
create index if not exists agent_logs_user_created_idx  on agent_logs (user_id, created_at desc);
create index if not exists agent_logs_pipeline_run_idx  on agent_logs (pipeline_run_id);
create index if not exists agent_logs_pipeline_type_idx on agent_logs (pipeline_type, created_at desc);
create index if not exists agent_logs_status_idx        on agent_logs (status, created_at desc);

alter table agent_logs enable row level security;
create policy "Admin full access agent_logs"
  on agent_logs for all
  using (
    exists (select 1 from profiles where user_id = auth.uid() and is_admin = true)
  );

-- ── 4. Criar tabela routing_rules ─────────────────────────────────────────────
create table if not exists routing_rules (
  id uuid primary key default gen_random_uuid(),
  condition_field text not null,
  condition_operator text not null,
  condition_value text not null,
  action_type text not null,
  action_value text,
  is_active boolean default true,
  priority integer default 10,
  created_at timestamptz default now()
);

insert into routing_rules (condition_field, condition_operator, condition_value, action_type, action_value, priority)
values
  ('plan',     'equals',       'free', 'force_model', 'gpt-4o-mini', 10),
  ('hour',     'less_than',    '6',    'set_mode',    'economy',      20),
  ('sections', 'greater_than', '5',    'force_model', 'gpt-4o',       30)
on conflict do nothing;

alter table routing_rules enable row level security;
create policy "Admin full access routing_rules"
  on routing_rules for all
  using (
    exists (select 1 from profiles where user_id = auth.uid() and is_admin = true)
  );

-- ── 5. Criar tabela admin_team_members ────────────────────────────────────────
create table if not exists admin_team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null default 'analyst',
  is_active boolean default true,
  invited_by uuid references auth.users(id),
  invite_token text unique,
  invite_expires_at timestamptz,
  accepted_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz default now()
);

alter table admin_team_members enable row level security;
create policy "Admin full access team_members"
  on admin_team_members for all
  using (
    exists (select 1 from profiles where user_id = auth.uid() and is_admin = true)
  );

-- ── 6. Adicionar colunas à tabela brand_agent_leads ──────────────────────────
alter table brand_agent_leads
  add column if not exists pipeline_type text default 'organic',
  add column if not exists converted_at  timestamptz,
  add column if not exists deal_value    numeric(10,2) default 0,
  add column if not exists segment       text;

-- ── 7. RPCs agregadas ─────────────────────────────────────────────────────────
create or replace function get_agent_costs_today()
returns table (
  agent_name text,
  calls_count bigint,
  total_tokens bigint,
  total_cost_usd numeric,
  error_count bigint,
  avg_duration_ms numeric
) language sql security definer as $$
  select
    agent_name,
    count(*) as calls_count,
    sum(tokens_used) as total_tokens,
    sum(cost_usd) as total_cost_usd,
    count(*) filter (where status != 'success') as error_count,
    avg(duration_ms) as avg_duration_ms
  from agent_logs
  where created_at >= current_date
  group by agent_name;
$$;

create or replace function get_pipeline_cost_breakdown(run_id uuid)
returns table (
  agent_name text,
  duration_ms integer,
  tokens_used integer,
  cost_usd numeric,
  model_used text,
  status text
) language sql security definer as $$
  select agent_name, duration_ms, tokens_used, cost_usd, model_used, status
  from agent_logs
  where pipeline_run_id = run_id
  order by created_at asc;
$$;

create or replace function get_client_roi_summary()
returns table (
  client_id uuid,
  client_name text,
  plan text,
  mrr_value numeric,
  total_leads bigint,
  converted_leads bigint,
  total_deal_value numeric,
  ai_cost_usd numeric,
  roi_ratio numeric,
  subcontas_count bigint,
  articles_count bigint,
  last_active_at timestamptz
) language sql security definer as $$
  select
    t.id as client_id,
    coalesce(p.full_name, '') as client_name,
    coalesce(s.plan, 'free') as plan,
    0::numeric as mrr_value,
    count(distinct l.id) as total_leads,
    count(distinct l.id) filter (where l.converted_at is not null) as converted_leads,
    coalesce(sum(distinct l.deal_value), 0) as total_deal_value,
    coalesce(sum(al.cost_usd), 0) as ai_cost_usd,
    case
      when coalesce(sum(al.cost_usd), 0) > 0
      then round(coalesce(sum(distinct l.deal_value), 0) / sum(al.cost_usd), 2)
      else 0
    end as roi_ratio,
    count(distinct b.id) as subcontas_count,
    count(distinct a.id) as articles_count,
    p.last_active_at
  from tenants t
  left join profiles p on p.user_id = t.owner_user_id
  left join subscriptions s on s.tenant_id = t.id
  left join blogs b on b.tenant_id = t.id
  left join brand_agent_leads l on l.blog_id = b.id
  left join articles a on a.blog_id = b.id
  left join agent_logs al on al.user_id = t.owner_user_id and al.created_at >= current_date - 30
  group by t.id, p.full_name, s.plan, t.plan, p.last_active_at;
$$;
