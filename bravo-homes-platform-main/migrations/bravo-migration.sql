-- ============================================================
-- BRAVO HOMES GROUP — Supabase Database Migration
-- Execute this in: Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/tyeaqluofishcvhvpwrg/sql
-- ============================================================

-- 1. USERS (admin e parceiros)
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE NOT NULL,
  name        text NOT NULL,
  role        text NOT NULL CHECK (role IN ('admin','partner')),
  avatar_url  text,
  phone       text,
  specialty   text,
  city        text,
  bio         text,
  rating      numeric(2,1) DEFAULT 5.0,
  created_at  timestamptz DEFAULT now()
);

-- 2. CLIENTS (clientes finais)
CREATE TABLE IF NOT EXISTS public.clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text,
  phone       text NOT NULL,
  address     text,
  city        text,
  state       text DEFAULT 'GA',
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- 3. LEADS (pipeline de vendas)
CREATE TABLE IF NOT EXISTS public.leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid REFERENCES public.clients(id),
  service_type        text NOT NULL,
  estimated_value     numeric(12,2),
  city                text,
  status              text DEFAULT 'new' CHECK (status IN ('new','qualified','visit_scheduled','proposal','closed','lost')),
  urgency             text DEFAULT 'warm' CHECK (urgency IN ('hot','warm','cool')),
  assigned_partner_id uuid REFERENCES public.users(id),
  source              text,
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- 4. PROJECTS (obras em andamento)
CREATE TABLE IF NOT EXISTS public.projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid REFERENCES public.clients(id) NOT NULL,
  partner_id      uuid REFERENCES public.users(id),
  lead_id         uuid REFERENCES public.leads(id),
  service_type    text NOT NULL,
  contract_value  numeric(12,2),
  start_date      date,
  end_date        date,
  progress_pct    integer DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  status          text DEFAULT 'pending' CHECK (status IN ('pending','active','on_hold','completed','cancelled')),
  city            text,
  address         text,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 5. PROJECT STAGES (etapas de execução)
CREATE TABLE IF NOT EXISTS public.project_stages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  name          text NOT NULL,
  stage_order   integer NOT NULL,
  status        text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  started_at    timestamptz,
  completed_at  timestamptz,
  notes         text
);

-- 6. PROJECT PHOTOS (fotos da obra)
CREATE TABLE IF NOT EXISTS public.project_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id      uuid REFERENCES public.project_stages(id),
  storage_url   text NOT NULL,
  caption       text,
  uploaded_by   uuid REFERENCES public.users(id),
  created_at    timestamptz DEFAULT now()
);

-- 7. PROJECT DOCUMENTS (documentos)
CREATE TABLE IF NOT EXISTS public.project_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  name          text NOT NULL,
  storage_url   text NOT NULL,
  category      text DEFAULT 'other' CHECK (category IN ('contract','quote','invoice','photo_report','other')),
  uploaded_by   uuid REFERENCES public.users(id),
  created_at    timestamptz DEFAULT now()
);

-- 8. CALENDAR EVENTS (calendário de obra)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  partner_id    uuid REFERENCES public.users(id),
  title         text NOT NULL,
  event_date    date NOT NULL,
  start_time    time,
  end_time      time,
  description   text,
  completed     boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- 9. DAILY LOGS (log diário do parceiro)
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  partner_id      uuid REFERENCES public.users(id),
  log_date        date NOT NULL DEFAULT CURRENT_DATE,
  activities      text NOT NULL,
  materials_used  text,
  workers_count   integer,
  created_at      timestamptz DEFAULT now()
);

-- 10. CONVERSATIONS (chat)
CREATE TABLE IF NOT EXISTS public.conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  type            text DEFAULT 'admin' CHECK (type IN ('client','admin')),
  created_at      timestamptz DEFAULT now()
);

-- 11. MESSAGES (mensagens do chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id         uuid REFERENCES public.users(id),
  content           text NOT NULL,
  attachment_url    text,
  read_at           timestamptz,
  created_at        timestamptz DEFAULT now()
);

-- 12. LANDING PAGES (monitoramento)
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  city            text,
  service_type    text,
  url             text,
  status          text DEFAULT 'draft' CHECK (status IN ('live','draft','archived')),
  visitors        integer DEFAULT 0,
  leads_count     integer DEFAULT 0,
  avg_lead_value  numeric(12,2),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Admins veem tudo
CREATE POLICY "admins_all" ON public.projects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Parceiros veem apenas seus projetos
CREATE POLICY "partners_own_projects" ON public.projects FOR SELECT USING (
  partner_id = auth.uid()
);

