import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processCall, type VaaniPost } from "../../../../lib/pipeline";

export const maxDuration = 60; // extraction + database + email can take a few seconds

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Vaani posts call events here. Register: https://<your-app>/api/webhooks/vaani?secret=<VAANI_WEBHOOK_SECRET>
// (Vaani's docs describe no signature header, so the secret travels in the URL.)
export async function POST(req: Request) {
  const expected = process.env.VAANI_WEBHOOK_SECRET;
  const given = new URL(req.url).searchParams.get("secret") ?? req.headers.get("x-webhook-secret") ?? "";
  if (!expected || !same(given, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as (VaaniPost & { event?: string }) | null;
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  // Only the post-call event carries the transcript and recording. Other events are acknowledged and ignored.
  if (body.event !== "call_postprocessing") return NextResponse.json({ ok: true, ignored: body.event ?? "unknown" });

  try {
    return NextResponse.json({ ok: true, ...(await processCall(body)) });
  } catch (e) {
    console.error("vaani webhook failed:", (e as Error).message);
    // 500 makes Vaani retry; the call is saved first, and duplicates are ignored on the retry.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
