import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tyeaqluofishcvhvpwrg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZWFxbHVvZmlzaGN2aHZwd3JnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAyNTE2NiwiZXhwIjoyMDg5NjAxMTY2fQ.lkhAq8a9plwpW_TLEwfKQgu9Olrjm46Oj2INpmLkFak';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log('Deletando dados das tabelas públicas...');
  
  // Limpando tabelas na ordem correta para evitar erros de Foreign Key.
  const tables = ['documents', 'daily_logs', 'stages', 'messages', 'leads', 'projects', 'clients', 'profiles'];
  
  for (const t of tables) {
    const { error } = await supabaseAdmin.from(t).delete().not('id', 'is', null);
    if (error && error.code !== '42P01') {
      console.log(`Erro ao deletar ${t}: ${error.message}`);
    } else {
      console.log(`Tabela ${t} limpa.`);
    }
  }

  console.log('\nLimpando usuários (Auth)...');
  const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (users) {
    for (const u of users) {
      await supabaseAdmin.auth.admin.deleteUser(u.id);
    }
    console.log(`Deletados ${users.length} usuários antigos.`);
  }

  console.log('\nCriando conta: Wyllams...');
  const res1 = await supabaseAdmin.auth.admin.createUser({
    email: 'wyllamsbione@gmail.com',
    password: 'Jonny2020@',
    email_confirm: true,
    user_metadata: { role: 'admin', full_name: 'Wyllams Bione' }
  });
  if (res1.error) console.log('Erro Wyllams:', res1.error.message);
  else console.log('Wyllams criado!');

  console.log('\nCriando conta: Bione...');
  const res2 = await supabaseAdmin.auth.admin.createUser({
    email: 'bionicaosilva@gmail.com',
    password: 'Bione2020',
    email_confirm: true,
    user_metadata: { role: 'admin', full_name: 'Bione Silva' }
  });
  if (res2.error) console.log('Erro Bione:', res2.error.message);
  else console.log('Bione criado!');

  console.log('\nFeito!');
}

run();
