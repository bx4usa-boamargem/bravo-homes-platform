// supabase/functions/generate-super-page/index.ts
// OMNISEEN SUPER PAGE ENGINE v3.0
// Skills aplicados: seo-content-writer + content-creator + E-E-A-T framework
// Pipeline: SERP Agent → Content Writer Master → Schema Architect → Quality Gate

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── AGENT-1: SERP Intelligence (Serper.dev) ─────────────────────────────────
async function runSerpAgent(keyword: string, cidade: string, serperKey: string) {
  if (!serperKey) {
    console.warn("[AGENT-1] SERPER_API_KEY não configurado — sem dados SERP");
    return { paa: [], organic: [], relatedSearches: [], localPack: [] };
  }
  try {
    const query = cidade ? `${keyword} ${cidade}` : keyword;
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, gl: "br", hl: "pt", num: 10 }),
    });
    if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);
    const data = await res.json();
    return {
      paa: (data.peopleAlsoAsk ?? []).slice(0, 8).map((q: any) => q.question),
      organic: (data.organic ?? []).slice(0, 5).map((r: any) => ({
        title: r.title, snippet: r.snippet, domain: r.domain,
      })),
      relatedSearches: (data.relatedSearches ?? []).slice(0, 10).map((r: any) => r.query),
      localPack: (data.localResults ?? []).slice(0, 3).map((r: any) => r.title),
    };
  } catch (e) {
    console.warn("[AGENT-1] SERP fallback:", e);
    return { paa: [], organic: [], relatedSearches: [], localPack: [] };
  }
}

// ─── Google Places: E-E-A-T Local Context ────────────────────────────────────
async function fetchLocalContext(segmento: string, bairro: string, cidade: string, gmapsKey: string) {
  if (!gmapsKey || !bairro || !cidade) return { pontos: [] };
  try {
    const q = `${segmento} ${bairro} ${cidade} Brasil`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${gmapsKey}&language=pt-BR`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Places HTTP ${res.status}`);
    const data = await res.json();
    const pontos = ((data.results ?? []) as any[]).slice(0, 8).map(
      (p: any) => `${p.name}${p.vicinity ? ` (${p.vicinity})` : ""}`
    );
    return { pontos };
  } catch (e) {
    console.warn("[Places] fallback:", e);
    return { pontos: [] };
  }
}

