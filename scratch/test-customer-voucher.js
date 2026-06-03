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

// Create admin client to sign in or get user
const adminSupabase = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = `temp_cust_${Date.now()}@test.com`;
  const password = "Password123!";

  console.log("Creating auto-confirmed user via admin auth api...");
  const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Temp Customer' }
  });

  if (createError) {
    console.error("Create user error:", createError);
    return;
  }

  const userId = userData.user.id;
  // Ensure role is customer
  await adminSupabase.from('profiles').update({ role: 'customer' }).eq('id', userId);

  // Sign in to get tokens
  const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error("Sign in error:", signInError);
    return;
  }

  // Create authenticated client
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  await client.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token
  });

  console.log("Querying vouchers as authenticated customer...");
  const { data: vouchers, error: vError } = await client
    .from('vouchers')
    .select('*');

  console.log("Vouchers:", vouchers, "Error:", vError);

  // Clean up user
  await adminSupabase.auth.admin.deleteUser(userId);
  console.log("Cleaned up temporary customer.");
}

run();
