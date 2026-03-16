// scripts/test_inteligencia.js
// Testa a lógica de Inteligência de Mercado (Fase 3B)
// Integrado com OpenAI (GPT-4o) p/ Briefing de Transparência Histórica

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Carregar .env.local manualmente para scripts
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY   = process.env.OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });

// Helper para similaridade
function calculateSimilarity(text, keywords) {
  const lowerText = (text || '').toLowerCase();
  let count = 0;
  keywords.forEach(k => {
    if (lowerText.includes(k.toLowerCase())) count++;
  });
  return count;
}

function formatDatePNCP(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

async function generateBriefing(target, stats) {
  console.log('--- Gerando Briefing de Transparência (OpenAI GPT-4o) ---');
  
  const promptPath = path.resolve(__dirname, '../prompts/briefing_mercado.md');
  const systemPrompt = fs.readFileSync(promptPath, 'utf8');

  const userContent = `
DADOS DA LICITAÇÃO ATUAL:
- Título: ${target.titulo}
- Órgão: ${target.orgao}
- UF: ${target.uf}
- Valor Estimado: R$ ${target.valor_estimado.toLocaleString('pt-BR')}

PANORAMA HISTÓRICO (Últimos 12 meses):
- Itens Similares Localizados e Homologados: ${stats.licitacoes_analisadas}
- Desconto Médio dos Vencedores: ${stats.vencedor_medio_pct}%
- Maior Desconto (Lance Agressivo): ${stats.lance_minimo_pct}%
- Menor Desconto (Lance Conservador): ${stats.lance_maximo_pct}%
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error('Erro ao chamar OpenAI:', err.message);
    return `Transparência de Mercado: Em ${stats.licitacoes_analisadas} itens similares homologados no passado, a média de desconto dos vencedores foi de ${stats.vencedor_medio_pct}%.`;
  }
}

async function runAnalysis(targetLicId) {
  console.log(`--- Iniciando Análise com OpenAI para: ${targetLicId} ---`);

  const { data: target, error: errT } = await supabase
    .from('licitacoes_cache')
    .select('*')
    .eq('id_licitacao_gov', targetLicId)
    .single();

  if (errT || !target) {
    console.error('Erro ao buscar alvo:', errT?.message);
    return;
  }

  try {
    const someMonthsAgo = new Date();
    someMonthsAgo.setMonth(someMonthsAgo.getMonth() - 12);
    const dIni = formatDatePNCP(someMonthsAgo);
    const dFim = formatDatePNCP(new Date());
    
    let allLics = [];
    for (const mod of [5, 6]) {
      const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dIni}&dataFinal=${dFim}&codigoModalidadeContratacao=${mod}&uf=${target.uf}&pagina=1&tamanhoPagina=50`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        allLics = allLics.concat(json.data || []);
      }
    }

    const keywords = ['arbitragem', 'campeonato', 'futsal', 'futebol', 'arbitro', 'society', 'esporte'];
    const rankedLics = allLics.map(l => ({
      ...l,
      similarity: calculateSimilarity(l.objetoCompra, keywords)
    }))
    .filter(l => l.similarity >= 1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

    let allDiscounts = [];
    let itemsCount = 0;

    for (const l of rankedLics) {
      const { cnpj } = l.orgaoEntidade;
      const { anoCompra, sequencialCompra } = l;
      const urlItens = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/compras/${anoCompra}/${sequencialCompra}/itens`;
      
      const resI = await fetch(urlItens);
      if (!resI.ok) continue;
      const items = await resI.json() || [];

      for (const item of items) {
        const desc = (item.descricao || '').toLowerCase();
        if (keywords.some(k => desc.includes(k)) && item.temResultado && item.situacaoCompraItem === 2) {
          const urlR = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/compras/${anoCompra}/${sequencialCompra}/itens/${item.numeroItem}/resultados`;
          const resR = await fetch(urlR);
          if (!resR.ok) continue;
          const results = await resR.json() || [];
          if (results.length > 0) {
            const win = results[0].valorUnitarioHomologado;
            const ref = item.valorUnitarioEstimado;
            if (ref > 0 && win > 0) {
              const disc = ((ref - win) / ref) * 100;
              if (disc >= 0 && disc < 90) {
                allDiscounts.push(disc);
                itemsCount++;
              }
            }
          }
        }
      }
    }

    if (allDiscounts.length === 0) {
      console.warn('Dados históricos insuficientes.');
      return;
    }

    const media = allDiscounts.reduce((a, b) => a + b, 0) / allDiscounts.length;
    allDiscounts.sort((a,b)=>a-b);

    const stats = {
        licitacoes_analisadas: itemsCount,
        vencedor_medio_pct: media.toFixed(2),
        lance_minimo_pct: Math.max(...allDiscounts).toFixed(2),
        lance_maximo_pct: Math.min(...allDiscounts).toFixed(2),
        valor_referencia: target.valor_estimado,
        valor_sugerido_min: 0, 
        valor_sugerido_max: 0
    };

    // BRIEFING COM OPENAI
    const briefing = await generateBriefing(target, stats);
    console.log('\n--- BRIEFING OPENAI (GPT-4o) ---\n', briefing, '\n');

    const { data: empresa } = await supabase.from('empresas').select('id').limit(1).single();
    await supabase.from('analise_mercado').upsert({
      empresa_id: empresa.id,
      id_licitacao_gov: targetLicId,
      ...stats,
      resumo_texto: briefing
    }, { onConflict: 'empresa_id, id_licitacao_gov' });

    console.log('✅ Inteligência de Mercado (OpenAI) salva com sucesso!');

  } catch (err) {
    console.error('Falha:', err.message);
  }
}

runAnalysis('46189718000179-1-000054/2026');
