-- =========================================================
-- ATUALIZAÇÃO REQUERIDA NO BANDO DE DADOS: CALENDÁRIO
-- =========================================================

-- Adiciona as colunas ausentes na tabela calendar_events
-- para permitir vínculo direto a Projetos e Usuários, e sanar o RLS.
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Cria índices para acelerar a performance nas consultas da Dashboard
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON public.calendar_events(project_id);
