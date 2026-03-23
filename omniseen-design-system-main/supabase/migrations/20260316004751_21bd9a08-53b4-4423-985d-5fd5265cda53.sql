
-- Table: brand_settings (per-user brand identity + BYOK API keys)
CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name text NOT NULL DEFAULT '',
  brand_voice text NOT NULL DEFAULT 'profissional',
  target_audience text NOT NULL DEFAULT '',
  brand_colors jsonb NOT NULL DEFAULT '{"primary": "#7c3aed", "secondary": "#06b6d4"}'::jsonb,
  openai_api_key text,
  gemini_api_key text,
  fal_api_key text,
  serper_api_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own brand_settings"
  ON public.brand_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER set_brand_settings_updated_at
  BEFORE UPDATE ON public.brand_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
