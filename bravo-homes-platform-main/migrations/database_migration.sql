-- Create 'profiles' table for user roles and details
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'parceiro', 'cliente')),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'cliente'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create 'stages' table for project progress
CREATE TABLE IF NOT EXISTS public.stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create 'daily_logs' for partner dashboard logs
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  log_text TEXT NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create 'documents' for project files/photos
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create basic policies to allow reading and writing for authenticated users (you can restrict this later)
CREATE POLICY "Allow authenticated read access" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update access" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow authenticated read/write access" ON public.stages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read/write access" ON public.daily_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read/write access" ON public.documents FOR ALL USING (auth.role() = 'authenticated');

-- Enable RLS and permissions for the missing projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read/write access for projects" ON public.projects;
CREATE POLICY "Allow authenticated read/write access for projects" ON public.projects FOR ALL USING (auth.role() = 'authenticated');

-- Adicionar colunas faltantes na tabela projects (caso não existam)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contract_value NUMERIC;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
