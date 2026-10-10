// Creates or updates a dashboard user. The password is stored only as a scrypt hash.
// Usage: node --no-warnings --env-file=.env scripts/create_user.ts <email> <password> [designer|front_desk|founder]
import pg from "pg";
import { hashPassword } from "../web/lib/password.ts";

const [email, password, role = "founder"] = process.argv.slice(2);
if (!email || !password) throw new Error("Usage: create_user.ts <email> <password> [role]");
if (!["designer", "front_desk", "founder"].includes(role)) throw new Error("role must be designer, front_desk or founder");
if (password.length < 8) throw new Error("Use a password of at least 8 characters");

const c = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await c.connect();
const hash = await hashPassword(password);
await c.query(
  `insert into users (email, name, role, password_hash) values ($1, $2, $3::app_role, $4)
   on conflict (email) do update set password_hash = excluded.password_hash, role = excluded.role`,
  [email.toLowerCase().trim(), email.split("@")[0], role, hash],
);
console.log(`user ready: ${email.toLowerCase().trim()} (${role})`);
await c.end();
