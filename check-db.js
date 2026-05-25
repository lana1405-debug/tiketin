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

async function check() {
  console.log("Checking Supabase connection to:", supabaseUrl);
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .limit(1);

    if (error) {
      console.error("Error fetching articles:", error);
    } else {
      console.log("Success! Articles data:", data);
    }
  } catch (err) {
    console.error("Crash:", err);
  }
}

check();
