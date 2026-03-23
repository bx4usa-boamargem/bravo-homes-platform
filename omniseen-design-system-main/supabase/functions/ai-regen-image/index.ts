// supabase/functions/ai-regen-image/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, style = "photorealistic", context = "" } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: "prompt is required" }), { status: 400, headers: corsHeaders });

    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");

    const styleMap: Record<string, string> = {
      photorealistic: "professional photography, sharp focus, natural lighting, 8k quality",
      illustration: "digital illustration, flat design, vibrant colors, editorial style",
      vector: "vector art, clean lines, geometric shapes, modern minimalist",
      minimal: "minimalist, white background, simple composition, clean professional",
    };

    const fullPrompt = `${prompt}. ${context ? `Context: ${context}.` : ""} ${styleMap[style]}. No text, no watermarks. High quality.`;

    let imageUrl: string;

    if (FAL_API_KEY) {
      const res = await fetch("https://fal.run/fal-ai/flux/dev", {
        method: "POST",
        headers: { "Authorization": `Key ${FAL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt, image_size: "landscape_16_9" }),
      });
      if (!res.ok) throw new Error(`fal.ai error: ${res.status}`);
      const data = await res.json();
      imageUrl = data.images?.[0]?.url;
    } else {
      // Fallback Pollinations
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1200&height=630&nologo=true`;
    }

    return new Response(JSON.stringify({ image_url: imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: corsHeaders });
  }
});
