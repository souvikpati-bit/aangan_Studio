// Creates the tables on Neon once. Safe to re-run: it skips if the schema already exists.
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set in .env");
const sql = readFileSync(new URL("../db/schema.neon.sql", import.meta.url), "utf8");
const c = new pg.Client({ connectionString: url });
await c.connect();
const has = await c.query("select to_regclass('public.leads') as t");
if (has.rows[0].t) {
  console.log("schema already exists - nothing to do");
} else {
  await c.query("begin");
  try {
    await c.query(sql);
    await c.query("commit");
    console.log("schema created");
  } catch (e) {
    await c.query("rollback");
    throw e;
  }
}
const t = await c.query("select table_name from information_schema.tables where table_schema='public' order by 1");
console.log("tables:", t.rows.map((r) => r.table_name).join(", "));
await c.end();
