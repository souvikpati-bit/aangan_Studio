// Connects to Neon (direct URL) and lists tables. Prints no secrets.
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set in .env");
const c = new pg.Client({ connectionString: url });
await c.connect();
const v = await c.query("select version() as v, current_database() as db");
console.log("connected:", v.rows[0].db, "|", String(v.rows[0].v).split(" on ")[0]);
const t = await c.query("select table_name from information_schema.tables where table_schema='public' order by 1");
console.log("tables:", t.rows.length ? t.rows.map((r) => r.table_name).join(", ") : "(none yet)");
await c.end();
