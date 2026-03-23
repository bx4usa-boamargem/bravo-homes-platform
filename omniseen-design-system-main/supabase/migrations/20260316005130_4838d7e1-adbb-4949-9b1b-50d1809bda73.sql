
-- Remove API key columns from brand_settings (keys are global platform secrets only)
ALTER TABLE public.brand_settings
  DROP COLUMN IF EXISTS openai_api_key,
  DROP COLUMN IF EXISTS gemini_api_key,
  DROP COLUMN IF EXISTS fal_api_key,
  DROP COLUMN IF EXISTS serper_api_key;
