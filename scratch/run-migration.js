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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Checking columns of 'articles' table first...");
  const sqlCheck = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'articles';
  `;
  
  let { data: checkData, error: checkError } = await supabase.rpc('exec_sql', { sql: sqlCheck });
  if (checkError) {
    console.error("Error checking columns:", checkError);
  } else {
    console.log("Current columns:", checkData);
  }

  console.log("Running migration...");
  const migrationSql = `
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS linked_event_ids UUID[] DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_articles_linked_event_ids ON articles USING GIN(linked_event_ids);
    NOTIFY pgrst, 'reload schema';
  `;
  
  let { data: migData, error: migError } = await supabase.rpc('exec_sql', { sql: migrationSql });
  if (migError) {
    console.error("Error executing migration:", migError);
  } else {
    console.log("Migration executed successfully! Result:", migData);
  }

  console.log("Verifying columns after migration...");
  let { data: checkDataAfter, error: checkErrorAfter } = await supabase.rpc('exec_sql', { sql: sqlCheck });
  if (checkErrorAfter) {
    console.error("Error checking columns after:", checkErrorAfter);
  } else {
    console.log("Columns after migration:", checkDataAfter);
  }
}

run();
