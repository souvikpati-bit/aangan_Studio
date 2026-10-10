// Runs one SQL file on Neon. Usage: node --no-warnings --env-file=.env scripts/db_run_sql.ts db/migrations/002_pending_calls.sql
import { readFileSync } from "node:fs";
import pg from "pg";
const file = process.argv[2];
if (!file) throw new Error("Usage: db_run_sql.ts <file.sql>");
const c = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await c.connect();
await c.query(readFileSync(file, "utf8"));
console.log("ran", file);
await c.end();
