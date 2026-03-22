-- Schema Supabase para o Bravo Homes Group
-- Copie e cole no painel do Supabase (SQL Editor) e clique em "RUN".

-- 1. Habilitar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Usuários (Estendendo auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'partner', 'client', 'cliente', 'parceiro')) DEFAULT 'client',
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Ativar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas de Usuário
CREATE POLICY "Leitura pública para autenticados" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem alterar tudo" ON public.users FOR ALL TO authenticated USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Usuários editam a si mesmos" ON public.users FOR UPDATE TO authenticated USING ( auth.uid() = id );

-- Trigger para criar o perfil automaticamente no primeiro login ou cadastro via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'Usuário Cliente'), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'client')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Tabela de Leads (Recebe dados do Lovable Landing Pages e Chatbots AI)
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_type TEXT,
  location TEXT,
  details TEXT,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'em_atendimento', 'convertido', 'perdido')),
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- Permitir INSERT para anônimos (Essencial para Landing Pages / Formulários)
CREATE POLICY "Anônimos podem inserir leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins veem e editam leads" ON public.leads FOR ALL TO authenticated USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Parceiros veem leads" ON public.leads FOR SELECT TO authenticated USING ( (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'partner') );

-- 4. Tabela de Projetos
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client_id UUID REFERENCES public.users(id),
  partner_id UUID REFERENCES public.users(id),
  service_type TEXT,
  budget NUMERIC(15,2),
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'briefing' CHECK (status IN ('briefing', 'preparation', 'execution', 'delivered')),
  address TEXT,
  start_date DATE,
  expected_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins podem tudo em projetos" ON public.projects FOR ALL TO authenticated USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Parceiros veem e editam seus projetos" ON public.projects FOR ALL TO authenticated USING ( partner_id = auth.uid() );
CREATE POLICY "Clientes veem seus projetos" ON public.projects FOR SELECT TO authenticated USING ( client_id = auth.uid() );

-- 5. Financeiro (Transações)
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins veem tudo e gerenciam" ON public.transactions FOR ALL TO authenticated USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Parceiros gerenciam despesas" ON public.transactions FOR ALL TO authenticated USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'partner' );
CREATE POLICY "Clientes veem faturas do seu projeto" ON public.transactions FOR SELECT TO authenticated USING ( EXISTS(SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.client_id = auth.uid()) );

-- 6. Chat & AI Assistente (Mensagens)
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de mensagens do projeto" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.client_id = auth.uid() OR p.partner_id = auth.uid()))
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Enviar mensagens" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() OR is_ai = true);

-- FIM DO SCRIPT
