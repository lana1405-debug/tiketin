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
  console.log("Supabase URL:", supabaseUrl);
  // Get all active sessions or test with a specific user profile
  // Since we don't have a user token, let's see if we can query pg_policies or profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  if (error) {
    console.error("Error reading profiles:", error);
  } else {
    console.log("Profiles:", profiles);
  }
}

test();
