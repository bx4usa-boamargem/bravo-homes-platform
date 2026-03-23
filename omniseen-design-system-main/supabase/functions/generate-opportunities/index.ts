import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Google Places: fetch real local context ───────────────────────────────────
async function fetchLocalContext(
  segmento: string,
  bairro: string,
  cidade: string,
  googleApiKey: string
): Promise<{ pontos_referencia: string[]; tipos_locais: string; publico_local: string }> {
  try {
    const query = `${segmento} ${bairro} ${cidade} Brasil`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}&language=pt-BR`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Places HTTP ${res.status}`);

    const data = await res.json();
    const places = (data.results ?? []).slice(0, 10) as any[];

    const pontos_referencia: string[] = places.map(
      (p: any) => `${p.name}${p.vicinity ? ` (${p.vicinity})` : ""}`
    );

    // Characterize the neighborhood from place types
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
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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

    const { blog_id } = await req.json();
    if (!blog_id) {
      return new Response(JSON.stringify({ error: "blog_id is required" }), {
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: blog } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", blog_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!blog) {
      return new Response(JSON.stringify({ error: "Blog not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch real local context via Google Places ────────────────────────────
    const segmento = blog.segmento || blog.niche || "negócios locais";
    const bairro = blog.bairro || "";
    const cidade = blog.cidade || "";

    let localContext = {
      pontos_referencia: [] as string[],
      tipos_locais: "área urbana",
      publico_local: cidade ? `Público de ${cidade}` : "público geral",
    };

    if (GOOGLE_PLACES_API_KEY && bairro && cidade) {
      localContext = await fetchLocalContext(segmento, bairro, cidade, GOOGLE_PLACES_API_KEY);
    }

    // ── Avoid duplicate keywords ──────────────────────────────────────────────
    const { data: existingArticles } = await supabase
      .from("articles")
      .select("focus_keyword, title")
      .eq("blog_id", blog_id)
      .limit(50);
    const existingKeywords = (existingArticles ?? []).map((a) => a.focus_keyword).filter(Boolean).join(", ");

    const { data: existingOpps } = await supabase
      .from("article_opportunities")
      .select("primary_keyword")
      .eq("blog_id", blog_id)
      .limit(100);
    const existingOppKeywords = (existingOpps ?? []).map((o) => o.primary_keyword).join(", ");

    // ── Build hyper-localized prompt ──────────────────────────────────────────
    const hasSubconta = bairro && cidade && blog.servicos_oferecidos;

    const contextBlock = hasSubconta
      ? `
## Dados da empresa
- Nome: ${blog.name}
- Segmento: ${segmento}
- Endereço: ${blog.endereco || "—"}, ${bairro}, ${cidade}${blog.cep ? ` — CEP ${blog.cep}` : ""}
- Serviços oferecidos: ${blog.servicos_oferecidos}

## Contexto local real (via Google Maps/Places)
- Pontos de referência próximos: ${localContext.pontos_referencia.slice(0, 8).join("; ") || "região central da cidade"}
- Perfil do bairro: ${localContext.tipos_locais}
- Público: ${localContext.publico_local}
`
      : `
## Dados do blog
- Nome: ${blog.name}
- Nicho: ${blog.niche || "geral"}
- Público-alvo: ${blog.target_audience || "público geral"}
- Idioma: ${blog.language || "pt-BR"}
`;

    const localNote = hasSubconta
      ? `
IMPORTANTE: Como a empresa está em ${bairro}, ${cidade}, priorize oportunidades com intenção LOCAL.
Pelo menos 3 das 8 oportunidades DEVEM conter "${bairro}" ou "${cidade}" no título e na palavra-chave primária (ex: "advogado em ${bairro}", "consultoria ${cidade}", "serviços de ${segmento.split("/")[0].trim().toLowerCase()} ${bairro}").
Os pontos de referência locais (${localContext.pontos_referencia.slice(0, 3).join(", ") || "pontos locais"}) podem ser citados para aumentar relevância local.`
      : "";

    const prompt = `Você é um estrategista de SEO especialista em conteúdo local para pequenas e médias empresas brasileiras.
Analise os dados abaixo e sugira 8 oportunidades de artigos com alto potencial de ranqueamento no Google.
${contextBlock}
Palavras-chave já cobertas (evite duplicar): ${existingKeywords || "nenhuma"}
Oportunidades já sugeridas (evite duplicar): ${existingOppKeywords || "nenhuma"}
${localNote}

Para cada oportunidade, forneça:
- suggested_title: título otimizado para SEO (em Português BR, inclua a localidade quando relevante)
- primary_keyword: palavra-chave principal (de preferência com intenção local quando aplicável)
- secondary_keywords: 3-5 palavras-chave relacionadas (array de strings)
- intent: "informational", "commercial", "transactional" ou "local"
- recommended_type: "article" ou "landing_page"
- relevance_score: 0-100 (relevância para o negócio)
- difficulty_estimate: 0-100 (dificuldade SEO)

Responda APENAS com um JSON array válido. Sem markdown, sem explicação.`;

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
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 4096,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("OpenAI API error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`OpenAI API returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("No content returned from OpenAI");

    let cleaned = rawContent.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\\s*```$/, "");
    }

    let parsedContent: any;
    try {
      parsedContent = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse OpenAI response:", cleaned.substring(0, 500));
      throw new Error("OpenAI returned invalid JSON");
    }
    
    // Sometimes OpenAI might return the array nested under a key when we force json_object without specifying a schema
    let opportunities: any[] = [];
    if (Array.isArray(parsedContent)) {
      opportunities = parsedContent;
    } else if (parsedContent && typeof parsedContent === 'object') {
      // Find the first value that is an array
      const keyWithArray = Object.keys(parsedContent).find(k => Array.isArray(parsedContent[k]));
      if (keyWithArray) {
        opportunities = parsedContent[keyWithArray];
      }
    }

    if (!Array.isArray(opportunities)) throw new Error("Expected array of opportunities");

    const validIntents = ["informational", "commercial", "local", "transactional"];
    const validTypes = ["article", "landing_page"];

    const rows = opportunities.map((opp: any) => ({
      blog_id,
      suggested_title: opp.suggested_title || "Sem título",
      primary_keyword: opp.primary_keyword || "",
      secondary_keywords: opp.secondary_keywords || [],
      intent: validIntents.includes(opp.intent) ? opp.intent : "informational",
      recommended_type: validTypes.includes(opp.recommended_type) ? opp.recommended_type : "article",
      relevance_score: Math.min(100, Math.max(0, opp.relevance_score || 50)),
      difficulty_estimate: Math.min(100, Math.max(0, opp.difficulty_estimate || 50)),
      status: "pending",
    }));

    const { error: insertError } = await supabase.from("article_opportunities").insert(rows);
    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save opportunities: " + insertError.message);
    }

    return new Response(JSON.stringify({ count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-opportunities error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
