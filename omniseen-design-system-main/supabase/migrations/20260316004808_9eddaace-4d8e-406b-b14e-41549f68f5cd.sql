
-- Fix: RLS on ai_config table (detected by linter)
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access ai_config"
  ON public.ai_config FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  ));
