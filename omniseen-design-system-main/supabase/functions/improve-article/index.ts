import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ActionType = "review" | "rewrite" | "improve" | "expand";

const IMAGE_STYLES = [
  "professional editorial photograph with natural lighting, shot on DSLR, depth of field, no text",
  "clean flat-lay composition with subtle gradients and modern design elements, minimalist, no text",
  "cinematic wide-angle scene, moody lighting, film grain, no text",
  "vibrant isometric 3D illustration with soft shadows and pastel colors, modern, no text",
  "watercolor-style artistic illustration with organic shapes and flowing colors, no text",
  "high-contrast geometric abstract art with bold shapes, no text",
  "realistic overhead desk scene with relevant objects, warm tones, lifestyle photography, no text",
  "infographic-style visual with icons and data visualization elements, clean background, no text",
];

const ACTION_PROMPTS: Record<ActionType, string> = {
  review: `You are a Senior SEO Editor. Review this article and provide a detailed analysis in JSON format:
{
  "overall_grade": "A/B/C/D/F",
  "summary": "2-3 sentence overall assessment",
  "strengths": ["list of strong points"],
  "issues": [{"type": "seo|readability|structure|content", "severity": "high|medium|low", "description": "what's wrong", "suggestion": "how to fix"}],
  "seo_recommendations": ["actionable SEO improvements"],
  "readability_score": 0-100,
  "content_quality_score": 0-100
}
Analyze: heading hierarchy, keyword density, paragraph length, E-E-A-T signals, meta tags, internal structure, engagement hooks, and FAQ quality.
Return ONLY valid JSON.`,

  rewrite: `You are an International-Level SEO Copywriter. Completely rewrite this article following Super Page structure.

CRITICAL HTML RULES:
- Use proper HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <table>, <blockquote>, <strong>
- Exactly ONE <h1> at the beginning — magnetic, includes main keyword
- <h2> for main subtopics with descriptive SEO-focused titles (NOT "Introduction" or "Conclusion")
- <h3> under <h2> to deepen topics. Never skip H1→H3
- For EACH <h2>, add an image placeholder right after: <figure><img src="PLACEHOLDER_IMAGE" alt="[Descriptive SEO alt text about the section]" loading="lazy" style="width:100%;border-radius:8px;margin-bottom:1.5rem;" /></figure>
- Short paragraphs (max 3-4 lines), bullet lists, tables, blockquotes
- FAQ section with <h2>Perguntas Frequentes (FAQ)</h2> and 5+ questions
- NO AI clichés, active voice, strong verbs, humanized tone

Return JSON: {"title":"...","content":"full HTML with PLACEHOLDER_IMAGE","meta_title":"max 60 chars","meta_description":"max 160 chars","excerpt":"2-3 sentences"}
Return ONLY valid JSON.`,

  improve: `You are a Senior SEO Content Optimizer. Improve this article while preserving its core message.

CRITICAL HTML RULES:
- Ensure proper HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <table>, <blockquote>
- Fix heading hierarchy (H1 > H2 > H3, descriptive titles, NOT vague)
- Shorten long paragraphs (max 3-4 lines each)
- Add bullet lists or tables where data is presented
- Strengthen the hook/introduction (3 short empathetic paragraphs)
- Add blockquotes for key insights
- Improve keyword placement and LSI terms
- Fix passive voice → active voice
- Remove AI clichés
- Ensure FAQ has 5+ questions
- Keep existing <img> tags intact, do NOT change their src URLs
- Add <figure><img src="PLACEHOLDER_IMAGE" alt="[descriptive text]" loading="lazy" style="width:100%;border-radius:8px;margin-bottom:1.5rem;" /></figure> after any <h2> that lacks an image

Return JSON: {"title":"...","content":"improved HTML","meta_title":"max 60 chars","meta_description":"max 160 chars","excerpt":"2-3 sentences"}
Return ONLY valid JSON.`,

  expand: `You are an Expert Content Writer. Expand this article significantly.

CRITICAL HTML RULES:
- Use proper HTML: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <table>, <blockquote>
- Add 2-3 new <h2> sections with relevant subtopics
- For each NEW <h2>, add: <figure><img src="PLACEHOLDER_IMAGE" alt="[descriptive SEO alt text]" loading="lazy" style="width:100%;border-radius:8px;margin-bottom:1.5rem;" /></figure>
- Deepen existing sections with more examples, data, insights
- Add more FAQ questions (total 7+), comparison tables, expert blockquotes
- Maintain Super Page structure, short paragraphs, active voice, no AI clichés
- Keep existing <img> tags with real URLs intact

Return JSON: {"title":"...","content":"expanded HTML with PLACEHOLDER_IMAGE for new sections","meta_title":"max 60 chars","meta_description":"max 160 chars","excerpt":"2-3 sentences"}
Return ONLY valid JSON.`,
};

