const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
const apiKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchOpenApi() {
  console.log("Fetching OpenAPI spec from:", url);
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });
    const spec = await response.json();
    
    // Log all paths starting with /rpc/
    const rpcs = Object.keys(spec.paths || {}).filter(path => path.startsWith('/rpc/'));
    console.log("Available RPC functions:");
    console.log(rpcs);
    
    // Write full spec to file for deeper inspection if needed
    fs.writeFileSync('scratch/openapi.json', JSON.stringify(spec, null, 2));
    console.log("Full OpenAPI spec saved to scratch/openapi.json");
  } catch (err) {
    console.error("Error fetching OpenAPI:", err);
  }
}

fetchOpenApi();
