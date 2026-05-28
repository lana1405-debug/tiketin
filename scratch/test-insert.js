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

async function testInsert() {
  console.log("Testing insert with category_id = null...");
  // Let's get a random event_id
  const { data: events } = await supabase.from('events').select('id').limit(1);
  if (!events || events.length === 0) {
    console.error("No events found");
    return;
  }
  const eventId = events[0].id;
  
  // Let's get a random profile id
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  if (!profiles || profiles.length === 0) {
    console.error("No profiles found");
    return;
  }
  const userId = profiles[0].id;

  const testOrder = {
    user_id: userId,
    order_id: `TEST-BOOST-${Date.now()}`,
    total_qty: 1,
    total_bayar: 1000000,
    status_pembayaran: 'pending',
    event_id: eventId,
    category_id: null // Testing if this is allowed
  };

  const { data, error } = await supabase
    .from('transaksi')
    .insert([testOrder])
    .select();

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Successfully inserted transaction:", data);
    // clean up
    const { error: delError } = await supabase
      .from('transaksi')
      .delete()
      .eq('id', data[0].id);
    console.log("Deleted test transaction status:", delError ? "Error: " + delError.message : "Success");
  }
}

testInsert();