/** Generate a single image with varied style */
async function generateImage(
  altText: string,
  keyword: string,
  styleIndex: number,
  supabaseAdmin: any,
  lovableApiKey: string,
): Promise<string | null> {
  const style = IMAGE_STYLES[styleIndex % IMAGE_STYLES.length];
  const prompt = `Create an image for a blog article section about "${keyword}". 
Context: "${altText}". Style: ${style}. 16:9 aspect ratio, high quality, NO text or words.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error(`Image gen error:`, response.status);
      return null;
    }

    const data = await response.json();
    const imageDataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageDataUrl?.startsWith("data:image/")) return null;

    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1];
    const base64Data = match[2];
    const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpeg";

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `inline/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("article-images")
      .upload(fileName, bytes, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage.from("article-images").getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Image generation failed:", err);
    return null;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace PLACEHOLDER_IMAGE in content with real AI images */
async function replaceImagePlaceholders(
  content: string,
  keyword: string,
  supabaseAdmin: any,
  lovableApiKey: string,
): Promise<string> {
  const placeholderRegex = /<img[^>]*src="PLACEHOLDER_IMAGE"[^>]*alt="([^"]*)"[^>]*\/?>/gi;
  const matches: { fullMatch: string; altText: string }[] = [];

  let m;
  while ((m = placeholderRegex.exec(content)) !== null) {
    matches.push({ fullMatch: m[0], altText: m[1] || keyword });
  }

  if (matches.length === 0) return content;
  console.log(`Found ${matches.length} image placeholders to replace`);

  let result = content;
  for (let i = 0; i < matches.length; i++) {
    const { fullMatch, altText } = matches[i];
    if (i > 0) await new Promise(r => setTimeout(r, 2000));

    const imageUrl = await generateImage(altText, keyword, i, supabaseAdmin, lovableApiKey);
    if (imageUrl) {
      const newImg = fullMatch.replace('src="PLACEHOLDER_IMAGE"', `src="${imageUrl}"`);
      result = result.replace(fullMatch, newImg);
      console.log(`Replaced placeholder ${i + 1}/${matches.length}`);
    } else {
      const figureRegex = new RegExp(`<figure[^>]*>\\s*${escapeRegex(fullMatch)}\\s*</figure>`, 'i');
      if (figureRegex.test(result)) {
        result = result.replace(figureRegex, '');
      } else {
        result = result.replace(fullMatch, '');
      }
      console.warn(`Failed to generate image ${i + 1}, removed placeholder`);
    }
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { article_id, action } = await req.json();

    if (!article_id || !action) {
      return new Response(JSON.stringify({ error: "article_id and action are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["review", "rewrite", "improve", "expand"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action. Use: review, rewrite, improve, expand" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: article, error: articleError } = await supabaseUser
      .from("articles")
      .select("id, title, content, meta_title, meta_description, focus_keyword, excerpt, blog_id")
      .eq("id", article_id)
      .maybeSingle();

    if (articleError || !article) {
      return new Response(JSON.stringify({ error: "Article not found or access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = ACTION_PROMPTS[action as ActionType];
    const userPrompt = `Article to ${action}:

Title: ${article.title}
Focus Keyword: ${article.focus_keyword}
Meta Title: ${article.meta_title}
Meta Description: ${article.meta_description}

Content:
${article.content}`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 16384,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("OpenAI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`OpenAI API returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("No content returned from AI");

    let cleaned = rawContent.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let result: any;
    try {
      result = JSON.parse(cleaned);
    } catch {
      try {
        let repaired = cleaned;
        const openBraces = (repaired.match(/{/g) || []).length;
        const closeBraces = (repaired.match(/}/g) || []).length;
        const openBrackets = (repaired.match(/\[/g) || []).length;
        const closeBrackets = (repaired.match(/]/g) || []).length;

        if (!repaired.trimEnd().endsWith('"') && !repaired.trimEnd().endsWith('}') && !repaired.trimEnd().endsWith(']')) {
          repaired += '"';
        }
        for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

        result = JSON.parse(repaired);
        console.log("JSON repaired successfully");
      } catch {
        console.error("Invalid JSON (first 500):", cleaned.substring(0, 500));
        console.error("Invalid JSON (last 200):", cleaned.substring(cleaned.length - 200));
        throw new Error("AI returned invalid JSON");
      }
    }

    // For review action, just return the analysis
    if (action === "review") {
      return new Response(JSON.stringify({ action: "review", review: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save current version before updating
    const { data: versionCount } = await supabaseAdmin
      .from("article_versions")
      .select("version_number")
      .eq("article_id", article_id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (versionCount?.version_number || 0) + 1;

    await supabaseAdmin.from("article_versions").insert({
      article_id,
      title: article.title,
      content: article.content,
      version_number: nextVersion,
    });

    // Replace PLACEHOLDER_IMAGE with real AI images
    let newContent = result.content || article.content;
    if (LOVABLE_API_KEY) {
      newContent = await replaceImagePlaceholders(newContent, article.focus_keyword, supabaseAdmin, LOVABLE_API_KEY);
    } else {
      // Clean up placeholders if no API key
      newContent = newContent.replace(/<figure[^>]*>\s*<img[^>]*src="PLACEHOLDER_IMAGE"[^>]*\/?>\s*(?:<figcaption[^>]*>.*?<\/figcaption>\s*)?<\/figure>/gi, '');
      newContent = newContent.replace(/<img[^>]*src="PLACEHOLDER_IMAGE"[^>]*\/?>/gi, '');
    }

    const textOnly = newContent.replace(/<[^>]*>/g, " ");
    const wordCount = textOnly.split(/\s+/).filter(Boolean).length;

    const { error: updateError } = await supabaseAdmin
      .from("articles")
      .update({
        title: result.title || article.title,
        content: newContent,
        meta_title: result.meta_title || article.meta_title,
        meta_description: result.meta_description || article.meta_description,
        excerpt: result.excerpt || article.excerpt,
        word_count: wordCount,
        reading_time_minutes: Math.max(1, Math.ceil(wordCount / 200)),
      })
      .eq("id", article_id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update article");
    }

    return new Response(JSON.stringify({
      action,
      success: true,
      version_saved: nextVersion,
      article_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("improve-article error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
