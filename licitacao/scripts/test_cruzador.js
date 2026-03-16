// scripts/test_cruzador.js
// Testa a logica de matching entre filtros de empresas e licitacoes em cache

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qphhyflsukcnincdwxgr.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaGh5ZmxzdWtjbmluY2R3eGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxMDQ1MSwiZXhwIjoyMDg5MDg2NDUxfQ.-AnD63jXt3FvDC4YxsJK8gDInnEfhu7X0mhdGxoN2nw';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testCruzador() {
  console.log('--- Cruzador Test (Matching Logic) ---');

  // 1. Garantir que temos uma empresa e um filtro para teste
  let { data: empresa } = await supabase.from('empresas').select('id').limit(1).single();
  
  if (!empresa) {
    console.log('Criando empresa de teste...');
    const { data: newEmpresa, error: errEmp } = await supabase.from('empresas').insert({
      supabase_user_id: 'test_user_cruzador',
      razao_social: 'Empresa Teste Licitaí',
      email: 'teste@licitai.com.br'
    }).select().single();
    if (errEmp) { console.error(errEmp); return; }
    empresa = newEmpresa;
  }

  // 2. Garantir que temos filtros para essa empresa
  const { data: existingFiltro } = await supabase.from('filtros_busca').select('id').eq('empresa_id', empresa.id).limit(1).single();
  
  if (!existingFiltro) {
    console.log('Criando filtro de teste...');
    await supabase.from('filtros_busca').insert({
      empresa_id: empresa.id,
      palavras_chave: ['limpeza', 'segurança', 'serviços', 'alvenaria', 'vigilancia', 'informatica', 'material'],
      estados: ['SP', 'RJ', 'MG', 'DF'],
      valor_minimo: 10000
    });
  }

  // 3. Buscar todos os filtros ativos
  const { data: filtros } = await supabase.from('filtros_busca').select('*, empresas(razao_social)').eq('ativo', true);

  // 4. Buscar as licitacoes de hoje (ou as 50 mais recentes)
  const { data: licitacoes } = await supabase.from('licitacoes_cache').select('*').limit(50);

  console.log(`Cruzando ${filtros.length} filtros com ${licitacoes.length} licitações...`);

  const matches = [];

  for (const filtro of filtros) {
    const keywords = (filtro.palavras_chave || []).map(k => k.toLowerCase());
    const states = filtro.estados || [];
    const minVal = filtro.valor_minimo || 0;

    for (const lic of licitacoes) {
      // Regra 1: Estado
      if (states.length > 0 && !states.includes(lic.uf)) {
        continue;
      }

      // Regra 2: Valor Minimo
      if (lic.valor_estimado > 0 && lic.valor_estimado < minVal) {
        continue;
      }

      // Regra 3: Palavras-chave
      const textToSearch = (lic.titulo + ' ' + (lic.objeto || '')).toLowerCase();
      const matchedKeywords = keywords.filter(k => textToSearch.includes(k));

      if (matchedKeywords.length > 0) {
        matches.push({
          empresa: filtro.empresas.razao_social,
          empresa_id: filtro.empresa_id,
          licitacao: lic.titulo,
          id_lic_gov: lic.id_licitacao_gov,
          keywords: matchedKeywords
        });
      }
    }
  }

  console.log('\n--- MATCHES ENCONTRADOS ---');
  if (matches.length === 0) {
    console.log('Nenhum match encontrado.');
  } else {
    matches.forEach((m, i) => {
      console.log(`${i+1}. [${m.empresa}] -> [${m.id_lic_gov}]: ${m.licitacao.substring(0, 50)}... (Termos: ${m.keywords.join(', ')})`);
    });
  }
}

testCruzador().catch(console.error);
