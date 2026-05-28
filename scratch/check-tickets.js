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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  console.log("Fetching transactions...");
  const { data: txs, error: txError } = await supabase.from('transaksi').select('*');
  console.log("Transactions:", txs, txError);

  console.log("Fetching tickets...");
  const { data: tkts, error: tktError } = await supabase.from('tiket').select('*');
  console.log("Tickets:", tkts, tktError);
}

check();
