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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function simulateValidate(code, event_id) {
  try {
    if (!code) {
      console.log("Error: Kode voucher harus diisi");
      return;
    }
    if (!event_id) {
      console.log("Error: Event ID harus diisi");
      return;
    }

    const codeUpper = code.trim().toUpperCase();
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', codeUpper)
      .single();

    if (error || !voucher) {
      console.log("Error: KODE VOUCHER TIDAK VALID!");
      return;
    }

    if (voucher.event_id && voucher.event_id !== event_id) {
      console.log("Error: VOUCHER TIDAK DAPAT DIGUNAKAN UNTUK EVENT INI! (Voucher Event ID:", voucher.event_id, "Requested Event ID:", event_id, ")");
      return;
    }

    const now = new Date();
    const validFrom = new Date(voucher.valid_from);
    const validTo = new Date(voucher.valid_to);

    console.log("Comparison Info:");
    console.log("  Now:", now.toISOString(), "Local:", now.toString());
    console.log("  Valid From:", validFrom.toISOString(), "Local:", validFrom.toString());
    console.log("  Valid To:", validTo.toISOString(), "Local:", validTo.toString());
    console.log("  now < validFrom:", now < validFrom);
    console.log("  now > validTo:", now > validTo);

    if (now < validFrom) {
      console.log("Error: VOUCHER BELUM DAPAT DIGUNAKAN!");
      return;
    }

    if (now > validTo) {
      console.log("Error: VOUCHER SUDAH KEDALUWARSA!");
      return;
    }

    if (voucher.max_uses !== null && voucher.uses_count >= voucher.max_uses) {
      console.log("Error: KUOTA VOUCHER SUDAH HABIS!");
      return;
    }

    console.log("Success: Voucher is valid!", voucher);

  } catch (err) {
    console.error("Simulation error:", err);
  }
}

// Let's simulate with the data we saw:
// code = 'TIKET10', event_id = '62e537d1-e1f5-482b-b5b0-438d3631df2f'
simulateValidate('TIKET10', '62e537d1-e1f5-482b-b5b0-438d3631df2f');
