// scripts/verify_supabase.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qphhyflsukcnincdwxgr.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaGh5ZmxzdWtjbmluY2R3eGdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxMDQ1MSwiZXhwIjoyMDg5MDg2NDUxfQ.-AnD63jXt3FvDC4YxsJK8gDInnEfhu7X0mhdGxoN2nw';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verify() {
  const { data, error } = await supabase
    .from('analise_mercado')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Erro:', error.message);
  } else {
    console.log('Dados encontrados:', JSON.stringify(data, null, 2));
  }
}

verify();
