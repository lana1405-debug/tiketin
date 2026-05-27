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

  console.log("Attempting to update points directly as anon...");
  const { data: d1, error: e1, status: s1 } = await supabase
    .from('profiles')
    .update({ points: 56 })
    .eq('id', userId)
    .select();

  console.log("Test 1 (Direct points update) Status:", s1, "Error:", e1, "Data:", d1);

  console.log("Attempting role escalation step 1 as anon...");
  const { data: d2, error: e2, status: s2 } = await supabase
    .from('profiles')
    .update({ role: 'eo' })
    .eq('id', userId)
    .select();

  console.log("Test 2 (Role escalation step 1) Status:", s2, "Error:", e2, "Data:", d2);
}

test();
