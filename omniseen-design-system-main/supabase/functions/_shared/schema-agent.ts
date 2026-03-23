// ── AGENTE 5: Schema & Metadata Generator ────────────────────────────────────
// Responsável por: Meta tags finais, JSON-LD (Article + FAQPage), SEO score, tags, categoria
// Roda APÓS o conteúdo completo ser gerado — tem acesso ao artigo inteiro

import type { OutlineResult } from "./outline-agent.ts";
import type { BlogContext } from "./serp-agent.ts";

export interface SchemaResult {
  meta_title: string;
  meta_description: string;
  slug: string;
  excerpt: string;
  tags: string[];
  category: string;
  schema_jsonld: string;
  faq: Array<{ question: string; answer: string }> | null;
  seo_score: number;
}

export async function runSchemaAgent(
  fullContent: string,
  keyword: string,
  blogContext: BlogContext,
  outline: OutlineResult,
  openAiKey: string,
  includeFaq: boolean,
): Promise<SchemaResult> {
  console.log("[SchemaAgent] Gerando metadados e JSON-LD...");

  // Usar apenas os primeiros 1500 chars do conteúdo (suficiente para meta geração)
  const contentSample = fullContent
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1500);

  const faqSection = includeFaq && outline.faqQuestions.length > 0
    ? `\nPerguntas FAQ identificadas no artigo:\n${outline.faqQuestions.slice(0, 8).map((q) => `- ${q}`).join("\n")}`
    : "";

  const prompt = `Você é um especialista em SEO Técnico. Com base nos dados abaixo, gere os metadados e Schema JSON-LD para este artigo.

KEYWORD: "${keyword}"
TÍTULO DO ARTIGO: "${outline.title}"
EMPRESA: ${blogContext.nome}
CIDADE: ${blogContext.cidade || "Brasil"}
SEGMENTO: ${blogContext.segmento}
${faqSection}

PRÉVIA DO CONTEÚDO (primeiros 1500 chars):
${contentSample}

Retorne APENAS JSON válido com EXATAMENTE estes campos:
{
  "meta_title": "máx 60 chars — keyword no início, marca no final",
  "meta_description": "150-160 chars — keyword + benefit + CTA implícito",
  "slug": "url-amigavel-sem-acentos-com-keyword-principal",
  "excerpt": "2-3 frases resumindo o artigo para preview em cards",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "categoria principal do nicho",
  "schema_jsonld": "{JSON-LD como string com escaping correto: Article schema + FAQPage se aplicável}",
  "faq": [{"question": "pergunta", "answer": "resposta 2-4 frases"}],
  "seo_score": 85
}

REGRAS:
- slug: apenas letras minúsculas, números e hífens — sem acentos, sem espaços
- schema_jsonld: JSON-LD completo como STRING escapada para o campo application/ld+json
  Inclua Article schema (headline, description, author, publisher, datePublished)
  ${includeFaq && outline.faqQuestions.length > 0 ? "Inclua FAQPage schema com as perguntas identificadas" : "Não inclua FAQPage schema"}
- seo_score: integer 0-100 baseado em: keyword no título (20pts), meta completa (15pts), FAQ presente (15pts), content depth (25pts), local SEO (15pts), schema presente (10pts)
- faq: ${includeFaq ? "array com as respostas completas para cada pergunta do PAA" : "null"}

IMPORTANTE: Retorne APENAS o JSON. Sem markdown, sem blocos de código.`;

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
      temperature: 0.2,
      max_tokens: 2500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[SchemaAgent] OpenAI HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("[SchemaAgent] Sem conteúdo retornado pela IA");

  let result: SchemaResult;
  try {
    result = JSON.parse(raw);
  } catch {
    throw new Error("[SchemaAgent] JSON inválido retornado pela IA");
  }

  // Sanitizar slug
  result.slug = (result.slug ?? keyword)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

  // Garantir arrays
  result.tags = Array.isArray(result.tags) ? result.tags.slice(0, 8) : [];
  result.category = result.category ?? blogContext.segmento;
  result.seo_score = typeof result.seo_score === "number"
    ? Math.min(100, Math.max(0, result.seo_score))
    : 75;
  result.faq = includeFaq && Array.isArray(result.faq) ? result.faq : null;

  console.log(
    `[SchemaAgent] ✅ SEO Score: ${result.seo_score} | ${result.tags.length} tags | FAQ: ${result.faq?.length ?? 0} itens`,
  );

  return result;
}
