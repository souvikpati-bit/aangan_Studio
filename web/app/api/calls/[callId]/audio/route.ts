import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";

// Plays a call recording to a signed-in user. The Vaani key stays on the server; the browser never sees it,
// and the recording is never on a public URL (the login middleware guards this route).
export async function GET(req: Request, ctx: { params: Promise<{ callId: string }> }) {
  const { callId } = await ctx.params;
  const known = await db().query("select 1 from calls where vaani_call_id = $1", [callId]);
  if (!known.rows[0]) return NextResponse.json({ error: "Unknown call" }, { status: 404 });
  const key = process.env.VAANI_API_KEY;
  if (!key) return NextResponse.json({ error: "VAANI_API_KEY is not set" }, { status: 503 });

  const headers: Record<string, string> = { "X-API-Key": key };
  const range = req.headers.get("range");
  if (range) headers.Range = range; // lets the player seek
  const upstream = await fetch(`https://api.vaanivoice.ai/api/stream/${encodeURIComponent(callId)}`, { headers });
  if (!upstream.ok && upstream.status !== 206) return NextResponse.json({ error: "Recording not available" }, { status: upstream.status === 404 ? 404 : 502 });

  const out = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set("cache-control", "private, no-store");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
