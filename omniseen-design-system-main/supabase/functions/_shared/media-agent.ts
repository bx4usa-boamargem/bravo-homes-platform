// ── AGENTE 4: Media & Image Injector ─────────────────────────────────────────
// Responsável por: Substituir PLACEHOLDER_IMAGE por imagens reais
// Prioridade: Gemini (Lovable Gateway) → fal.ai → Pollinations (fallback)

import type { BlogContext } from "./serp-agent.ts";

const IMAGE_STYLES: Record<string, string> = {
  photorealistic: "professional photography, sharp focus, natural lighting, 8k, no text, no watermark",
  illustration: "digital illustration, flat design, vibrant colors, editorial style, no text",
  vector: "vector art, clean geometric shapes, modern minimalist, no text",
  minimal: "minimalist composition, white background, soft shadows, clean professional, no text",
};

// ── Gerar imagem via Gemini (Lovable Gateway) ────────────────────────────────
async function generateViaGemini(
  promptText: string,
  lovableApiKey: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: promptText }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      console.warn(`[MediaAgent] Gemini HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const dataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (dataUrl?.startsWith("data:image/")) {
      // Upload to Supabase Storage for permanent URL
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const ext = mimeType === "image/png" ? "png" : "jpeg";
        const binaryStr = atob(match[2]);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        const fileName = `inline/img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const admin = createClient(supabaseUrl, serviceKey);

        const { error: upErr } = await admin.storage
          .from("article-images")
          .upload(fileName, bytes, { contentType: mimeType, upsert: false });

        if (!upErr) {
          return admin.storage.from("article-images").getPublicUrl(fileName).data.publicUrl;
        }
        console.warn("[MediaAgent] Storage upload error:", upErr.message);
      }
    }
    return null;
  } catch (e) {
    console.warn("[MediaAgent] Gemini error:", e);
    return null;
  }
}

// ── Gerar imagem via fal.ai FLUX (premium fallback) ──────────────────────────
async function generateViaFal(
  promptText: string,
  falApiKey: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        Authorization: `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: promptText,
        image_size: "landscape_16_9",
        num_inference_steps: 28,
        guidance_scale: 3.5,
      }),
    });
    if (!res.ok) {
      console.warn(`[MediaAgent] fal.ai HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data.images?.[0]?.url ?? null;
  } catch (e) {
    console.warn("[MediaAgent] fal.ai error:", e);
    return null;
  }
}

// ── Gerar imagem com fallback cascading (SEM Pollinations) ───────────────────
async function generateImage(
  promptText: string,
  falApiKey: string | null,
): Promise<string> {
  // 1. Try Gemini via Lovable Gateway (always available)
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    const geminiUrl = await generateViaGemini(promptText, lovableKey);
    if (geminiUrl) return geminiUrl;
  }

  // 2. Try fal.ai
  if (falApiKey) {
    const falUrl = await generateViaFal(promptText, falApiKey);
    if (falUrl) return falUrl;
  }

  // 3. NO more Pollinations fallback — throw clear error
  throw new Error(
    "Falha na geração de imagem: Gemini e FAL.ai não disponíveis. " +
    "Configure sua FAL.ai API Key nas Configurações da Marca para imagens de alta qualidade."
  );
}

// ── Substituir PLACEHOLDER_IMAGE por imagens reais ───────────────────────────
async function replacePlaceholders(
  content: string,
  keyword: string,
  imageStyle: string,
  falApiKey: string | null,
): Promise<string> {
  const placeholderRegex = /<img([^>]*)src="PLACEHOLDER_IMAGE"([^>]*)>/gi;
  const matches: Array<{ fullMatch: string; altText: string }> = [];

  let m: RegExpExecArray | null;
  while ((m = placeholderRegex.exec(content)) !== null) {
    const allAttrs = (m[1] ?? "") + (m[2] ?? "");
    const altMatch = allAttrs.match(/alt="([^"]*)"/i);
    matches.push({
      fullMatch: m[0],
      altText: altMatch?.[1] ?? keyword,
    });
  }

  if (matches.length === 0) return content;
  console.log(`[MediaAgent] ${matches.length} placeholder(s) a substituir`);

  const styleDesc = IMAGE_STYLES[imageStyle] ?? IMAGE_STYLES.photorealistic;
  let result = content;

  for (let i = 0; i < matches.length; i++) {
    const { fullMatch, altText } = matches[i];
    const imagePrompt = `${altText}, related to ${keyword}. ${styleDesc}`;

    // Small delay between images to avoid rate limits
    if (i > 0) await new Promise((r) => setTimeout(r, 1500));

    try {
      const imageUrl = await generateImage(imagePrompt, falApiKey);
      const newImg = fullMatch.replace('src="PLACEHOLDER_IMAGE"', `src="${imageUrl}"`);
      result = result.replace(fullMatch, newImg);
      console.log(`[MediaAgent] ✅ Imagem ${i + 1}/${matches.length} injetada`);
    } catch (e) {
      // Remove the placeholder img tag entirely instead of leaving broken image
      result = result.replace(fullMatch, `<!-- imagem ${i + 1} não gerada: configure FAL_API_KEY -->`);
      console.warn(`[MediaAgent] ⚠️ Imagem ${i + 1}/${matches.length} falhou: ${e instanceof Error ? e.message : e}`);
    }
  }

  return result;
}

// ── Entry point do agente ─────────────────────────────────────────────────────
export async function runMediaAgent(
  content: string,
  keyword: string,
  articleTitle: string,
  blogContext: BlogContext,
  falApiKey: string | null,
): Promise<{ content: string; featuredImageUrl: string }> {
  console.log("[MediaAgent] Iniciando injeção de mídia...");

  const imageStyle = blogContext.imageStyle || "photorealistic";

  // Substituir placeholders inline
  const contentWithImages = await replacePlaceholders(
    content,
    keyword,
    imageStyle,
    falApiKey,
  );

  // Gerar featured image (capa do artigo)
  let featuredImageUrl = "";
  try {
    const styleDesc = IMAGE_STYLES[imageStyle] ?? IMAGE_STYLES.photorealistic;
    const featuredPrompt = `${articleTitle} — ${blogContext.segmento}${blogContext.cidade ? ` em ${blogContext.cidade}` : ""}. ${styleDesc}`;
    featuredImageUrl = await generateImage(featuredPrompt, falApiKey);
    console.log(`[MediaAgent] ✅ Featured image gerada`);
  } catch (e) {
    console.warn(`[MediaAgent] ⚠️ Featured image falhou: ${e instanceof Error ? e.message : e}`);
  }

  const imgCount = (contentWithImages.match(/<img/gi) ?? []).length;
  console.log(`[MediaAgent] ${imgCount} imagens inline no conteúdo`);

  return { content: contentWithImages, featuredImageUrl };
}