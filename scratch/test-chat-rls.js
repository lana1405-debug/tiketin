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

async function testRls() {
  // Try login or create a temp user
  const email = `temp_${Math.floor(Math.random()*100000)}@gmail.com`;
  const password = "Password123!";
  
  console.log("Signing up temporary customer...");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test Chat User'
      }
    }
  });

  if (signUpError) {
    console.error("SignUp error:", signUpError);
    return;
  }

  const token = signUpData.session?.access_token;
  console.log("Acquired token. Creating authenticated client...");

  const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  await authSupabase.auth.setSession({
    access_token: signUpData.session.access_token,
    refresh_token: signUpData.session.refresh_token
  });

  console.log("Testing SELECT on event_chats...");
  const { data: selectData, error: selectError } = await authSupabase
    .from('event_chats')
    .select('*');

  console.log("SELECT result error:", selectError);
  console.log("SELECT result data count:", selectData?.length);

  console.log("Testing INSERT on event_chats...");
  const { data: insertData, error: insertError } = await authSupabase
    .from('event_chats')
    .insert([{
      event_id: '57bb4e7c-b94f-4442-926c-36863b129750', // placeholder event id
      user_id: signUpData.user.id,
      user_name: 'Test Chat User',
      message: 'Hello World Test',
      type: 'text'
    }]);

  console.log("INSERT result error:", insertError);
}

testRls();
