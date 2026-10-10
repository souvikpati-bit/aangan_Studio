import { db } from "./db";
import { buildPayload, callTimes, fetchCallDetails, hasCallerSpeech } from "./vaani";
import { processCall } from "./pipeline";

export type FinalizeStatus = "processed" | "waiting" | "empty" | "failed";
export interface FinalizeResult { status: FinalizeStatus; verdict?: string; leadRef?: string; message?: string }

const MAX_ATTEMPTS = 40;          // ~ 40 checks, spaced by the caller (5 s) or the dashboard poll (20 s)
const SUMMARY_GRACE_MS = 90_000;  // wait this long after the call ends for Vaani's summary to appear

export async function registerRoom(room: string, source: "talk" | "import") {
  await db().query("insert into pending_calls (room_name, source) values ($1, $2) on conflict (room_name) do nothing", [room, source]);
}

export async function markFinished(room: string) {
  await db().query("update pending_calls set finished_at = coalesce(finished_at, now()) where room_name = $1", [room]);
}

/** Collects one call from Vaani and runs it through the normal pipeline (save, qualify, email, HubSpot). Safe to call repeatedly. */
export async function finalizeRoom(room: string): Promise<FinalizeResult> {
  const pool = db();
  const { rows } = await pool.query("select * from pending_calls where room_name = $1", [room]);
  const row = rows[0];
  if (!row) return { status: "failed", message: "Unknown call" };
  if (row.processed_at) return { status: "processed" };
  if (row.attempts >= MAX_ATTEMPTS) return { status: "failed", message: row.last_error ?? "Vaani never returned this call" };

  try {
    const d = await fetchCallDetails(room);
    const ageMs = row.finished_at ? Date.now() - new Date(row.finished_at).getTime() : Infinity;
    const notReady = !d || !d.transcript || (!d.summary && ageMs < SUMMARY_GRACE_MS);
    if (notReady) {
      await pool.query("update pending_calls set attempts = attempts + 1 where room_name = $1", [room]);
      return { status: "waiting" };
    }
    if (!hasCallerSpeech(d.transcript)) {
      await pool.query("update pending_calls set processed_at = now(), last_error = 'caller said nothing' where room_name = $1", [room]);
      return { status: "empty", message: "The caller never spoke, so no lead was created." };
    }
    const t = callTimes(room, d.transcript);
    const ended = t?.end ?? (row.finished_at ? new Date(row.finished_at) : new Date());
    const started = t?.start ?? (row.source === "talk" ? new Date(row.created_at) : new Date(ended.getTime() - 60_000));
    const out = await processCall(buildPayload(room, d, started, ended));
    await pool.query("update pending_calls set processed_at = now(), last_error = null where room_name = $1", [room]);
    return { status: "processed", verdict: out.verdict, leadRef: out.leadRef };
  } catch (e) {
    await pool.query("update pending_calls set attempts = attempts + 1, last_error = $2 where room_name = $1", [room, (e as Error).message.slice(0, 300)]);
    return { status: "waiting", message: (e as Error).message };
  }
}

/** Safety net for calls whose page was closed before they were collected. Runs from the dashboard poll. */
export async function syncPending(limit = 5): Promise<{ checked: number; processed: number }> {
  const { rows } = await db().query(
    `select room_name from pending_calls
     where processed_at is null and attempts < $1 and created_at > now() - interval '2 days'
       and (finished_at is not null or created_at < now() - interval '3 minutes')
     order by created_at limit $2`,
    [MAX_ATTEMPTS, limit],
  );
  let processed = 0;
  for (const r of rows) {
    const res = await finalizeRoom(r.room_name);
    if (res.status === "processed") processed++;
  }
  return { checked: rows.length, processed };
}
