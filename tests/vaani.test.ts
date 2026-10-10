import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPayload, callTimes, fetchCallDetails, hasCallerSpeech, startWebSession } from "../web/lib/vaani.ts";

test("callTimes reads the start from the call id and the length from the transcript", () => {
  const t = callTimes("webrtc-1791652638-f1903889", "[17:17:27] AGENT: hi\n[17:18:00] USER: x\n[17:20:04] AGENT: bye");
  assert.equal(t!.start.toISOString(), "2026-10-10T17:17:18.000Z");
  assert.equal(Math.round((t!.end.getTime() - t!.start.getTime()) / 1000), 157 + 3); // 17:17:27 -> 17:20:04 plus 3 s
  assert.equal(callTimes("room-3921d", "[1]"), null);
  assert.ok(callTimes("webrtc-1791652638-a", "[23:59:50] A\n[00:00:10] B")!.end > new Date("2026-10-10T17:17:18Z")); // crosses midnight
});

process.env.VAANI_API_KEY = "k";
process.env.VAANI_AGENT_ID = "agent-1";

test("startWebSession sends the key + agent id and returns a websocket url", async () => {
  let seen: { url: string; headers: Record<string, string>; body: string } | undefined;
  const f = (async (url: string, init: { headers: Record<string, string>; body: string }) => {
    seen = { url, ...init };
    return new Response(JSON.stringify({ token: "t", room_name: "webrtc-1-abc", connection_url: "https://server.vaanivoice.ai" }), { status: 200 });
  }) as unknown as typeof fetch;
  const s = await startWebSession(f);
  assert.deepEqual(s, { token: "t", room: "webrtc-1-abc", url: "wss://server.vaanivoice.ai" });
  assert.equal(seen!.headers["X-API-Key"], "k");
  assert.ok(seen!.body.includes('"medium":"webrtc"') && seen!.body.includes("agent-1"));
});

test("startWebSession fails clearly when Vaani refuses", async () => {
  const f = (async () => new Response("{}", { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(() => startWebSession(f), /could not start the call \(401\)/);
});

test("fetchCallDetails maps Vaani's fields and returns null while the call is unknown", async () => {
  const ok = (async () => new Response(JSON.stringify({ transcription: " [1] AGENT: hi\n[2] USER: hello ", summary: "A summary.", entity: { customer_name: "Anusha" } }), { status: 200 })) as unknown as typeof fetch;
  const d = await fetchCallDetails("webrtc-1-abc", ok);
  assert.equal(d!.transcript, "[1] AGENT: hi\n[2] USER: hello");
  assert.equal(d!.summary, "A summary.");
  assert.equal(d!.entities.customer_name, "Anusha");
  const missing = (async () => new Response('{"detail":"Not Found"}', { status: 404 })) as unknown as typeof fetch;
  assert.equal(await fetchCallDetails("nope", missing), null);
  const broken = (async () => new Response("x", { status: 500 })) as unknown as typeof fetch;
  await assert.rejects(() => fetchCallDetails("x", broken));
});

test("a transcript with no caller speech is detected", () => {
  assert.equal(hasCallerSpeech("[1] AGENT: Hello?\n[5] AGENT: Hello?"), false);
  assert.equal(hasCallerSpeech("[1] AGENT: Hello\n[2] USER: Hi there"), true);
  assert.equal(hasCallerSpeech(null), false);
});

test("buildPayload mirrors the webhook shape and points the recording at Vaani's stream", () => {
  const p = buildPayload("webrtc-9-z", { transcript: "t", summary: "s", entities: { customer_name: "A" } }, new Date("2026-10-10T17:17:00Z"), new Date("2026-10-10T17:20:00Z"));
  assert.equal(p.call_id, "webrtc-9-z");
  assert.equal(p.data!.call_duration, 180_000);
  assert.equal(p.data!.recording_url, "https://api.vaanivoice.ai/api/stream/webrtc-9-z");
  assert.equal(p.timestamp, "2026-10-10T17:20:00.000Z");
  assert.deepEqual(p.data!.entities, { customer_name: "A" });
});
