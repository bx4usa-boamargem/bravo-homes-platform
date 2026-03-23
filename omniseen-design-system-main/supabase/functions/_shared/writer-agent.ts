// ── AGENTE 3: Writer (Section-by-Section) ────────────────────────────────────
// Responsável por: Redigir UMA seção por vez (chunking)
// Padrão: Skeleton-of-Thought — cada seção tem prompt independente + contexto mínimo do outline
// Isso evita: degradação de contexto, redundância, alucinação por janela cheia

import type { OutlineResult, OutlineSection } from "./outline-agent.ts";

const LANG_MAP: Record<string, string> = {
  "pt-br": "Português Brasileiro",
  "pt": "Português Brasileiro",
  "en": "English",
  "es": "Español",
};

export async function runWriterAgent(
  section: OutlineSection,
  keyword: string,
  outline: OutlineResult,
  language: string,
  tone: string,
  isFirstSection: boolean,
  includeImages: boolean,
  openAiKey: string,
): Promise<string> {
  const lang = LANG_MAP[language] ?? "Português Brasileiro";

  // Contexto mínimo do artigo (apenas os headings, não o conteúdo)
  // Isso mantém coerência sem explodir tokens
  const articleStructure = outline.sections
    .map((s, i) => `  ${i + 1}. H2: ${s.heading}`)
    .join("\n");

  const lsiContext = [
    ...section.keywords,
    ...outline.lsiKeywordsToUse.slice(0, 5),
  ]
    .filter((k, i, arr) => arr.indexOf(k) === i)
    .join(", ");

  const imagePlaceholderInstruction = includeImages
    ? `\n\nIMAGEM: No início desta seção, inclua EXATAMENTE este marcador de imagem (uma única vez):
<figure><img src="PLACEHOLDER_IMAGE" alt="[alt-text descritivo e semântico sobre ${section.heading} em ${lang}]" loading="lazy" style="width:100%;border-radius:8px;margin-bottom:1.5rem;" /></figure>
O alt-text DEVE descrever o conteúdo visual relacionado ao tópico "${section.heading}" — NUNCA genérico.`
    : "";

  const faqInstructions = section.isFaq
    ? `
ATENÇÃO: Esta é a seção FAQ. Use H3 (###) para cada pergunta e texto normal para a resposta.
Perguntas para responder (extraídas do Google PAA):
${outline.faqQuestions.map((q) => `- ${q}`).join("\n")}
Se houver menos de 5 perguntas, complemente com perguntas relevantes sobre "${keyword}".
Cada resposta: 3-5 frases, direta, factual.`
    : "";

  const firstSectionInstructions = isFirstSection
    ? `
PRIMEIRA SEÇÃO — inclua obrigatoriamente:
1. ANSWER BLOCK (50-80 palavras): Parágrafo que responde DIRETAMENTE a query "${keyword}" — será o featured snippet do Google
2. Hook de introdução (2-3 frases) explicando o que o leitor vai aprender
NÃO comece com "Na era digital", "Nos dias atuais", "Em um mundo cada vez mais" ou clichês similares.`
    : "";

  const prompt = `Você é um Redator SEO Expert especializado em ${lang}. Escreva APENAS a seção indicada abaixo — não escreva outras seções.

═══ CONTEXTO DO ARTIGO ═══
Keyword principal: "${keyword}"
Título do artigo: "${outline.title}"
Tom: ${tone}
Idioma: ${lang}

Estrutura completa do artigo (contexto de onde esta seção se encaixa):
${articleStructure}

═══ SEÇÃO A ESCREVER AGORA ═══
Heading: "${section.heading}"
Objetivo SEO: ${section.goal}
Meta de palavras: ${section.estimatedWordCount} palavras
Keywords a usar naturalmente: ${lsiContext}
Pontos-chave a cobrir:
${section.keyPoints.map((p) => `• ${p}`).join("\n")}
${firstSectionInstructions}
${faqInstructions}
${imagePlaceholderInstruction}

═══ REGRAS ABSOLUTAS DE FORMATAÇÃO ═══
✅ HTML apenas: <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <table>, <tr>, <td>, <th>, <figure>, <img>
✅ Parágrafos curtos (máx. 3-4 frases por bloco)
✅ Use <strong> para termos técnicos importantes (não mais de 2-3 por parágrafo)
✅ Listas (<ul>/<ol>) para passos, vantagens, características
✅ <blockquote> para insights de especialistas ou dados relevantes
✅ NÃO inclua a tag <h2> do heading — ela será adicionada pelo sistema
✅ NÃO repita o título do artigo ou da seção dentro do conteúdo
✅ NÃO escreva "Nesta seção vamos ver..." ou frases meta-textuais
✅ PROIBIDO: clichês de IA ("No cenário atual", "É crucial", "Vale ressaltar que")

Escreva APENAS o HTML do corpo da seção. Sem markdown, sem texto fora do HTML.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
      max_tokens: 2500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `[WriterAgent] OpenAI HTTP ${res.status} para seção "${section.heading}": ${errText.slice(0, 150)}`,
    );
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error(`[WriterAgent] Seção "${section.heading}" retornou vazio`);
    return `<p><!-- Erro ao gerar seção: ${section.heading} --></p>`;
  }

  // Limpar possível markdown residual
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "");
  }

  const wordCount = cleaned.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  console.log(`[WriterAgent] ✅ "${section.heading}" — ${wordCount} palavras`);

  return cleaned;
}
