// ── AGENTE 2: Outline Builder ─────────────────────────────────────────────────
// Responsável por: Estrutura semântica H2/H3, word targets por seção, FAQ do PAA real
// FIX CRÍTICO: este agente SEMPRE retorna "title" no JSON (bug ausente no generate-article-pro)

import type { SerpResult, BlogContext } from "./serp-agent.ts";

export interface OutlineSection {
  heading: string;
  goal: string;
  keywords: string[];
  estimatedWordCount: number;
  keyPoints: string[];
  isFaq: boolean;
}

export interface OutlineResult {
  title: string;           // ← FIX: sempre presente
  metaDescription: string;
  targetWordCount: number;
  sections: OutlineSection[];
  faqQuestions: string[];
  competitiveGaps: string[];
  lsiKeywordsToUse: string[];
}

const LANG_MAP: Record<string, string> = {
  "pt-br": "Português Brasileiro",
  "pt": "Português Brasileiro",
  "en": "English",
  "es": "Español",
};

export async function runOutlineAgent(
  keyword: string,
  serpResult: SerpResult,
  blogContext: BlogContext,
  openAiKey: string,
  language: string,
  tone: string,
  targetWords: number,
  includeFaq: boolean,
): Promise<OutlineResult> {
  console.log(`[OutlineAgent] Construindo outline para "${keyword}" — ${targetWords} palavras`);

  const lang = LANG_MAP[language] ?? "Português Brasileiro";

  // Contexto SERP comprimido (top 5 para não explodir o contexto)
  const serpSummary = serpResult.organicResults
    .slice(0, 5)
    .map((r, i) => `${i + 1}. "${r.title}" — ${r.snippet}`)
    .join("\n");

  const paaList = serpResult.peopleAlsoAsk.slice(0, 8).join("\n- ");
  const lsiList = serpResult.lsiKeywords.slice(0, 12).join(", ");
  const relatedList = serpResult.relatedSearches.slice(0, 6).join(", ");
  const localPoints = serpResult.localContext.pontos_referencia.slice(0, 4).join(", ");

  // Calcular número ideal de seções baseado no target
  const sectionCount = targetWords <= 1200 ? 5 : targetWords <= 2200 ? 7 : 10;
  const wordsPerSection = Math.floor(targetWords / sectionCount);

  const prompt = `Você é um Estrategista SEO Sênior e Arquiteto de Conteúdo. Analise os dados de SERP abaixo e construa o outline ideal para um artigo que vai SUPERAR os top resultados do Google.

KEYWORD PRINCIPAL: "${keyword}"
IDIOMA: ${lang}
TOM: ${tone}
META DE PALAVRAS: ${targetWords} palavras totais
NÚMERO DE SEÇÕES: ${sectionCount} seções (excluindo FAQ)

═══ DADOS DE SERP (top ${serpResult.organicResults.length} resultados Google) ═══
${serpSummary || "Dados SERP não disponíveis — construa outline com base no segmento."}

═══ PEOPLE ALSO ASK (perguntas REAIS do Google) ═══
- ${paaList || "Nenhuma pergunta encontrada."}

═══ LSI KEYWORDS (termos semânticamente relacionados) ═══
${lsiList || "Nenhuma extraída."}

═══ BUSCAS RELACIONADAS ═══
${relatedList || "Nenhuma."}

═══ CONTEXTO DO NEGÓCIO ═══
- Empresa: ${blogContext.nome}
- Segmento: ${blogContext.segmento}
- Localização: ${blogContext.bairro}${blogContext.cidade ? `, ${blogContext.cidade}` : ""}
- Serviços: ${blogContext.servicos || "—"}
${localPoints ? `- Pontos locais reais (E-E-A-T): ${localPoints}` : ""}

═══ INSTRUÇÕES ═══
1. O TÍTULO (H1) DEVE conter a keyword principal e ter máx. 65 caracteres
2. Cada seção H2 deve cobrir um ângulo DIFERENTE — sem redundância
3. Identifique os "competitive gaps" — o que os concorrentes NÃO cobrem mas o leitor quer
4. Distribua as palavras de forma realista (introdução menor, seções técnicas maiores)
${includeFaq ? `5. INCLUA uma seção FAQ usando as perguntas reais do PAA acima` : "5. NÃO inclua seção FAQ"}
6. RESPONDA APENAS com JSON válido, sem texto fora do JSON, sem markdown

═══ SCHEMA JSON OBRIGATÓRIO ═══
{
  "title": "Título H1 com keyword — máx. 65 chars",
  "metaDescription": "Meta description 150-160 chars com keyword, localidade e CTA implícito",
  "targetWordCount": ${targetWords},
  "sections": [
    {
      "heading": "Texto exato do H2 (sem numeração)",
      "goal": "objetivo SEO desta seção em 1 frase",
      "keywords": ["keyword principal", "variação LSI 1", "variação LSI 2"],
      "estimatedWordCount": ${wordsPerSection},
      "keyPoints": ["ponto chave 1 para abordar", "ponto chave 2", "ponto chave 3"],
      "isFaq": false
    }
  ],
  "faqQuestions": ["pergunta real do PAA 1", "pergunta real do PAA 2"],
  "competitiveGaps": ["tópico não coberto pelos concorrentes que o leitor busca"],
  "lsiKeywordsToUse": ["variação semântica 1", "variação semântica 2"]
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[OutlineAgent] OpenAI HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("[OutlineAgent] Sem conteúdo retornado pela IA");

  let outline: OutlineResult;
  try {
    outline = JSON.parse(raw);
  } catch {
    throw new Error("[OutlineAgent] JSON inválido retornado pela IA");
  }

  // Validação de segurança: garantir que title existe (o fix do bug)
  if (!outline.title || typeof outline.title !== "string") {
    outline.title = `${keyword.charAt(0).toUpperCase()}${keyword.slice(1)}: Guia Completo`;
    console.warn("[OutlineAgent] ⚠️ title ausente — usando fallback");
  }

  // Garantir que sections existe e tem keyPoints
  if (!Array.isArray(outline.sections) || outline.sections.length === 0) {
    throw new Error("[OutlineAgent] Outline sem seções válidas");
  }

  outline.sections = outline.sections.map((s) => ({
    heading: s.heading ?? "Seção",
    goal: s.goal ?? "",
    keywords: Array.isArray(s.keywords) ? s.keywords : [],
    estimatedWordCount: s.estimatedWordCount ?? wordsPerSection,
    keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints : [],
    isFaq: s.isFaq ?? false,
  }));

  outline.faqQuestions = Array.isArray(outline.faqQuestions) ? outline.faqQuestions : [];
  outline.competitiveGaps = Array.isArray(outline.competitiveGaps) ? outline.competitiveGaps : [];
  outline.lsiKeywordsToUse = Array.isArray(outline.lsiKeywordsToUse) ? outline.lsiKeywordsToUse : [];

  console.log(
    `[OutlineAgent] ✅ "${outline.title}" | ${outline.sections.length} seções | ${outline.faqQuestions.length} FAQs`,
  );

  return outline;
}
