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

async function testNotifications() {
  console.log('\n=== TEST 1: INSERT notifikasi sebagai anon (server-side pakai anon key) ===');
  const { data: insertData, error: insertError } = await supabase
    .from('notifications')
    .insert({
      user_id: 'ef6ae025-7100-414a-a7a9-75f60f9ffbfe', // user ID contoh
      title: 'Test Notif',
      message: 'Ini test notifikasi dari script diagnostik',
      type: 'info',
      is_read: false
    })
    .select();

  console.log('INSERT Error:', insertError);
  console.log('INSERT Data:', insertData);

  console.log('\n=== TEST 2: SELECT notifikasi sebagai anon ===');
  const { data: selectData, error: selectError } = await supabase
    .from('notifications')
    .select('*')
    .limit(5);

  console.log('SELECT Error:', selectError);
  console.log('SELECT Data count:', selectData?.length);

  console.log('\n=== TEST 3: Cek apakah Realtime enabled di tabel notifications ===');
  console.log('(Realtime harus diaktifkan di Supabase Dashboard > Table Editor > notifications > Realtime)');
  
  console.log('\n=== DIAGNOSIS ===');
  if (insertError) {
    if (insertError.code === '42501' || insertError.message?.includes('RLS')) {
      console.log('❌ MASALAH RLS: Server-side API routes pakai anon key tapi tabel notifications punya RLS yang memblokir INSERT dari anon/service_role.');
      console.log('   SOLUSI: Tambahkan RLS policy "Allow service_role insert" atau pakai service_role key di server.');
    } else {
      console.log('❌ Error lain:', insertError.message);
    }
  } else {
    console.log('✅ INSERT berhasil — masalah mungkin di Realtime subscription atau userId tidak match.');
  }
}

testNotifications().catch(console.error);
