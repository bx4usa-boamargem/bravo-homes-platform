import pg from 'pg';
const { Client } = pg;

// Try multiple connection formats for Supabase
const connectionStrings = [
  // Pooler connection (new Supabase projects)
  'postgresql://postgres.tyeaqluofishcvhvpwrg:BravoBione2026%40@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  // Pooler transaction mode
  'postgresql://postgres.tyeaqluofishcvhvpwrg:BravoBione2026%40@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  // Direct connection (old format)
  'postgresql://postgres:BravoBione2026%40@db.tyeaqluofishcvhvpwrg.supabase.co:5432/postgres',
  // Alternative pooler regions
  'postgresql://postgres.tyeaqluofishcvhvpwrg:BravoBione2026%40@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.tyeaqluofishcvhvpwrg:BravoBione2026%40@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
];

async function tryConnection(connStr, index) {
  const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 5000 });
  try {
    console.log(`[${index+1}/${connectionStrings.length}] Trying: ${connStr.split('@')[1]}...`);
    await client.connect();
    console.log('SUCCESS! Connected!');
    
    // Run the rebuild
    const sql = `
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND table_schema = 'public' ORDER BY ordinal_position;
    `;
    const res = await client.query(sql);
    console.log('Current projects columns:');
    console.table(res.rows);
    
    await client.end();
    return true;
  } catch (err) {
    console.log(`  FAILED: ${err.message.substring(0, 80)}`);
    try { await client.end(); } catch(e) {}
    return false;
  }
}

async function main() {
  for (let i = 0; i < connectionStrings.length; i++) {
    const ok = await tryConnection(connectionStrings[i], i);
    if (ok) return;
  }
  console.log('\\nAll connection attempts failed.');
  
  // Try Management API as fallback
  console.log('\\nTrying Supabase Management API...');
  const token = 'sbp_736ecafbca1a091cb00b23c8a5a06b2accad1c24';
  const endpoints = [
    'https://api.supabase.com/v1/projects/tyeaqluofishcvhvpwrg/database/query',
    'https://api.supabase.com/v1/projects/tyeaqluofishcvhvpwrg/sql',
    'https://api.supabase.com/v1/projects/tyeaqluofishcvhvpwrg/db/query',
  ];
  
  for (const ep of endpoints) {
    try {
      console.log(`Trying: ${ep}`);
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: "SELECT 1 as test;" })
      });
      const data = await res.text();
      console.log(`  Status: ${res.status}, Response: ${data.substring(0, 200)}`);
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }
}

main();
