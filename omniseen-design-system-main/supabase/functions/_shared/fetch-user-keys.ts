// ── Helper: Fetch global platform API keys ──────────────────────────────────
// All API keys come from Deno.env (Supabase Secrets) — NOT from user DB
// Brand settings (voice, audience) are fetched separately for prompt injection

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface PlatformApiKeys {
  openaiKey: string | null;
  geminiKey: string | null;
  falKey: string | null;
  serperKey: string | null;
  googlePlacesKey: string | null;
  lovableKey: string | null;
}

export interface BrandIdentity {
  brandName: string;
  brandVoice: string;
  targetAudience: string;
}

/** Get global platform API keys from environment */
export function getPlatformApiKeys(): PlatformApiKeys {
  return {
    openaiKey: Deno.env.get("OPENAI_API_KEY") || null,
    geminiKey: Deno.env.get("GEMINI_API_KEY") || null,
    falKey: Deno.env.get("FAL_API_KEY") || null,
    serperKey: Deno.env.get("SERPER_API_KEY") || null,
    googlePlacesKey: Deno.env.get("GOOGLE_PLACES_API_KEY") || null,
    lovableKey: Deno.env.get("LOVABLE_API_KEY") || null,
  };
}

/** Validate that critical keys are present, return missing key names */
export function validateRequiredKeys(keys: PlatformApiKeys): string[] {
  const missing: string[] = [];
  if (!keys.openaiKey) missing.push("OPENAI_API_KEY");
  return missing;
}

/** Fetch user's brand identity from brand_settings table */
export async function fetchBrandIdentity(
  supabase: SupabaseClient,
  userId: string,
): Promise<BrandIdentity> {
  const { data } = await supabase
    .from("brand_settings")
    .select("brand_name, brand_voice, target_audience")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    brandName: data?.brand_name || "",
    brandVoice: data?.brand_voice || "profissional",
    targetAudience: data?.target_audience || "",
  };
}
