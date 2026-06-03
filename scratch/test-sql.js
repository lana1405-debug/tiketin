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

async function testSql() {
  console.log("Creating bucket 'withdrawal_receipts'...");
  const { data: bucketData, error: createError } = await supabase
    .storage
    .createBucket('withdrawal_receipts', {
      public: true,
      fileSizeLimit: 2097152 // 2MB
    });

  if (createError) {
    console.error("Error creating bucket:", createError);
  } else {
    console.log("Bucket created successfully:", bucketData);
  }

  const { data: buckets, error: bError } = await supabase
    .storage
    .listBuckets();
  console.log("Buckets:", JSON.stringify(buckets, null, 2), bError);
}

testSql();
