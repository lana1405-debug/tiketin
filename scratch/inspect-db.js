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

async function inspect() {
  console.log("Inspecting tables...");
  
  // Try to inspect the columns of transaksi table
  const { data: transaksi, error: txError } = await supabase
    .from('transaksi')
    .select('*')
    .limit(1);
    
  if (txError) {
    console.error("Error fetching transaksi:", txError);
  } else {
    console.log("Transaksi columns:", Object.keys(transaksi[0] || {}));
  }

  // Check if there is a boost table or similar
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('*');

  if (settingsError) {
    console.error("Error fetching site_settings:", settingsError);
  } else {
    console.log("Site Settings keys:", settings.map(s => s.key));
  }
}

inspect();
