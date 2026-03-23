// ── AGENTE 1: SERP Intelligence ───────────────────────────────────────────────
// Responsável por: Serper.dev (top organic, PAA, related), Google Places (E-E-A-T local)
// Extrai: LSI keywords, intenção de busca, entidades NLP, perguntas frequentes

export interface OrganicResult {
  title: string;
  snippet: string;
  link: string;
}

export interface LocalContext {
  competitors: Array<{ name: string; rating: number; address: string }>;
  pontos_referencia: string[];
}

export interface SerpResult {
  organicResults: OrganicResult[];
  peopleAlsoAsk: string[];
  relatedSearches: string[];
  lsiKeywords: string[];
  localContext: LocalContext;
}

export interface BlogContext {
  nome: string;
  segmento: string;
  bairro: string;
  cidade: string;
  servicos: string;
  imageStyle: string;
}

// ── Serper.dev: SERP Intelligence ────────────────────────────────────────────
async function fetchSerpData(
  keyword: string,
  cidade: string,
  serperKey: string,
): Promise<Omit<SerpResult, "lsiKeywords" | "localContext">> {
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
      organicResults: (data.organic ?? []).slice(0, 8).map((r: any) => ({
        title: r.title ?? "",
        snippet: r.snippet ?? "",
        link: r.link ?? "",
      })),
      peopleAlsoAsk: (data.peopleAlsoAsk ?? []).slice(0, 10).map((q: any) => q.question ?? ""),
      relatedSearches: (data.relatedSearches ?? []).slice(0, 8).map((s: any) => s.query ?? ""),
    };
  } catch (e) {
    console.warn("[SerpAgent] Serper.dev fallback:", e);
    return { organicResults: [], peopleAlsoAsk: [], relatedSearches: [] };
  }
}

// ── Google Places: E-E-A-T local ─────────────────────────────────────────────
async function fetchLocalContext(
  segmento: string,
  bairro: string,
  cidade: string,
  googleApiKey: string,
): Promise<LocalContext> {
  try {
    const query = `${segmento} ${bairro} ${cidade} Brasil`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}&language=pt-BR`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Places HTTP ${res.status}`);
    const data = await res.json();
    const places = ((data.results ?? []) as any[]).slice(0, 8);
    return {
      competitors: places.map((p: any) => ({
        name: p.name ?? "",
        rating: p.rating ?? 0,
        address: p.formatted_address ?? "",
      })),
      pontos_referencia: places.map(
        (p: any) => `${p.name}${p.vicinity ? ` (${p.vicinity})` : ""}`,
      ),
    };
  } catch (e) {
    console.warn("[SerpAgent] Google Places fallback:", e);
    return { competitors: [], pontos_referencia: [] };
  }
}

// ── Extração de LSI Keywords dos snippets orgânicos ──────────────────────────
// Técnica simples mas eficaz: NLP estatístico sobre os snippets dos top 8
function extractLsiKeywords(
  keyword: string,
  organicResults: OrganicResult[],
  relatedSearches: string[],
): string[] {
  const stopWords = new Set([
    "de", "da", "do", "das", "dos", "e", "em", "para", "com", "por",
    "que", "uma", "um", "se", "ou", "como", "mais", "são", "foi",
    "the", "a", "an", "is", "in", "of", "to", "and", "for", "on",
    "com", "que", "não", "sua", "seu", "ela", "ele", "nos", "nas",
    "ao", "à", "pelo", "pela", "isso", "este", "esta", "esse", "essa",
  ]);

  const keywordLower = keyword.toLowerCase();
  const wordFreq: Record<string, number> = {};

  // Extrair palavras de snippets e títulos orgânicos
  const corpus = [
    ...organicResults.map((r) => `${r.title} ${r.snippet}`),
    ...relatedSearches,
  ].join(" ");

  const words = corpus
    .toLowerCase()
    .replace(/[^\wÀ-ÿ\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w) && !keywordLower.includes(w));

  for (const word of words) {
    wordFreq[word] = (wordFreq[word] ?? 0) + 1;
  }

  // Top 15 LSI keywords por frequência
  return Object.entries(wordFreq)
    .filter(([, freq]) => freq >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([word]) => word);
}

// ── Entry point do agente ─────────────────────────────────────────────────────
export async function runSerpAgent(
  keyword: string,
  blogContext: BlogContext,
  serperKey: string,
  googlePlacesKey: string,
): Promise<SerpResult> {
  console.log(`[SerpAgent] Iniciando para keyword: "${keyword}"`);

  const [serpData, localContext] = await Promise.all([
    serperKey
      ? fetchSerpData(keyword, blogContext.cidade, serperKey)
      : Promise.resolve({ organicResults: [], peopleAlsoAsk: [], relatedSearches: [] }),
    googlePlacesKey && blogContext.bairro && blogContext.cidade && blogContext.segmento
      ? fetchLocalContext(blogContext.segmento, blogContext.bairro, blogContext.cidade, googlePlacesKey)
      : Promise.resolve({ competitors: [], pontos_referencia: [] }),
  ]);

  const lsiKeywords = extractLsiKeywords(
    keyword,
    serpData.organicResults,
    serpData.relatedSearches,
  );

  console.log(
    `[SerpAgent] ✅ ${serpData.organicResults.length} organic | ${serpData.peopleAlsoAsk.length} PAA | ${lsiKeywords.length} LSI | ${localContext.pontos_referencia.length} pontos locais`,
  );

  return {
    ...serpData,
    lsiKeywords,
    localContext,
  };
}
