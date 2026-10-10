import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processCall, type VaaniPost } from "../../../../lib/pipeline";
import { finalizeRoom, markFinished, registerRoom } from "../../../../lib/talk";

export const maxDuration = 60; // extraction + database + email can take a few seconds

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const ID = /^[\w-]{8,100}$/;

/**
 * Vaani posts call events here (register https://<app>/api/webhooks/vaani in Vaani > Developers > Webhooks).
 *
 * Two ways in, both safe:
 *  1. With ?secret=<VAANI_WEBHOOK_SECRET>: the posted payload is trusted (used by our own tests).
 *  2. Without a secret (what Vaani sends): the payload is only a doorbell. We take the call id, and fetch the
 *     transcript, summary and recording ourselves from Vaani with our own API key. A forged request can only
 *     ask us to collect a real Vaani call, which is harmless and saved once.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as (VaaniPost & { event?: string; room_name?: string }) | null;
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  // Only the post-call event means "transcript and recording are ready". Other events are acknowledged and ignored.
  if (body.event !== "call_postprocessing") return NextResponse.json({ ok: true, ignored: body.event ?? "unknown" });

  const expected = process.env.VAANI_WEBHOOK_SECRET;
  const given = new URL(req.url).searchParams.get("secret") ?? req.headers.get("x-webhook-secret") ?? "";
  const trusted = !!expected && !!given && same(given, expected);

  try {
    if (trusted) return NextResponse.json({ ok: true, ...(await processCall(body)) });

    const callId = String(body.call_id ?? body.data?.call_id ?? body.data?.room_name ?? body.room_name ?? "");
    if (!ID.test(callId)) return NextResponse.json({ error: "No valid call id" }, { status: 400 });
    await registerRoom(callId, "import");
    await markFinished(callId);
    const r = await finalizeRoom(callId); // pulls the real data from Vaani; "waiting" is retried by the dashboard sync
    return NextResponse.json({ ok: true, collected: r.status, verdict: r.verdict, leadRef: r.leadRef });
  } catch (e) {
    console.error("vaani webhook failed:", (e as Error).message);
    // 500 makes Vaani retry; the call is saved first, and duplicates are ignored on the retry.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
