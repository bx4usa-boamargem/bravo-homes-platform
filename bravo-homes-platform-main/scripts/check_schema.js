const token = 'sbp_736ecafbca1a091cb00b23c8a5a06b2accad1c24';
const ref = 'tyeaqluofishcvhvpwrg';
async function main() {
  const queries = [
    // Fix: upsert needs both INSERT and UPDATE WITH CHECK
    "DROP POLICY IF EXISTS \"profiles_update\" ON public.profiles;",
    "CREATE POLICY \"profiles_update\" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);",
    // Also add a broader insert policy as fallback
    "DROP POLICY IF EXISTS \"profiles_insert\" ON public.profiles;", 
    "CREATE POLICY \"profiles_insert\" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');",
    // Also check storage upload policies
    "DROP POLICY IF EXISTS \"Allow authenticated uploads\" ON storage.objects;",
    "CREATE POLICY \"Allow authenticated uploads\" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');",
    // Also allow updates on storage (for upsert/overwrite)
    "DROP POLICY IF EXISTS \"Allow authenticated updates\" ON storage.objects;",
    "CREATE POLICY \"Allow authenticated updates\" ON storage.objects FOR UPDATE USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');",
    "NOTIFY pgrst, 'reload schema';"
  ];
  for (const q of queries) {
    console.log('Running:', q.substring(0, 75));
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    });
    const data = await res.json();
    if (data.length > 0) console.log('  Result:', JSON.stringify(data));
  }
  console.log('Done!');
}
main();
