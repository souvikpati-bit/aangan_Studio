// End-to-end check of the Vaani webhook against a running local server (npm run dev in web/).
// Sends a realistic call_postprocessing payload built from a real transcript, twice, plus bad-secret and ignored-event cases.
// Then it verifies the rows in Neon and deletes the test rows.
import { readFileSync } from "node:fs";
import pg from "pg";
import { splitTranscripts } from "../engine/extract.ts";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const secret = process.env.VAANI_WEBHOOK_SECRET;
if (!secret) throw new Error("VAANI_WEBHOOK_SECRET is not set");
const transcripts = splitTranscripts(readFileSync(new URL("../seed/phone_transcripts_T01-T20.md", import.meta.url), "utf8"));

// Vaani-style transcript: "[hh:mm:ss] AGENT: ..." / "USER: ..."
const vaaniStyle = (t: string) => t.split("\n").slice(1).map((l, i) => l.replace(/^Front Desk:/, `[10:23:${String(10 + i).padStart(2, "0")}] AGENT:`).replace(/^Caller:/, `[10:23:${String(10 + i).padStart(2, "0")}] USER:`)).filter(Boolean).join("\n\n");

const id = `test-${Date.now()}`;
const payload = (callId: string, tKey: string, ts: string, entities: Record<string, unknown>) => ({
  event: "call_postprocessing", call_id: callId, timestamp: ts,
  data: { room_name: callId, call_id: callId, call_duration: 252000, end_reason: "Call ended", summary: "Test call.", entities, dispositions: {}, recording_url: `https://api.vaanivoice.ai/api/stream/${callId}`, transcript: vaaniStyle(transcripts[tKey]) },
});
const post = async (q: string, body: unknown) => {
  const r = await fetch(`${BASE}/api/webhooks/vaani${q}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, detail = "") => { results.push([name, ok, detail]); console.log(ok ? "PASS" : "FAIL", name, detail); };

const bad = await post("?secret=wrong", payload(id + "-x", "T01", "2026-09-02T04:57:00Z", {}));
check("wrong secret is refused", bad.status === 401, String(bad.status));
const ignored = await post(`?secret=${secret}`, { event: "call_started", room_name: id });
check("other events are acknowledged and ignored", ignored.status === 200 && ignored.body.ignored === "call_started", JSON.stringify(ignored.body));

const t01 = await post(`?secret=${secret}`, payload(id + "-a", "T01", "2026-09-02T04:57:00Z", { customer_name: "Priya", referrer: "Shruti Joshi" }));
check("T01 call is processed and Qualified", t01.status === 200 && t01.body.verdict === "Qualified", JSON.stringify(t01.body));
const dup = await post(`?secret=${secret}`, payload(id + "-a", "T01", "2026-09-02T04:57:00Z", { customer_name: "Priya" }));
check("same call delivered twice is ignored", dup.status === 200 && dup.body.duplicate === true, JSON.stringify(dup.body));
const t03 = await post(`?secret=${secret}`, payload(id + "-b", "T03", "2026-09-03T10:45:00Z", { customer_name: "Suresh Patil" }));
check("T03 (Nashik) is Not qualified", t03.body.verdict === "Not qualified", JSON.stringify(t03.body));
const t09 = await post(`?secret=${secret}`, payload(id + "-c", "T09", "2026-09-10T06:00:00Z", { customer_name: "Sheetal Deshpande" }));
check("T09 complaint becomes an Escalation", t09.body.verdict === "Escalate", JSON.stringify(t09.body));

const c = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await c.connect();
const n = (await c.query("select count(*)::int n from calls where vaani_call_id like $1", [`${id}%`])).rows[0].n;
check("exactly 3 calls saved (duplicate not saved twice)", n === 3, String(n));
const q = (await c.query("select l.name, l.source, q.verdict, c.transcript is not null as has_tx, c.recording_url is not null as has_rec from calls c join leads l on l.id=c.lead_id join qualification_results q on q.call_id=c.id where c.vaani_call_id = $1", [id + "-a"])).rows[0];
check("lead row has name, source, transcript, recording link", q?.name === "Priya" && q.source.includes("Shruti") && q.has_tx && q.has_rec, JSON.stringify(q));
const esc = (await c.query("select count(*)::int n from escalations e join calls c on c.id=e.call_id where c.vaani_call_id = $1", [id + "-c"])).rows[0].n;
check("escalation row created", esc === 1, String(esc));
const notif = (await c.query("select status from notifications_log where dedupe_key = $1", [`brief-${id}-a`])).rows[0];
check("email attempt is logged", !!notif, notif?.status);

// cleanup: remove test records from HubSpot first (notes, deals, contacts), then from the database
const hsRows = (await c.query("select h.entity, h.hubspot_id from hubspot_sync_log h join calls c on c.lead_id = h.lead_id where c.vaani_call_id like $1 and h.status = 'ok'", [`${id}%`])).rows;
check("HubSpot records created for the test calls (if a token is set)", !process.env.HUBSPOT_TOKEN || hsRows.length >= 3, `${hsRows.length} rows`);
for (const kind of ["note", "deal", "contact"]) {
  for (const row of hsRows.filter((x) => x.entity === kind)) {
    await fetch(`https://api.hubapi.com/crm/v3/objects/${kind}s/${row.hubspot_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}` } });
  }
}
await c.query("begin");
await c.query("delete from hubspot_sync_log where lead_id in (select lead_id from calls where vaani_call_id like $1)", [`${id}%`]);
await c.query("delete from notifications_log where dedupe_key like $1", [`%${id}%`]);
await c.query("create temp table _t as select id as call_id, lead_id from calls where vaani_call_id like $1", [`${id}%`]);
await c.query("delete from cost_log where call_id in (select call_id from _t)");
await c.query("delete from escalations where call_id in (select call_id from _t)");
await c.query("delete from needs_human where call_id in (select call_id from _t)");
await c.query("delete from qualification_results where call_id in (select call_id from _t)");
await c.query("delete from calls where id in (select call_id from _t)");
await c.query("delete from leads where id in (select lead_id from _t) and ref not like 'T%' and ref not like 'DEMO%'");
await c.query("commit");
await c.end();
console.log(`\n${results.filter((r) => r[1]).length}/${results.length} checks passed. Test rows removed.`);
process.exit(results.every((r) => r[1]) ? 0 : 1);
