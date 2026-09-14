import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import path from "path";
import fs from "fs";
import { initDb, initRemoteDb } from "./init";

const databaseUrl = process.env.DATABASE_URL;

const isRemotePostgres =
  databaseUrl &&
  (databaseUrl.includes("supabase.co") ||
    databaseUrl.includes("neon.tech") ||
    databaseUrl.includes("aws.com") ||
    databaseUrl.includes("azure.com") ||
    (!databaseUrl.includes("127.0.0.1") && !databaseUrl.includes("localhost")));

const globalForDb = globalThis as typeof globalThis & {
  __arenaDb?: any;
  __arenaNextJsPostgresqlPool?: Pool;
  __pgliteClient?: PGlite;
  __dbInitPromise?: Promise<void>;
  __usingFallbackPglite?: boolean;
};

function getLocalPgliteClient(): PGlite {
  if (globalForDb.__pgliteClient) {
    return globalForDb.__pgliteClient;
  }

  // In serverless / Vercel, process.cwd() is read-only (/var/task).
  // Use /tmp for writable filesystem, or in-memory fallback.
  const isServerless =
    !!process.env.VERCEL ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.cwd().startsWith("/var/task");

  const baseDir = isServerless ? "/tmp" : process.cwd();
  const dataDir = path.join(baseDir, ".pgdata");

  try {
    const pidFile = path.join(dataDir, "postmaster.pid");
    if (fs.existsSync(pidFile)) {
      try {
        fs.unlinkSync(pidFile);
      } catch {
        // ignore
      }
    }
    const pglite = new PGlite(dataDir);
    globalForDb.__pgliteClient = pglite;
    return pglite;
  } catch (err) {
    console.warn("Falling back to pure in-memory PGlite:", err);
    const pglite = new PGlite();
    globalForDb.__pgliteClient = pglite;
    return pglite;
  }
}

function initLocalDatabase(): Promise<void> {
  const pglite = getLocalPgliteClient();
  globalForDb.__arenaDb = drizzlePglite(pglite);
  globalForDb.__usingFallbackPglite = true;

  return (async () => {
    try {
      await pglite.waitReady;
      await initDb(pglite);
    } catch (err) {
      console.error("Failed to ensure local DB schema:", err);
    }
  })();
}

function initRemoteDatabase(): Promise<void> {
  const pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  return (async () => {
    try {
      // Test connection
      const client = await pool.connect();
      client.release();
      await initRemoteDb(pool);
      globalForDb.__arenaDb = drizzlePg(pool);
      globalForDb.__usingFallbackPglite = false;
      console.log("✅ Successfully connected to Supabase remote PostgreSQL database!");
    } catch (err: any) {
      console.warn(
        `⚠️ Supabase database unreachable (${err.message}). Falling back to local embedded database.`
      );
      await initLocalDatabase();
    }
  })();
}

function createDbInstance() {
  if (isRemotePostgres) {
    const pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }
    return drizzlePg(pool);
  }

  const pglite = getLocalPgliteClient();
  return drizzlePglite(pglite);
}

// Default to local embedded database first for immediate resilience
if (!globalForDb.__arenaDb) {
  const pglite = getLocalPgliteClient();
  globalForDb.__arenaDb = drizzlePglite(pglite);
  globalForDb.__usingFallbackPglite = true;
}

export async function ensureDbReady(): Promise<void> {
  if (!globalForDb.__dbInitPromise) {
    if (isRemotePostgres) {
      globalForDb.__dbInitPromise = initRemoteDatabase();
    } else {
      globalForDb.__dbInitPromise = initLocalDatabase();
    }
  }

  await globalForDb.__dbInitPromise;

  if (globalForDb.__pgliteClient) {
    await globalForDb.__pgliteClient.waitReady;
  }
}

// Eagerly initiate connection in background
ensureDbReady().catch(() => {});

export type Database = ReturnType<typeof drizzlePglite>;

// Dynamic proxy ensuring seamless execution whether connected to Supabase or local fallback
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = globalForDb.__arenaDb ?? drizzlePglite(getLocalPgliteClient());
    const value = instance[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export const pool = globalForDb.__arenaNextJsPostgresqlPool;
