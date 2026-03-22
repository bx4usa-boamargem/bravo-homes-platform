import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:BravoBione2026%40@db.tyeaqluofishcvhvpwrg.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'projects';
    `);
    console.log('--- RLS POLICIES FOR PROJECTS ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}
run();