// ─── AGENT-2: Content Writer Master ──────────────────────────────────────────
// Baseado no skill seo-content-writer + content-creator + E-E-A-T
async function runContentWriterAgent(params: {
  keyword: string;
  nicho: string;
  cidade: string;
  bairro: string;
  blogName: string;
  servicos: string;
  serpData: any;
  localPontos: string[];
  openaiKey: string;
}): Promise<any> {
  const { keyword, nicho, cidade, bairro, blogName, servicos, serpData, localPontos, openaiKey } = params;

  const paaList = (serpData.paa ?? []).length > 0
    ? (serpData.paa as string[]).map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")
    : "Sem dados PAA disponíveis";

  const competidoresBlock = (serpData.organic ?? []).length > 0
    ? `\n## TOP RESULTADOS ATUAIS NO GOOGLE (analise e supere o conteúdo deles):\n${(serpData.organic as any[]).map(
        (r: any) => `- "${r.title}" (${r.domain}): ${r.snippet}`
      ).join("\n")}\n`
    : "";

  const relatedKws = (serpData.relatedSearches ?? []).join(", ") || keyword;

  const localBlock = localPontos.length > 0
    ? `\n## PONTOS REAIS DA REGIÃO (use para E-E-A-T local — mencione ao menos 3):\n${localPontos.join(" | ")}\n`
    : "";

  // SYSTEM PROMPT — baseado nos skills seo-content-writer + content-creator
  const systemPrompt = `Você é o Content Writer Master da Omniseen. Você escreve SUPER PAGES — a fonte definitiva de um tema.

## MISSÃO
Criar a melhor página sobre este tema que existe na internet brasileira.
Uma Super Page não é um artigo — é a FONTE DEFINITIVA. Ranqueia para dezenas de keywords. Converte visitantes.

## SKILLS APLICADOS (seo-content-writer + content-creator + E-E-A-T)

### ❌ PROIBIDO ABSOLUTAMENTE:
- Começar com "Na era digital", "Nos dias atuais", "Em um mundo cada vez mais conectado"
- Escrever como carta ou e-mail ("Prezado leitor", "Caro visitante")
- Parágrafos com mais de 4 frases seguidas
- Dados sem fonte ou contexto ("pesquisas mostram que..." sem citar qual)
- Conteúdo genérico que poderia se aplicar a qualquer empresa
- FAQ com perguntas inventadas quando há PAA real fornecido
- Usar a mesma frase de abertura de qualquer concorrente listado

### ✅ OBRIGATÓRIO (Quality Gate vai verificar cada item):
1. **ANSWER BLOCK** — Primeiro parágrafo do content_markdown responde à query em 60-90 palavras com a keyword
2. **Mínimo 2.500 palavras** no content_markdown (isso é inegociável)
3. **Estrutura obrigatória**:
   - H1 único com keyword
   - Mínimo 5 H2s com âncoras (#id) que coincidem com o TOC
   - Tabela comparativa em markdown (| Coluna | Coluna |)
   - Lista numerada de passos (1. 2. 3.)
   - Blockquote com citação de especialista real do setor
   - 2 CTAs no corpo (primário e secundário)
4. **E-E-A-T obrigatório**:
   - Experience: detalhes do cotidiano real do segmento
   - Expertise: terminologia técnica correta do nicho
   - Authority: dado/estatística com fonte real (ex: "segundo o INPI 2024")
   - Trust: informações verificáveis e precisas
5. **FAQ** com as perguntas REAIS do Google (PAA) fornecidas — não invente perguntas se têm PAA
6. **Density 0.5-1.5%** da keyword principal ao longo do texto
7. **Parágrafos curtos** (máx 3-4 frases por bloco para escaneabilidade)

Retorne APENAS JSON válido. Sem markdown externo. Sem blocos de código.`;

  const userPrompt = `Crie uma Super Page completa para:

**KEYWORD PRINCIPAL:** "${keyword}"
**NICHO/SEGMENTO:** ${nicho}
**EMPRESA:** ${blogName}
**CIDADE:** ${cidade}${bairro ? `, ${bairro}` : ""}
**SERVIÇOS:** ${servicos || "—"}

## PERGUNTAS REAIS DO GOOGLE (People Also Ask) — USE NO FAQ:
${paaList}

## KEYWORDS RELACIONADAS (use naturalmente no texto):
${relatedKws}
${competidoresBlock}${localBlock}

## JSON DE RESPOSTA OBRIGATÓRIO (retorne EXATAMENTE esta estrutura):

{
  "meta": {
    "title_tag": "keyword + diferencial, max 60 chars",
    "meta_description": "150-160 chars com keyword + cidade + CTA implícito",
    "slug": "kebab-case max 6 palavras sem acento",
    "keyword_principal": "${keyword}"
  },
  "key_takeaways": [
    "insight 1 — máx 2 linhas, específico e acionável",
    "insight 2",
    "insight 3",
    "insight 4",
    "insight 5"
  ],
  "toc": [
    {"id": "o-que-e", "label": "O que é [tema]"},
    {"id": "como-funciona", "label": "Como funciona"},
    {"id": "beneficios", "label": "Principais benefícios"},
    {"id": "como-escolher", "label": "Como escolher o melhor"},
    {"id": "faq", "label": "Perguntas frequentes"}
  ],
  "content_markdown": "Markdown completo 2500+ palavras. DEVE CONTER: H1 único, min 5 H2s com âncoras, tabela | | |, lista numerada 1. 2. 3., blockquote com especialista, 2 CTAs. COMECE com Answer Block de 60-90 palavras respondendo à query. Mencione pontos locais reais se fornecidos.",
  "faq": [
    {"q": "pergunta real do PAA ou pergunta relevante?", "a": "Resposta completa 3-5 frases com keyword semântica."},
    {"q": "pergunta 2?", "a": "resposta 2"},
    {"q": "pergunta 3?", "a": "resposta 3"},
    {"q": "pergunta 4?", "a": "resposta 4"},
    {"q": "pergunta 5?", "a": "resposta 5"},
    {"q": "pergunta 6?", "a": "resposta 6"}
  ],
  "cta_primary": {"text": "texto do botão principal (direto e específico)", "anchor": "#contato"},
  "cta_secondary": {"text": "texto do CTA secundário (alternativa menos comprometida)", "anchor": "#como-funciona"},
  "autor": {
    "nome": "nome completo brasileiro plausível para o nicho",
    "bio": "mini-bio 1-2 frases com credencial específica do setor (ex: '12 anos no setor de [nicho]')",
    "data_publicacao": "2026-03-15"
  },
  "imagens": [
    {
      "posicao": "hero",
      "fal_prompt": "prompt detalhado em inglês para FLUX — cena específica do nicho, realista, alta qualidade",
      "alt": "alt text SEO com keyword, máx 125 chars",
      "caption": "legenda visível ao leitor"
    },
    {
      "posicao": "mid_article",
      "fal_prompt": "prompt realista — profissionais no contexto específico do nicho",
      "alt": "alt text com keyword semântica",
      "caption": "legenda"
    },
    {
      "posicao": "conclusion",
      "fal_prompt": "imagem de conversão — cliente satisfeito ou resultado concreto do serviço",
      "alt": "alt text",
      "caption": "legenda"
    }
  ],
  "internal_links": [
    {"texto": "texto de âncora sugerido 1", "topico": "tópico complementar para linkar internamente"},
    {"texto": "texto 2", "topico": "tópico 2"},
    {"texto": "texto 3", "topico": "tópico 3"}
  ],
  "word_count_estimate": 2700,
  "quality_checklist": {
    "tem_h1_unico": true,
    "tem_min_5_h2": true,
    "tem_toc": true,
    "tem_key_takeaways": true,
    "tem_tabela": true,
    "tem_lista_passos": true,
    "tem_citacao_especialista": true,
    "tem_faq_min_5": true,
    "tem_2_ctas": true,
    "tem_min_2500_palavras": true,
    "sem_cliches_abertura": true,
    "dados_com_fontes": true,
    "tem_answer_block": true,
    "tem_eeat_local": ${localPontos.length > 0 ? "true" : "false"}
  }
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.65,
      max_tokens: 10000,
    }),
  });

  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error("Content Writer Agent falhou: " + JSON.stringify(data.error || data));
  }

  let raw = data.choices[0].message.content.trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("[AGENT-2] JSON parse error. Preview:", raw.substring(0, 500));
    throw new Error("Content Writer Agent retornou JSON inválido");
  }
}

// ─── AGENT-3: Schema Architect ────────────────────────────────────────────────
function buildSchema(page: any, blogName: string, blogUrl: string) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.meta?.title_tag ?? "",
    description: page.meta?.meta_description ?? "",
    datePublished: page.autor?.data_publicacao ?? new Date().toISOString().split("T")[0],
    dateModified: new Date().toISOString().split("T")[0],
    author: {
      "@type": "Person",
      name: page.autor?.nome ?? "Equipe Omniseen",
      description: page.autor?.bio ?? "",
    },
    publisher: {
      "@type": "Organization",
      name: blogName,
      url: blogUrl || "https://omniseen.com.br",
    },
    inLanguage: "pt-BR",
    wordCount: page.word_count_estimate ?? 2500,
    keywords: page.meta?.keyword_principal ?? "",
    mainEntityOfPage: { "@type": "WebPage", "@id": blogUrl ? `${blogUrl}/${page.meta?.slug}` : "" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (page.faq ?? []).map((item: any) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return { article: articleSchema, faqpage: faqSchema };
}

// ─── AGENT-4: Quality Gate ────────────────────────────────────────────────────
function runQualityGate(page: any): { passed: boolean; score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;
  const checks: [boolean, string][] = [
    [!!page.meta?.title_tag, "Meta title ausente"],
    [(page.meta?.title_tag?.length ?? 0) <= 65, "Meta title acima de 65 chars"],
    [!!page.meta?.meta_description, "Meta description ausente"],
    [(page.meta?.meta_description?.length ?? 0) >= 140 && (page.meta?.meta_description?.length ?? 0) <= 165, "Meta description fora do range 140-165 chars"],
    [!!page.key_takeaways?.length, "Key Takeaways ausentes"],
    [(page.key_takeaways?.length ?? 0) >= 5, "Menos de 5 Key Takeaways"],
    [(page.toc?.length ?? 0) >= 5, "TOC com menos de 5 seções"],
    [!!page.content_markdown, "Conteúdo markdown ausente"],
    [(page.content_markdown?.length ?? 0) > 12000, "Conteúdo provavelmente abaixo de 2500 palavras (< 12000 chars)"],
    [(page.faq?.length ?? 0) >= 5, "FAQ com menos de 5 perguntas"],
    [!!page.cta_primary?.text, "CTA primário ausente"],
    [!!page.cta_secondary?.text, "CTA secundário ausente"],
    [(page.imagens?.length ?? 0) >= 2, "Menos de 2 imagens briefadas"],
    [(page.internal_links?.length ?? 0) >= 3, "Menos de 3 sugestões de links internos"],
    [!!page.autor?.nome, "Autor ausente"],
    [!!page.autor?.bio, "Bio do autor ausente"],
    [page.quality_checklist?.tem_tabela === true, "Tabela comparativa ausente"],
    [page.quality_checklist?.tem_lista_passos === true, "Lista de passos ausente"],
    [page.quality_checklist?.tem_citacao_especialista === true, "Citação de especialista ausente"],
    [page.quality_checklist?.sem_cliches_abertura === true, "Clichês de abertura detectados"],
    [page.quality_checklist?.tem_answer_block === true, "Answer Block ausente (1º parágrafo deve responder a query)"],
    [!!page.meta?.slug, "Slug ausente"],
  ];

  for (const [passed, issue] of checks) {
    if (passed) score++;
    else issues.push(issue);
  }

  return { passed: score >= 18, score, issues };
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  console.log("[generate-super-page] Request:", req.method);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurado");

    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY") ?? "";
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const { blog_id, keyword, nicho } = await req.json();
    if (!blog_id || !keyword)
      return new Response(JSON.stringify({ error: "blog_id e keyword são obrigatórios" }), { status: 400, headers: corsHeaders });

    // ── Auth ──────────────────────────────────────────────────────────────────
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try direct ownership, then tenant fallback
    let { data: blog } = await supabase.from("blogs").select("*").eq("id", blog_id).eq("user_id", user.id).maybeSingle();
    if (!blog) {
      const { data: memberBlog } = await supabase
        .from("blogs").select("*, tenant_members!inner(user_id)")
        .eq("id", blog_id).eq("tenant_members.user_id", user.id).maybeSingle();
      blog = memberBlog;
    }
    if (!blog)
      return new Response(JSON.stringify({ error: "Blog não encontrado ou acesso negado" }), { status: 403, headers: corsHeaders });

    const cidade = blog.cidade || "";
    const bairro = blog.bairro || "";
    const blogName = blog.name || "Omniseen";
    const blogUrl = blog.domain ? `https://${blog.domain}` : "";
    const blogNicho = nicho || blog.niche || blog.segmento || "geral";
    const servicos = blog.servicos_oferecidos || blog.target_audience || "";
    const segmento = blog.segmento || blog.niche || blogNicho;

    console.log(`[SuperPage] keyword="${keyword}" blog="${blogName}" cidade="${cidade}"`);

    // ── ESTÁGIO 1: SERP + Places em paralelo ─────────────────────────────────
    const [serpData, localCtx] = await Promise.all([
      runSerpAgent(keyword, cidade, SERPER_API_KEY),
      fetchLocalContext(segmento, bairro, cidade, GOOGLE_PLACES_API_KEY),
    ]);
    console.log(`[AGENT-1] ${serpData.paa.length} PAAs | ${serpData.organic.length} orgânicos | [Places] ${localCtx.pontos.length} pontos`);

    // ── ESTÁGIO 2: Content Writer Master ─────────────────────────────────────
    const page = await runContentWriterAgent({
      keyword, nicho: blogNicho, cidade, bairro, blogName, servicos,
      serpData, localPontos: localCtx.pontos, openaiKey: OPENAI_API_KEY,
    });
    console.log(`[AGENT-2] Conteúdo gerado. ~${page.word_count_estimate} palavras. Content length: ${page.content_markdown?.length ?? 0} chars`);

    // ── ESTÁGIO 3: Schema + Quality Gate ─────────────────────────────────────
    const schema = buildSchema(page, blogName, blogUrl);
    const qa = runQualityGate(page);
    console.log(`[AGENT-4] Quality Gate: ${qa.score}/22 — ${qa.passed ? "✅ APROVADO" : "⚠️ REVISAR"}`);
    if (!qa.passed) console.warn("[AGENT-4] Issues:", qa.issues.join(", "));

    // ── Salvar na tabela super_pages ──────────────────────────────────────────
    const slugBase = page.meta?.slug || keyword.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const { data: inserted, error: insertError } = await supabase
      .from("super_pages")
      .insert({
        blog_id,
        user_id: user.id,
        title: page.meta?.title_tag ?? keyword,
        slug,
        meta_title: page.meta?.title_tag ?? "",
        meta_description: page.meta?.meta_description ?? "",
        focus_keyword: keyword,
        content_markdown: page.content_markdown ?? "",
        key_takeaways: page.key_takeaways ?? [],
        toc: page.toc ?? [],
        faq: page.faq ?? [],
        cta_primary: page.cta_primary ?? {},
        cta_secondary: page.cta_secondary ?? {},
        imagens: page.imagens ?? [],
        internal_links: page.internal_links ?? [],
        autor: page.autor ?? {},
        schema_article: schema.article,
        schema_faqpage: schema.faqpage,
        quality_score: qa.score,
        quality_issues: qa.issues,
        serp_data: {
          paa: serpData.paa,
          topResult: serpData.organic[0] ?? null,
          localPack: serpData.localPack,
          relatedSearches: serpData.relatedSearches,
        },
        word_count: page.word_count_estimate ?? 2500,
        status: qa.passed ? "draft" : "needs_review",
      })
      .select("id")
      .single();

    if (insertError) throw new Error("Falha ao salvar super page: " + insertError.message);

    console.log(`[SuperPage] ✅ Salva. ID=${inserted.id} Score=${qa.score}/22 Status=${qa.passed ? "draft" : "needs_review"}`);

    return new Response(
      JSON.stringify({
        page_id: inserted.id,
        slug,
        title: page.meta?.title_tag,
        quality: { score: qa.score, max: 22, passed: qa.passed, issues: qa.issues },
        status: qa.passed ? "draft" : "needs_review",
        word_count: page.word_count_estimate,
        serp_boost: { paa: serpData.paa.length, local_points: localCtx.pontos.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[generate-super-page] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
