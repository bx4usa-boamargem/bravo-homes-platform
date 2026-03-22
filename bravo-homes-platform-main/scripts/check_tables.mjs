import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tyeaqluofishcvhvpwrg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZWFxbHVvZmlzaGN2aHZwd3JnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAyNTE2NiwiZXhwIjoyMDg5NjAxMTY2fQ.lkhAq8a9plwpW_TLEwfKQgu9Olrjm46Oj2INpmLkFak';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
  const tables = ['clients', 'leads', 'projects', 'messages', 'profiles', 'tasks', 'stages'];
  console.log('Verifying tables via Supabase API...');
  
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      if (error.code === '42P01') {
        console.log(`❌ Table '${t}' does NOT exist.`);
      } else {
        console.log(`⚠️ Table '${t}': Error: ${error.message} (Code: ${error.code})`);
      }
    } else {
      console.log(`✅ Table '${t}' EXISTS.`);
    }
  }
}

check();
