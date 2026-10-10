import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { COOKIE, cookieOptions, signSession } from "../../../lib/auth";
import { verifyPassword } from "../../../lib/password";

// Simple in-memory brake: 8 wrong tries per email per 10 minutes.
const tries = new Map<string, { n: number; first: number }>();

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || typeof password !== "string" || !email || !password)
    return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
  const key = email.toLowerCase().trim();
  const t = tries.get(key);
  if (t && Date.now() - t.first < 600_000 && t.n >= 8) return NextResponse.json({ error: "Too many tries. Wait a few minutes." }, { status: 429 });

  const { rows } = await db().query("select id, email, role, password_hash from users where lower(email) = $1", [key]);
  const user = rows[0];
  const ok = user ? await verifyPassword(password, user.password_hash) : await verifyPassword(password, null);
  if (!ok) {
    tries.set(key, { n: (t && Date.now() - t.first < 600_000 ? t.n : 0) + 1, first: t && Date.now() - t.first < 600_000 ? t.first : Date.now() });
    return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  }
  tries.delete(key);
  await db().query("insert into audit_log (actor, action, target) values ($1, 'login', $2)", [user.id, user.email]);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await signSession({ uid: user.id, email: user.email, role: user.role }), cookieOptions);
  return res;
}
