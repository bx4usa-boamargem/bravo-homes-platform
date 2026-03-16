// scripts/maestro_full_pipeline.js
// Orquestrador do Licitaí (Fase 3 MVP)
// Integra: Buscador -> Cruzador -> Resumidor (Template) -> Log

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qphhyflsukcnincdwxgr.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaGh5ZmxzdWtjbmluY2R3eGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxMDQ1MSwiZXhwIjoyMDg5MDg2NDUxfQ.-AnD63jXt3FvDC4YxsJK8gDInnEfhu7X0mhdGxoN2nw';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Template de Linguagem (Skill: linguagem-licitacao)
function resumirLicitacao(item) {
  const dataFormatada = new Date(item.data_abertura).toLocaleDateString('pt-BR');
  const valorFormatado = item.valor_estimado > 0 
    ? `R$ ${item.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : 'A consultar no edital';

  return `🔔 *Nova Licitação para você!*

*${item.titulo.toUpperCase()}*

🏛 Órgão: ${item.orgao}
📍 Estado: ${item.uf} 
💰 Valor estimado: ${valorFormatado}
📅 Prazo: ${dataFormatada}
📋 Modalidade: ${item.modalidade}

Resumo: ${item.objeto.substring(0, 150)}...

🔗 Ver edital completo: ${item.link_edital}

─────────────────
Licitaí · Monitoramento automático`;
}

async function runPipeline() {
  console.log('=== MAESTRO LICITAÍ: INICIANDO PIPELINE DIÁRIO ===');

  // 1. BUSCADOR (Simulado chamando a API PNCP)
  console.log('1. Buscando novas licitações (PNCP)...');
  const dIni = '20260310';
  const dFim = '20260316';
  const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dIni}&dataFinal=${dFim}&codigoModalidadeContratacao=6&tamanhoPagina=50&pagina=1`;
  const res = await fetch(url);
  const apiData = await res.json();
  const rawItems = apiData.data || [];
  console.log(`   - Encontrados ${rawItems.length} itens no PNCP.`);

  // 2. SALVAR NO CACHE
  const cacheItems = rawItems.map(item => ({
    id_licitacao_gov: item.numeroControlePNCP,
    titulo: item.objetoCompra.substring(0, 200),
    objeto: item.objetoCompra,
    orgao: item.orgaoEntidade.razaoSocial,
    uf: item.unidadeOrgao.ufSigla,
    modalidade: item.modalidadeNome,
    data_abertura: item.dataAberturaProposta ? item.dataAberturaProposta + '-03:00' : null,
    valor_estimado: item.valorTotalEstimado || 0,
    link_edital: item.linkSistemaOrigem || `https://pncp.gov.br/app/editais/${item.orgaoEntidade.cnpj}/${item.anoCompra}/${item.sequencialCompra}`,
    data_publicacao: item.dataPublicacaoPncp
  }));

  await supabase.from('licitacoes_cache').upsert(cacheItems, { onConflict: 'id_licitacao_gov' });

  // 3. CRUZADOR (Matching)
  console.log('2. Cruzando filtros das empresas...');
  const { data: filtros } = await supabase.from('filtros_busca').select('*, empresas(razao_social)').eq('ativo', true);
  
  if (!filtros || filtros.length === 0) {
    console.log('   - Nenhum filtro ativo encontrado.');
    return;
  }

  for (const filtro of filtros) {
    const matches = cacheItems.filter(lic => {
      const keywords = (filtro.palavras_chave || []).map(k => k.toLowerCase());
      const states = filtro.estados || [];
      const minVal = filtro.valor_minimo || 0;

      const inState = states.length === 0 || states.includes(lic.uf);
      const aboveMin = lic.valor_estimado === 0 || lic.valor_estimado >= minVal;
      const textToSearch = (lic.titulo + ' ' + lic.objeto).toLowerCase();
      const hasKeywords = keywords.some(k => textToSearch.includes(k));

      return inState && aboveMin && hasKeywords;
    });

    console.log(`   - Empresa [${filtro.empresas.razao_social}]: ${matches.length} matches.`);

    // 4. RESUMIDOR E LOGS
    for (const match of matches) {
      // Verificar DEDUP
      const { data: existing } = await supabase.from('logs_disparo')
        .select('id')
        .eq('empresa_id', filtro.empresa_id)
        .eq('id_licitacao_gov', match.id_licitacao_gov)
        .limit(1)
        .single();

      if (existing) continue;

      const mensagem = resumirLicitacao(match);
      console.log(`\n--- MENSAGEM PARA ${filtro.empresas.razao_social} ---`);
      console.log(mensagem);

      // Simular envio e salvar log
      // No futuro aqui chamamos a Evolution API
      const { error: logErr } = await supabase.from('logs_disparo').insert({
        empresa_id: filtro.empresa_id,
        id_licitacao_gov: match.id_licitacao_gov,
        numero_whatsapp: '5511999999999', // Mock
        status_envio: 'pulado' // 'pulado' porque nao temos a Evolution API ativa
      });

      if (logErr) console.error('Erro ao logar:', logErr);
    }
  }

  console.log('\n=== PIPELINE CONCLUÍDO ===');
}

runPipeline().catch(console.error);
