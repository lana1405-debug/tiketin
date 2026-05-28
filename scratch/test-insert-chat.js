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

async function insertChat() {
  const payload = {
    event_id: '57bb4e7c-b94f-4442-926c-36863b129750', // THEATREE
    user_id: 'ef6ae025-7100-414a-a7a9-75f60f9ffbfe', // ikman
    user_name: 'Admin Test User',
    message: 'Hello, this is a test from the database!',
    type: 'text'
  };

  const { data, error } = await supabase.from('event_chats').insert([payload]).select();
  console.log("Insert result:", data, error);
}

insertChat();
