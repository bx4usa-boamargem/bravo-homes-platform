import fs from 'fs';

const token = 'sbp_736ecafbca1a091cb00b23c8a5a06b2accad1c24';
const ref = 'tyeaqluofishcvhvpwrg';

// First, list projects to verify token works
console.log('=== Testing token by listing projects ===');
const projRes = await fetch('https://api.supabase.com/v1/projects', {
  headers: { 'Authorization': 'Bearer ' + token }
});
const projData = await projRes.json();
console.log('Projects response status:', projRes.status);
if (Array.isArray(projData)) {
  projData.forEach(p => console.log(`  - ${p.name} (${p.id}) region: ${p.region}`));
} else {
  console.log('Response:', JSON.stringify(projData).substring(0, 300));
}

// Try the database query endpoint
console.log('\n=== Trying database query endpoint ===');
const sqlRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" })
});
const sqlData = await sqlRes.text();
console.log('DB Query status:', sqlRes.status);
console.log('DB Query response:', sqlData.substring(0, 500));
