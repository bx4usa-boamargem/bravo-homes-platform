const token = 'sbp_736ecafbca1a091cb00b23c8a5a06b2accad1c24';
const ref = 'tyeaqluofishcvhvpwrg';
const baseUrl = 'https://api.supabase.com/v1/projects/' + ref + '/database/query';

const rebuildSQL = [
  "DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;",
  "DROP TABLE IF EXISTS public.project_photos CASCADE;",
  "DROP TABLE IF EXISTS public.project_documents CASCADE;",
  "DROP TABLE IF EXISTS public.project_stages CASCADE;",
  "DROP TABLE IF EXISTS public.documents CASCADE;",
  "DROP TABLE IF EXISTS public.daily_logs CASCADE;",
  "DROP TABLE IF EXISTS public.stages CASCADE;",
  "DROP TABLE IF EXISTS public.messages CASCADE;",
  "DROP TABLE IF EXISTS public.calendar_events CASCADE;",
  "DROP TABLE IF EXISTS public.transactions CASCADE;",
  "DROP TABLE IF EXISTS public.projects CASCADE;",
  "DROP TABLE IF EXISTS public.leads CASCADE;",
  "DROP TABLE IF EXISTS public.landing_pages CASCADE;",
  "DROP TABLE IF EXISTS public.conversations CASCADE;",
  "DROP TABLE IF EXISTS public.clients CASCADE;",
  "DROP TABLE IF EXISTS public.profiles CASCADE;",
  "DROP TABLE IF EXISTS public.users CASCADE;",

  `CREATE TABLE public.profiles (id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY, role TEXT NOT NULL DEFAULT 'cliente', full_name TEXT, avatar_url TEXT, phone TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.users (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, city TEXT, specialty TEXT, role TEXT DEFAULT 'partner', avatar_url TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.clients (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, city TEXT, state TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.projects (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, service_type TEXT, status TEXT DEFAULT 'active', progress INTEGER DEFAULT 0, contract_value NUMERIC DEFAULT 0, deadline DATE, client_id UUID, partner_id UUID, address TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.leads (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE, name TEXT, email TEXT, phone TEXT, service_type TEXT, city TEXT, source TEXT DEFAULT 'website', status TEXT DEFAULT 'new', urgency TEXT DEFAULT 'warm', notes TEXT, assigned_to UUID, updated_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.calendar_events (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT NOT NULL, event_date DATE NOT NULL, start_time TIME, lead_id UUID, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.messages (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, sender_id UUID, receiver_id UUID, content TEXT NOT NULL, is_ai BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.daily_logs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, partner_id UUID, log_text TEXT NOT NULL, log_date DATE NOT NULL DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.stages (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, name TEXT NOT NULL, status TEXT DEFAULT 'pending', order_index INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.landing_pages (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, city TEXT, status TEXT DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.conversations (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, lead_id UUID, messages JSONB DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.documents (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, uploaded_by UUID, file_url TEXT NOT NULL, file_name TEXT NOT NULL, file_type TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.project_documents (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, file_url TEXT, file_name TEXT, file_type TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.project_photos (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, photo_url TEXT, caption TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE TABLE public.project_stages (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, name TEXT NOT NULL, status TEXT DEFAULT 'pending', order_index INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());`,

  `CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.profiles (id, full_name, role) VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Novo Usuario'), COALESCE(new.raw_user_meta_data->>'role', 'cliente')); RETURN new; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`,

  `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`,

  "ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.calendar_events DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.daily_logs DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.stages DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.landing_pages DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.project_documents DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.project_photos DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE public.project_stages DISABLE ROW LEVEL SECURITY;",
  "NOTIFY pgrst, 'reload schema';"
];

const fullSQL = rebuildSQL.join('\n');

async function main() {
  console.log('Executing FULL database rebuild via Management API...');
  console.log('SQL length:', fullSQL.length, 'characters');
  
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 
      'Authorization': 'Bearer ' + token, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ query: fullSQL })
  });
  
  const data = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', data.substring(0, 500));
  
  if (res.ok) {
    console.log('\n=== REBUILD COMPLETE! Verifying tables... ===');
    
    const vRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" })
    });
    const vData = await vRes.json();
    console.log('\nTables:');
    if (Array.isArray(vData)) vData.forEach(t => console.log('  ✓', t.table_name));

    console.log('\n=== Verifying projects columns... ===');
    const cRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND table_schema = 'public' ORDER BY ordinal_position;" })
    });
    const cData = await cRes.json();
    console.log('\nProjects columns:');
    if (Array.isArray(cData)) cData.forEach(c => console.log('  ✓', c.column_name, '(' + c.data_type + ')'));
  } else {
    console.log('\nREBUILD FAILED!');
  }
}

main();
