// Loads the 22 sample leads (20 real September calls + 2 demo cases) into Neon. Safe to re-run: clears sample rows first.
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set in .env");
const leads = JSON.parse(readFileSync(new URL("../web/data/leads.json", import.meta.url), "utf8"));
const c = new pg.Client({ connectionString: url });
await c.connect();
await c.query("begin");
try {
  // Remove earlier sample data (rows created by this script only).
  await c.query("delete from escalations where lead_id in (select id from leads where ref is not null)");
  await c.query("delete from qualification_results where lead_id in (select id from leads where ref is not null)");
  await c.query("delete from meetings where lead_id in (select id from leads where ref is not null)");
  await c.query("delete from calls where lead_id in (select id from leads where ref is not null)");
  await c.query("delete from leads where ref is not null");

  for (const l of leads) {
    const lead = await c.query(
      `insert into leads (ref, phone, name, property_line, source, price_asked, follow_up, follow_up_note, status, lead_flags, asked, consult_mode, is_demo)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::lead_status,$10,$11,$12,$13) returning id`,
      [l.id, l.phone, l.name, l.property, l.source, l.priceAsked, l.flags.includes("follow_up"), l.followUpNote, l.status,
       l.flags, l.asked, l.mode, l.demo],
    );
    const leadId = lead.rows[0].id;
    const call = await c.query(
      `insert into calls (vaani_call_id, lead_id, from_number, started_at, called_at_text, duration_text, summary, answered_by, call_type)
       values ($1,$2,$3, now(), $4,$5,$6,'front_desk',$7) returning id`,
      [`sample-${l.id}`, leadId, l.phone, l.calledAt, l.duration, l.summary, l.verdict === "Escalate" ? "complaint" : l.verdict === "Missed" ? "missed" : "new_lead"],
    );
    const callId = call.rows[0].id;
    await c.query(
      `insert into qualification_results (lead_id, call_id, c1, c2, c3, c4, c5, verdict, reason, score, notes, question)
       values ($1,$2,$3,$4,$5,$6,$7,$8::verdict_t,$9,$10,$11,$12)`,
      [leadId, callId, l.criteria.c1, l.criteria.c2, l.criteria.c3, l.criteria.c4, l.criteria.c5, l.verdict, l.reason, l.score, l.notes, l.question],
    );
    if (l.slot) await c.query("insert into meetings (lead_id, slot_text, mode) values ($1,$2,$3)", [leadId, l.slot, l.mode === "Site visit" ? "site_visit" : "call"]);
    if (l.escalation)
      await c.query(
        "insert into escalations (lead_id, call_id, summary, promised_minutes, created_at) values ($1,$2,$3,$4, now() - ($5 || ' minutes')::interval)",
        [leadId, callId, l.summary, l.escalation.promiseMinutes, String(l.escalation.startedAgoMinutes)],
      );
  }
  await c.query("commit");
} catch (e) {
  await c.query("rollback");
  throw e;
}
const n = await c.query("select (select count(*) from leads) leads, (select count(*) from calls) calls, (select count(*) from qualification_results) results, (select count(*) from meetings) meetings, (select count(*) from escalations) escalations");
console.log("seeded:", n.rows[0]);
await c.end();
