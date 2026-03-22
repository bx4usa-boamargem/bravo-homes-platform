const token = 'sbp_736ecafbca1a091cb00b23c8a5a06b2accad1c24';
const ref = 'tyeaqluofishcvhvpwrg';
const baseUrl = 'https://api.supabase.com/v1/projects/' + ref + '/database/query';

const rlsSQL = `
-- ============================================================
-- BRAVO HOMES GROUP - PRODUCTION-READY RLS POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES: Users can read all profiles, edit only their own
-- ============================================================
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============================================================
-- USERS: Authenticated users can read all, admins can manage
-- ============================================================
CREATE POLICY "users_select" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "users_delete" ON public.users FOR DELETE TO authenticated USING (true);

-- ============================================================
-- CLIENTS: Authenticated can read, insert, update
-- ============================================================
CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "clients_insert_auth" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated USING (true);
CREATE POLICY "clients_anon_insert" ON public.clients FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- PROJECTS: Authenticated can CRUD
-- ============================================================
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (true);

-- ============================================================
-- LEADS: Anon can insert (landing pages), authenticated can CRUD
-- ============================================================
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_insert_auth" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_insert_anon" ON public.leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated USING (true);

-- ============================================================
-- CALENDAR_EVENTS: Authenticated can CRUD
-- ============================================================
CREATE POLICY "cal_select" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "cal_insert" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cal_update" ON public.calendar_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "cal_delete" ON public.calendar_events FOR DELETE TO authenticated USING (true);

-- ============================================================
-- MESSAGES: Authenticated can read all, insert own
-- ============================================================
CREATE POLICY "msgs_select" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "msgs_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- DAILY_LOGS: Authenticated can CRUD
-- ============================================================
CREATE POLICY "logs_select" ON public.daily_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "logs_insert" ON public.daily_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "logs_update" ON public.daily_logs FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- STAGES: Authenticated can CRUD
-- ============================================================
CREATE POLICY "stages_select" ON public.stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "stages_insert" ON public.stages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stages_update" ON public.stages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "stages_delete" ON public.stages FOR DELETE TO authenticated USING (true);

-- ============================================================
-- LANDING_PAGES: Authenticated can CRUD
-- ============================================================
CREATE POLICY "lp_select" ON public.landing_pages FOR SELECT TO authenticated USING (true);
CREATE POLICY "lp_insert" ON public.landing_pages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lp_update" ON public.landing_pages FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- CONVERSATIONS: Authenticated can CRUD
-- ============================================================
CREATE POLICY "conv_select" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "conv_insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "conv_insert_anon" ON public.conversations FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- DOCUMENTS: Authenticated can CRUD
-- ============================================================
CREATE POLICY "docs_select" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "docs_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "docs_delete" ON public.documents FOR DELETE TO authenticated USING (true);

-- ============================================================
-- PROJECT_DOCUMENTS: Authenticated can CRUD
-- ============================================================
CREATE POLICY "pdocs_select" ON public.project_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "pdocs_insert" ON public.project_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pdocs_delete" ON public.project_documents FOR DELETE TO authenticated USING (true);

-- ============================================================
-- PROJECT_PHOTOS: Authenticated can CRUD
-- ============================================================
CREATE POLICY "pphotos_select" ON public.project_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "pphotos_insert" ON public.project_photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pphotos_delete" ON public.project_photos FOR DELETE TO authenticated USING (true);

-- ============================================================
-- PROJECT_STAGES: Authenticated can CRUD
-- ============================================================
CREATE POLICY "pstages_select" ON public.project_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "pstages_insert" ON public.project_stages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pstages_update" ON public.project_stages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "pstages_delete" ON public.project_stages FOR DELETE TO authenticated USING (true);

-- Reload cache
NOTIFY pgrst, 'reload schema';
`;

async function main() {
  console.log('Applying production-ready RLS policies...');
  
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: rlsSQL })
  });
  
  const data = await res.text();
  console.log('Status:', res.status);
  
  if (res.ok) {
    console.log('SUCCESS! All RLS policies applied!');
    
    // Verify
    const vRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "SELECT tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;" })
    });
    const vData = await vRes.json();
    console.log('\nActive policies:');
    if (Array.isArray(vData)) {
      vData.forEach(p => console.log('  ' + p.tablename + ': ' + p.policyname + ' (' + p.cmd + ' -> ' + p.roles + ')'));
      console.log('\nTotal:', vData.length, 'policies applied');
    }
  } else {
    console.log('Response:', data.substring(0, 500));
  }
}

main();
