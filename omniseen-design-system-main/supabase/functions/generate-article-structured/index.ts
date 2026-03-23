import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Google Places: fetch rich local context for E-E-A-T ──────────────────────
async function fetchLocalContext(
  segmento: string,
  bairro: string,
  cidade: string,
  googleApiKey: string
): Promise<{
  pontos_referencia: string[];
  tipos_locais: string;
  publico_local: string;
}> {
  try {
    const query = `${segmento} ${bairro} ${cidade} Brasil`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}&language=pt-BR`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Places HTTP ${res.status}`);

    const placesData = await res.json();
    const places = ((placesData.results ?? []) as any[]).slice(0, 10);

    const pontos_referencia: string[] = places.map(
      (p: any) => `${p.name}${p.vicinity ? ` (${p.vicinity})` : ""}`
    );

    const allTypes: string[] = places.flatMap((p: any) => (p.types ?? []) as string[]);
    const typeCount: Record<string, number> = {};
    for (const t of allTypes) typeCount[t] = (typeCount[t] ?? 0) + 1;
    const topTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([t]) => t.replace(/_/g, " "))
      .join(", ");

    return {
      pontos_referencia,
      tipos_locais: topTypes || "área urbana mista",
      publico_local: `Moradores, trabalhadores e frequentadores do ${bairro}, ${cidade}`,
    };
  } catch (e) {
    console.warn("Google Places fallback (non-blocking):", e);
    return {
      pontos_referencia: [],
      tipos_locais: "área urbana",
      publico_local: `Público de ${bairro}, ${cidade}`,
    };
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  console.log("[generate-article-structured] Request received:", req.method, req.url);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("[generate-article-structured] Missing authorization header");
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const {
      blog_id, keyword, language, size, tone,
      include_faq, web_research, include_images,
    } = body;

    console.log("[generate-article-structured] Params:", { blog_id, keyword, size, language });

    if (!blog_id || !keyword) {
      return new Response(JSON.stringify({ error: "blog_id and keyword are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Security: verify JWT + blog ownership ────────────────────────────────
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      console.warn("[generate-article-structured] Auth failed:", userErr?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[generate-article-structured] User authenticated:", user.id);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try direct ownership first, then tenant membership fallback
    let { data: blog } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", blog_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!blog) {
      // Fallback: check tenant membership
      const { data: memberBlog } = await supabase
        .from("blogs")
        .select("*, tenant_members!inner(user_id)")
        .eq("id", blog_id)
        .eq("tenant_members.user_id", user.id)
        .maybeSingle();
      blog = memberBlog;
    }

    if (!blog) {
      console.warn("[generate-article-structured] Blog not found for user:", user.id, "blog_id:", blog_id);
      return new Response(JSON.stringify({ error: "Blog not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[generate-article-structured] Blog found:", blog.name);

    // ── Fetch Google Places local context for E-E-A-T ─────────────────────────
    const segmento = blog.segmento || blog.niche || "";
    const bairro = blog.bairro || "";
    const cidade = blog.cidade || "";
    const hasLocalData = bairro && cidade;

    let localContext = {
      pontos_referencia: [] as string[],
      tipos_locais: "área urbana",
      publico_local: cidade ? `Público de ${cidade}` : "público geral",
    };

    if (GOOGLE_PLACES_API_KEY && hasLocalData && segmento) {
      localContext = await fetchLocalContext(segmento, bairro, cidade, GOOGLE_PLACES_API_KEY);
    }

    // ── Build prompts ─────────────────────────────────────────────────────────
    const sizeMap: Record<string, string> = {
      short: "approximately 800 words",
      medium: "approximately 1500 words",
      long: "approximately 2500 words",
    };
    const articleLength = sizeMap[size] || sizeMap["medium"];

    const languageMap: Record<string, string> = {
      "pt-br": "Brazilian Portuguese",
      en: "English",
      es: "Spanish",
    };
    const lang = languageMap[language] || "Brazilian Portuguese";

    // ── Subconta context block ────────────────────────────────────────────────
    const subcontaBlock = (blog.segmento || blog.servicos_oferecidos || hasLocalData)
      ? `
## Dados da empresa (use para personalizar o artigo e demonstrar E-E-A-T local)
- Nome: ${blog.name}
- Segmento: ${segmento || blog.niche || "negócios"}
- Endereço: ${blog.endereco ? `${blog.endereco}, ` : ""}${bairro}${cidade ? `, ${cidade}` : ""}${blog.cep ? ` — CEP ${blog.cep}` : ""}
- Serviços oferecidos: ${blog.servicos_oferecidos || blog.target_audience || "—"}
- Público-alvo: ${localContext.publico_local}
`
      : `
## Blog
- Nome: ${blog.name}
- Nicho: ${blog.niche || "geral"}
- Público-alvo: ${blog.target_audience || "geral"}
`;

    const localContextBlock = localContext.pontos_referencia.length > 0
      ? `
## Contexto local real capturado via Google Maps/Places
- Pontos de referência próximos à empresa: ${localContext.pontos_referencia.slice(0, 8).join("; ")}
- Perfil da região: ${localContext.tipos_locais}
USE estes pontos concretos no artigo para demonstrar First-Hand Experience (pilar E do E-E-A-T).
`
      : "";

    // ── SEO Writing Skill framework ────────────────────────────────────────────
    const seoSkillSystem = `Você é um redator SEO sênior especialista em conteúdo que ranqueia no Google.
Domine e aplique o seguinte framework de excelência em SEO Writing:

## FRAMEWORK DE CRIAÇÃO (SEO Content Writer Skill)

### INTRODUÇÃO (50-100 palavras):
- Hook poderoso que prende o leitor imediatamente
- Mencione a palavra-chave principal de forma natural no 1º parágrafo
- Se o artigo tiver foco local, mencione o bairro/cidade logo na introdução
- Defina claramente o valor que o leitor vai obter

### CORPO DO ARTIGO (H2 e H3 claros):
- Cobertura abrangente e progressiva do tema
- Densidade de keyword: 0.5-1.5% ao longo do texto
- Variações semânticas da keyword principal (LSI keywords)
- Parágrafos curtos (máximo 3 frases) para escaneabilidade
- Listas com bullet points sempre que listar vantagens, passos ou características
- Dados, exemplos e casos concretos quando possível

### E-E-A-T (OBRIGATÓRIO):
- **Experience:** Detalhes concretos do cotidiano do segmento
- **Expertise:** Domínio técnico com termos do setor
- **Authoritativeness:** Referências a padrões do setor
- **Trustworthiness:** Transparência e precisão nos dados

### CONCLUSÃO:
- Resuma os pontos mais importantes (2-3 frases)
- CTA claro e direto
- Reforce o diferencial da empresa no contexto local

### PARÂMETROS DE QUALIDADE:
- Keyword foco: no título, no 1º parágrafo, em pelo menos 1 H2
- Nível de leitura: acessível mas profissional
- Tom: próximo, confiante, especialista local

Sempre responda com JSON válido conforme o schema solicitado. Sem markdown, sem blocos de código.`;

    const userPrompt = `Escreva um artigo SEO completo em ${lang}, com ${articleLength}, sobre: "${keyword}"
${subcontaBlock}${localContextBlock}
Tom: ${tone || "professional"}
${web_research ? "Inclua dados, estatísticas e informações relevantes quando possível." : ""}
${include_faq ? "Inclua uma seção FAQ ao final com 5-7 perguntas e respostas sobre o tema." : ""}

${localContext.pontos_referencia.length > 0 ? `INSTRUÇÕES PARA E-E-A-T LOCAL:
1. Mencione ao menos 2 pontos de referência reais da região (${localContext.pontos_referencia.slice(0, 3).join(", ")})
2. Aborde necessidades específicas de quem vive ou trabalha em ${bairro || cidade}
3. Deixe claro como ${blog.name} serve a comunidade local
` : ""}

O JSON de resposta deve ter EXATAMENTE estes campos:
{
  "title": "string — título SEO com keyword, máx 65 chars",
  "meta_title": "string — máx 60 chars",
  "meta_description": "string — 150-160 chars com keyword e localidade se aplicável",
  "excerpt": "string — 2-3 frases resumindo o artigo",
  "content": "string — artigo completo em HTML (use h2, h3, p, ul, ol, strong)",
  "slug": "string — URL amigável",
  "tags": ["string", "..."],
  "category": "string"${include_faq ? `,
  "faq": [{"question": "string", "answer": "string"}]` : ""}
}

IMPORTANTE: Responda APENAS com o JSON. Sem markdown, sem blocos de código.`;

    console.log("[generate-article-structured] Calling OpenAI...");

    const openAiUrl = "https://api.openai.com/v1/chat/completions";
    const aiResponse = await fetch(openAiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: seoSkillSystem },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[generate-article-structured] OpenAI API error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`OpenAI API returned ${aiResponse.status}: ${errText.slice(0, 200)}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("No content returned from AI");

    console.log("[generate-article-structured] OpenAI response received, parsing...");

    let cleaned = rawContent.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let article: any;
    try {
      article = JSON.parse(cleaned);
    } catch {
      console.error("[generate-article-structured] Failed to parse AI response:", cleaned.substring(0, 500));
      throw new Error("AI returned invalid JSON");
    }

    // ── Post-process ──────────────────────────────────────────────────────────
    const textContent = (article.content || "").replace(/<[^>]*>/g, " ");
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const baseSlug =
      article.slug ||
      keyword.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    let featuredImageUrl: string | null = null;
    if (include_images) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const imagePrompt = `Create a professional blog cover image for "${article.title || keyword}". Modern, editorial style, no text overlays, no watermarks, 16:9 aspect ratio.`;
          const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: imagePrompt }],
              modalities: ["image", "text"],
            }),
          });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            const dataUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (dataUrl?.startsWith("data:image/")) {
              const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
              if (match) {
                const mimeType = match[1];
                const ext = mimeType === "image/png" ? "png" : "jpeg";
                const binaryStr = atob(match[2]);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
                const fileName = `covers/cover-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
                const { createClient: cc } = await import("https://esm.sh/@supabase/supabase-js@2");
                const admin = cc(supabaseUrl, serviceKey);
                const { error: upErr } = await admin.storage.from("article-images").upload(fileName, bytes, { contentType: mimeType, upsert: false });
                if (!upErr) {
                  featuredImageUrl = admin.storage.from("article-images").getPublicUrl(fileName).data.publicUrl;
                }
              }
            }
          }
        } catch (e) {
          console.warn("Image generation failed, continuing without image:", e);
        }
      }
      if (!featuredImageUrl) {
        const imagePrompt = `${article.title || keyword} professional high quality modern photography`;
        featuredImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1200&height=630&nologo=true`;
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from("articles")
      .insert({
        blog_id,
        title: article.title || keyword,
        slug,
        content: article.content || "",
        excerpt: article.excerpt || "",
        meta_title: article.meta_title || article.title || keyword,
        meta_description: article.meta_description || article.excerpt || "",
        focus_keyword: keyword,
        tags: article.tags || [],
        category: article.category || null,
        faq: article.faq || null,
        word_count: wordCount,
        reading_time_minutes: readingTime,
        seo_score: 75,
        featured_image_url: featuredImageUrl,
        status: "draft",
        author: blog.name || "",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[generate-article-structured] Insert error:", insertError);
      throw new Error("Failed to save article: " + insertError.message);
    }

    console.log("[generate-article-structured] Article saved:", inserted.id);

    return new Response(JSON.stringify({ article_id: inserted.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[generate-article-structured] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
