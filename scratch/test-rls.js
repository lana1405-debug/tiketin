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

// Create client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Let's try to sign in with an existing user from the database or register a new one with gmail
  const testEmail = `testquiz_${Math.floor(Math.random() * 1000000)}@gmail.com`;
  const testPassword = 'Password123!';

  console.log("Signing up test user:", testEmail);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Test Quiz User'
      }
    }
  });

  if (signUpError) {
    console.error("Sign up failed:", signUpError);
    return;
  }

  const userId = signUpData.user.id;
  console.log("Sign up success. User ID:", userId);

  // Sign in to get session
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (signInError) {
    console.error("Sign in failed:", signInError);
    return;
  }

  const userSession = signInData.session;
  console.log("Sign in success. JWT token acquired.");

  // Create a new client authenticated as the test user
  const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  await authSupabase.auth.setSession({
    access_token: userSession.access_token,
    refresh_token: userSession.refresh_token
  });

  // Let's read the initial profile
  console.log("\n--- Reading initial profile ---");
  const { data: profile, error: readError } = await authSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (readError) {
    console.error("Read profile error:", readError);
  } else {
    console.log("Profile:", profile);
  }

  // TEST 1: Update points directly
  console.log("\n--- TEST 1: Direct points update ({ points: 10 }) ---");
  const { data: test1Data, error: test1Error, status: test1Status } = await authSupabase
    .from('profiles')
    .update({ points: 10 })
    .eq('id', userId)
    .select();

  console.log("Status:", test1Status);
  console.log("Error:", test1Error);
  console.log("Data returned:", test1Data);

  // TEST 2: Role escalation step 1 - update role to 'eo'
  console.log("\n--- TEST 2: Role escalation step 1 ({ role: 'eo' }) ---");
  const { data: test2Data, error: test2Error, status: test2Status } = await authSupabase
    .from('profiles')
    .update({ role: 'eo' })
    .eq('id', userId)
    .select();

  console.log("Status:", test2Status);
  console.log("Error:", test2Error);
  console.log("Data returned:", test2Data);

  // Read profile again to see if role changed
  const { data: profileAfterStep1 } = await authSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  console.log("Profile after step 1:", profileAfterStep1);

  // TEST 3: Role escalation step 2 - update points and revert role
  console.log("\n--- TEST 3: Role escalation step 2 ({ points: 20, role: 'customer' }) ---");
  const { data: test3Data, error: test3Error, status: test3Status } = await authSupabase
    .from('profiles')
    .update({ points: 20, role: 'customer' })
    .eq('id', userId)
    .select();

  console.log("Status:", test3Status);
  console.log("Error:", test3Error);
  console.log("Data returned:", test3Data);

  // Read final profile
  const { data: finalProfile } = await authSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  console.log("Final Profile:", finalProfile);
}

run();