-- Parceiros veem apenas seus leads atribuídos
CREATE POLICY "partners_own_leads" ON public.leads FOR SELECT USING (
  assigned_partner_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- SEED DATA DE DEMONSTRAÇÃO
-- ============================================================

-- Usuário admin
INSERT INTO public.users (id, email, name, role, phone, city, specialty) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@bravohomes.com', 'Severino Bione', 'admin', '(770) 555-0001', 'Atlanta, GA', 'Owner'),
  ('00000000-0000-0000-0000-000000000002', 'marcus@bravohomes.com', 'Marcus Rivera', 'partner', '(770) 555-0101', 'Marietta, GA', 'Bathroom Remodel'),
  ('00000000-0000-0000-0000-000000000003', 'carlos@bravohomes.com', 'Carlos Mendez', 'partner', '(678) 555-0202', 'Alpharetta, GA', 'Kitchen Remodel'),
  ('00000000-0000-0000-0000-000000000004', 'tj@bravohomes.com', 'TJ Williams', 'partner', '(404) 555-0303', 'Milton, GA', 'Basement / Framing')
ON CONFLICT (email) DO NOTHING;

-- Clientes
INSERT INTO public.clients (id, name, email, phone, address, city) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Johnson Family', 'johnson@email.com', '(770) 111-0001', '123 Oak St', 'Marietta'),
  ('10000000-0000-0000-0000-000000000002', 'Patricia & John Webb', 'webb@email.com', '(678) 111-0002', '456 Maple Ave', 'Alpharetta'),
  ('10000000-0000-0000-0000-000000000003', 'Robert Thompson', 'thompson@email.com', '(404) 111-0003', '789 Pine Rd', 'Milton'),
  ('10000000-0000-0000-0000-000000000004', 'Sarah Mitchell', 'mitchell@email.com', '(770) 111-0004', '321 Elm Dr', 'Marietta')
ON CONFLICT DO NOTHING;

-- Projetos
INSERT INTO public.projects (id, client_id, partner_id, service_type, contract_value, start_date, end_date, progress_pct, status, city) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Full Kitchen Remodel', 48500, '2026-03-03', '2026-03-24', 75, 'active', 'Marietta'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Master Bathroom Remodel', 38200, '2026-03-10', '2026-03-31', 45, 'active', 'Alpharetta'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Basement Finishing', 62000, '2026-03-15', '2026-04-12', 20, 'active', 'Milton')
ON CONFLICT DO NOTHING;

-- Etapas do projeto 1
INSERT INTO public.project_stages (project_id, name, stage_order, status) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Demolição', 1, 'completed'),
  ('20000000-0000-0000-0000-000000000001', 'Instalação hidráulica', 2, 'completed'),
  ('20000000-0000-0000-0000-000000000001', 'Instalação elétrica', 3, 'completed'),
  ('20000000-0000-0000-0000-000000000001', 'Revestimento (piso/azulejo)', 4, 'in_progress'),
  ('20000000-0000-0000-0000-000000000001', 'Instalação de gabinetes', 5, 'pending'),
  ('20000000-0000-0000-0000-000000000001', 'Acabamentos finais', 6, 'pending'),
  ('20000000-0000-0000-0000-000000000001', 'Limpeza pós-obra', 7, 'pending'),
  ('20000000-0000-0000-0000-000000000001', 'Vistoria com cliente', 8, 'pending');

-- Leads
INSERT INTO public.leads (client_id, service_type, estimated_value, city, status, urgency, assigned_partner_id, source) VALUES
  ('10000000-0000-0000-0000-000000000004', 'Bathroom Remodel', 28000, 'Marietta', 'new', 'hot', '00000000-0000-0000-0000-000000000002', 'Nextdoor'),
  ('10000000-0000-0000-0000-000000000003', 'Basement Finish', 65000, 'Milton', 'visit_scheduled', 'hot', '00000000-0000-0000-0000-000000000004', 'Google');

-- Landing Pages
INSERT INTO public.landing_pages (name, city, service_type, status, visitors, leads_count, avg_lead_value) VALUES
  ('Bathroom Remodel', 'Marietta', 'Bathroom', 'live', 342, 27, 31000),
  ('Bathroom Remodel', 'Alpharetta', 'Bathroom', 'live', 218, 15, 44000),
  ('Kitchen Remodel', 'Milton', 'Kitchen', 'live', 156, 9, 58000),
  ('Basement Finishing', 'Woodstock', 'Basement', 'draft', 0, 0, 0);
