import dotenv from "dotenv";
dotenv.config();

async function main() {
  const { db, ensureDbReady } = await import("../src/db/index.ts");
  console.log("Testing ensureDbReady()...");
  await ensureDbReady();
  console.log("Testing query on db...");
  const { users } = await import("../src/db/schema.ts");
  const rows = await db.select().from(users).limit(3);
  console.log("Query returned rows count:", rows.length);
  console.log("Sample user:", rows[0]?.email);
  process.exit(0);
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
