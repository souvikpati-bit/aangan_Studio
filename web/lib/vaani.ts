// Vaani Voice API helpers. Pure (fetch only) so they can be tested with a mock.
import type { VaaniPost } from "./pipeline";

const BASE = "https://api.vaanivoice.ai";
type F = typeof fetch;

const apiKey = () => {
  const k = process.env.VAANI_API_KEY;
  if (!k) throw new Error("VAANI_API_KEY is not set");
  return k;
};

export interface WebSession { token: string; room: string; url: string }

/** Starts a browser (WebRTC) call with the Aangan agent. The room name doubles as the Vaani call id. */
export async function startWebSession(f: F = fetch): Promise<WebSession> {
  const agentId = process.env.VAANI_AGENT_ID;
  if (!agentId) throw new Error("VAANI_AGENT_ID is not set");
  const r = await f(`${BASE}/api/trigger-call/`, {
    method: "POST",
    headers: { "X-API-Key": apiKey(), "content-type": "application/json" },
    body: JSON.stringify({ agent_id: agentId, medium: "webrtc" }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.token || !j.room_name) throw new Error(`Vaani could not start the call (${r.status})`);
  const url = String(j.connection_url ?? "https://server.vaanivoice.ai").replace(/^http/, "ws");
  return { token: j.token, room: j.room_name, url };
}

export interface CallDetails { transcript: string | null; summary: string | null; entities: Record<string, unknown> }

/** Returns null while Vaani has nothing for this call yet (not found, or still processing). */
export async function fetchCallDetails(callId: string, f: F = fetch): Promise<CallDetails | null> {
  const r = await f(`${BASE}/api/call_details/${encodeURIComponent(callId)}`, { headers: { "X-API-Key": apiKey() } });
  if (r.status === 404 || r.status === 422) return null;
  if (!r.ok) throw new Error(`Vaani call details ${r.status}`);
  const j = await r.json().catch(() => null);
  if (!j) return null;
  const transcript = typeof j.transcription === "string" && j.transcription.trim() ? j.transcription.trim() : null;
  return {
    transcript,
    summary: typeof j.summary === "string" && j.summary.trim() ? j.summary.trim() : null,
    entities: j.entity && typeof j.entity === "object" ? j.entity : {},
  };
}

/**
 * Start and end of a call. The call id carries the start time as Unix seconds ("webrtc-1791652638-xxxx"),
 * and the transcript lines carry "[hh:mm:ss]" times, so the length is the span between the first and last line.
 * Returns null when the id has no timestamp (the caller then falls back to its own clock).
 */
export function callTimes(callId: string, transcript: string | null): { start: Date; end: Date } | null {
  const m = callId.match(/-(1[5-9]\d{8}|2\d{9})-/);
  if (!m) return null;
  const start = new Date(Number(m[1]) * 1000);
  const stamps = [...(transcript ?? "").matchAll(/\[(\d\d):(\d\d):(\d\d)\]/g)].map((x) => Number(x[1]) * 3600 + Number(x[2]) * 60 + Number(x[3]));
  let spanS = stamps.length > 1 ? stamps[stamps.length - 1] - stamps[0] : 0;
  if (spanS < 0) spanS += 86_400; // call crossed midnight UTC
  return { start, end: new Date(start.getTime() + (spanS + 3) * 1000) };
}

export const hasCallerSpeech =(t: string | null) => !!t && /\bUSER:\s*\S/.test(t);

/** Turns Vaani's call details into the same shape the webhook would have delivered. */
export function buildPayload(callId: string, d: CallDetails, startedAt: Date, endedAt: Date): VaaniPost {
  return {
    call_id: callId,
    timestamp: endedAt.toISOString(),
    data: {
      call_id: callId,
      room_name: callId,
      call_duration: Math.max(0, endedAt.getTime() - startedAt.getTime()),
      summary: d.summary ?? undefined,
      entities: d.entities,
      transcript: d.transcript ?? undefined,
      // Played through our own server so the Vaani key never reaches the browser.
      recording_url: `${BASE}/api/stream/${callId}`,
    },
  };
}
