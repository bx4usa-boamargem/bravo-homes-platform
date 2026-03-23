import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authorization token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { article_id } = await req.json();

    if (!article_id) {
      return new Response(JSON.stringify({ error: "article_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify access via RLS
    const { data: article, error: articleError } = await supabaseUser
      .from("articles")
      .select("id, title, focus_keyword, content, featured_image_url")
      .eq("id", article_id)
      .maybeSingle();

    if (articleError || !article) {
      return new Response(JSON.stringify({ error: "Article not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyword = article.focus_keyword || article.title;
    const imagePrompt = `Create a professional, modern blog cover image for an article about "${keyword}". Title: "${article.title}". The image should be visually striking with a clean, editorial style. Use abstract or conceptual imagery, no text overlays. High quality, 16:9 aspect ratio, vibrant colors with a professional feel.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Image generation error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    const imageDataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      throw new Error("No image returned from AI");
    }

    // Extract base64 and upload to storage
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image data URL format");

    const mimeType = match[1];
    const base64Data = match[2];
    const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpeg";

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `covers/cover-${article_id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("article-images")
      .upload(fileName, bytes, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image");
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("article-images")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update article with image URL
    const imageAlt = `${keyword} - imagem de capa`;
    let updatedContent = article.content || "";

    // Inject image at the top of content if not already present
    if (!/<img[\s>]/i.test(updatedContent)) {
      updatedContent = `<figure><img src="${publicUrl}" alt="${imageAlt}" loading="lazy" style="width:100%;border-radius:8px;margin-bottom:1.5rem;" /></figure>${updatedContent}`;
    }

    const { error: updateError } = await supabaseAdmin
      .from("articles")
      .update({
        featured_image_url: publicUrl,
        content: updatedContent,
      })
      .eq("id", article_id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update article");
    }

    return new Response(JSON.stringify({ success: true, image_url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cover-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
