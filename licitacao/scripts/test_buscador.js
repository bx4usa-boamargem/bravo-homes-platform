// scripts/test_buscador.js
// Testa o buscador PNCP e popula a tabela licitacoes_cache

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qphhyflsukcnincdwxgr.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaGh5ZmxzdWtjbmluY2R3eGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxMDQ1MSwiZXhwIjoyMDg5MDg2NDUxfQ.-AnD63jXt3FvDC4YxsJK8gDInnEfhu7X0mhdGxoN2nw';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testBuscador() {
  console.log('--- Buscador Test (PNCP API) ---');

  // 1. Formatar a data para hoje (AAAAMMDD)
  // Como estamos em 15/03/2026 no sistema:
  const dataRef = '20260315'; 
  const modalidade = 6; // Pregao Eletronico

  const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataRef}&dataFinal=${dataRef}&codigoModalidadeContratacao=${modalidade}&tamanhoPagina=10&pagina=1`;

  try {
    console.log(`Buscando: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const items = data.data || [];

    console.log(`Encontrados ${items.length} itens.`);

    if (items.length === 0) {
      console.log('Nenhuma licitacao encontrada para hoje na modalidade 6.');
      return;
    }

    const toInsert = items.map(item => {
      // Normalizar razao social
      const orgao = item.orgaoEntidade.razaoSocial
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());

      // Titulo = primeiros 200 chars do objeto
      const titulo = item.objetoCompra.substring(0, 200);

      // Data abertura com timezone
      const dataAbertura = item.dataAberturaProposta
        ? item.dataAberturaProposta + '-03:00'
        : null;

      // Link edital fallback
      const linkEdital = item.linkSistemaOrigem
        || `https://pncp.gov.br/app/editais/${item.orgaoEntidade.cnpj}/${item.anoCompra}/${item.sequencialCompra}`;

      return {
        id_licitacao_gov: item.numeroControlePNCP,
        titulo: titulo,
        objeto: item.objetoCompra,
        orgao: orgao,
        uf: item.unidadeOrgao.ufSigla,
        modalidade: item.modalidadeNome,
        data_abertura: dataAbertura,
        valor_estimado: item.valorTotalEstimado || 0,
        link_edital: linkEdital,
        data_publicacao: item.dataPublicacaoPncp
      };
    });

    console.log(`Inserindo ${toInsert.length} itens no Supabase...`);

    const { error } = await supabase
      .from('licitacoes_cache')
      .upsert(toInsert, { onConflict: 'id_licitacao_gov' });

    if (error) {
      console.error('Erro no Supabase:', error.message);
    } else {
      console.log('✅ SUCESSO: Cache populado!');
    }

  } catch (err) {
    console.error('Erro no teste do buscador:', err.message);
  }
}

testBuscador();
