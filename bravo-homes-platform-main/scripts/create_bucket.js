const token = 'sbp_736ecafbca1a091cb00b23c8a5a06b2accad1c24';
const ref = 'tyeaqluofishcvhvpwrg';

async function main() {
  // Create storage bucket for project files
  console.log('Creating storage bucket...');
  const res = await fetch('https://api.supabase.com/v1/projects/' + ref + '/database/query', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('project-files', 'project-files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
      ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;
    ` })
  });
  console.log('Bucket status:', res.status);
  const data = await res.text();
  console.log('Response:', data.substring(0, 300));

  // Create storage policies
  console.log('\nCreating storage policies...');
  const polRes = await fetch('https://api.supabase.com/v1/projects/' + ref + '/database/query', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `
      DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
      DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

      CREATE POLICY "Allow authenticated uploads" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'project-files');

      CREATE POLICY "Allow public reads" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'project-files');

      CREATE POLICY "Allow authenticated deletes" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'project-files');
    ` })
  });
  console.log('Policies status:', polRes.status);
  const polData = await polRes.text();
  console.log('Response:', polData.substring(0, 300));
}

main();
