import { Pool } from "pg";

// One shared pool per server process (reused across hot reloads in dev).
const g = globalThis as unknown as { __pool?: Pool };

export function db(): Pool {
  if (!g.__pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.");
    g.__pool = new Pool({ connectionString: url, max: 5 });
  }
  return g.__pool;
}
