const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = [
  'event_qa',
  'qa',
  'ulasan_event',
  'reviews',
  'wishlist',
  'transaksi',
  'event_questions',
  'ticket_categories',
  'profiles',
  'vouchers',
  'events',
  'withdrawals',
  'tiket',
  'complaints',
  'complaint_messages',
  'notifications',
  'articles',
  'site_settings'
];

async function inspectAll() {
  console.log("Inspecting all tables...");
  const schemas = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        // If there's an error, let's print it. It might be due to RLS, which is common in Supabase for Anon role.
        console.log(`Table: ${table} - Error: ${error.message}`);
        schemas[table] = { error: error.message };
      } else {
        const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
        console.log(`Table: ${table} - Success. Columns (from 1st row):`, columns);
        schemas[table] = { columns, hasData: data && data.length > 0 };
      }
    } catch (e) {
      console.log(`Table: ${table} - Exception: ${e.message}`);
      schemas[table] = { exception: e.message };
    }
  }

  // Let's write the schemas to a json file
  fs.writeFileSync('scratch/table_fields.json', JSON.stringify(schemas, null, 2));
  console.log("Saved results to scratch/table_fields.json");
}

inspectAll();
