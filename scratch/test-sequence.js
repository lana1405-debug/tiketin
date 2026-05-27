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

async function test() {
  const userId = 'ef6ae025-7100-414a-a7a9-75f60f9ffbfe'; // ikman maulana
  
  // Set initial points to 55 and role to customer
  await supabase.from('profiles').update({ points: 55, role: 'customer' }).eq('id', userId);

  console.log("Initial state reset completed.");

  // Get current state
  const { data: pInit } = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log("Initial points:", pInit.points, "Initial role:", pInit.role);

  // Run the sequence from the quiz page
  console.log("Running sequence...");
  
  const { data: r1, error: e1 } = await supabase
    .from("profiles")
    .update({ role: "eo" })
    .eq("id", userId)
    .select();

  console.log("Step 1 (update role to eo) error:", e1, "updated rows:", r1?.length);
  if (r1 && r1.length > 0) {
    console.log("Role in returned data:", r1[0].role);
  }

  const { data: r2, error: e2 } = await supabase
    .from("profiles")
    .update({ points: 57, role: "customer" })
    .eq("id", userId)
    .select();

  console.log("Step 2 (update points & role to customer) error:", e2, "updated rows:", r2?.length);
  if (r2 && r2.length > 0) {
    console.log("Points in returned data:", r2[0].points, "Role in returned data:", r2[0].role);
  }

  // Get final state
  const { data: pFinal } = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log("Final points in DB:", pFinal.points, "Final role in DB:", pFinal.role);
}

test();
