import pg from "pg";
const { Client } = pg;
import dns from "node:dns/promises";

async function testHost(host) {
  try {
    const addresses = await dns.lookup(host);
    console.log(`[DNS] ${host} => ${addresses.address}`);
    return true;
  } catch (err) {
    console.log(`[DNS] ${host} => FAILED: ${err.message}`);
    return false;
  }
}

async function testConnection(name, connectionString) {
  console.log(`\nTesting ${name}...`);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 7000,
  });
  try {
    await client.connect();
    const res = await client.query("SELECT current_database(), current_user, version();");
    console.log(`✅ ${name} CONNECTED!`, res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ ${name} FAILED:`, err.message);
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  const password = "M8+h6qDzBD3ju7V";
  const projects = ["tsdnbwwglfcfjmukbjyg", "fzqdcsxmhndhgkemrpem"];

  for (const p of projects) {
    const host = `db.${p}.supabase.co`;
    await testHost(host);
    const connStr = `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres`;
    await testConnection(`Project ${p} (direct 5432)`, connStr);

    const poolerConnStr = `postgresql://postgres:${encodeURIComponent(password)}@${host}:6543/postgres`;
    await testConnection(`Project ${p} (pooler 6543)`, poolerConnStr);
  }
}

main().catch(console.error);
