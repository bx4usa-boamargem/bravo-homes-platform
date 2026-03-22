import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:BravoBione2026%40@db.tyeaqluofishcvhvpwrg.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase Postgres!');
    
    // Also ensuring the columns exist just to be absolutely sure
    await client.query(`
      ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contract_value NUMERIC;
      ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline DATE;
      ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS service_type TEXT;
      ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
    `);
    console.log('Columns verified!');

    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('PostgREST schema cache reloaded successfully!');
    
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}
run();
