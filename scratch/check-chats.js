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

async function testChats() {
  console.log("Querying event_chats table...");
  const { data, error } = await supabase.from('event_chats').select('*').limit(5);
  if (error) {
    console.error("Error querying event_chats:", error);
  } else {
    console.log("Successfully fetched event_chats! Rows:", data);
  }
}

testChats();
