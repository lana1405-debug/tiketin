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

const users = [
  { email: 'admin2@tiketin.com', passwords: ['Password123!', 'admin2', 'admin123', 'admin', 'admin2@tiketin.com'] },
  { email: 'ikmanmaulana1409@gmail.com', passwords: ['Password123!', 'password', 'ikman123'] }
];

async function tryLogins() {
  for (const user of users) {
    for (const pw of user.passwords) {
      console.log(`Trying ${user.email} with password "${pw}"...`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pw
      });
      if (error) {
        console.log(`Failed: ${error.message}`);
      } else {
        console.log(`SUCCESS! Logged in as ${user.email}`);
        console.log("Session:", data.session ? "OK" : "NO SESSION");
        return;
      }
    }
  }
}

tryLogins();
