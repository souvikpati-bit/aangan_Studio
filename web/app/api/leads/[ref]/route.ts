import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

const STATUSES = ["New", "Contacted", "Meeting held", "Won", "Lost"];
const OVERRIDE_VERDICTS = ["Qualified", "Needs human", "Not qualified"];

// Updates one lead: status, verdict override (reason required) or escalation acknowledgement.
export async function PATCH(req: Request, ctx: { params: Promise<{ ref: string }> }) {
  const { ref } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const pool = db();
  const found = await pool.query("select id from leads where ref = $1", [ref]);
  if (!found.rows[0]) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const id = found.rows[0].id;

  if (typeof body.status === "string") {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: "Bad status" }, { status: 400 });
    await pool.query("update leads set status = $1::lead_status where id = $2", [body.status, id]);
    await pool.query("insert into audit_log (action, target, reason) values ('status_change', $1, $2)", [ref, body.status]);
  }
  if (typeof body.verdict === "string") {
    const reason = String(body.overrideReason ?? "").trim();
    if (!OVERRIDE_VERDICTS.includes(body.verdict) || !reason)
      return NextResponse.json({ error: "A valid verdict and a reason are required" }, { status: 400 });
    await pool.query(
      `update qualification_results set verdict = $1::verdict_t, override_reason = $2
       where id = (select id from qualification_results where lead_id = $3 order by created_at desc limit 1)`,
      [body.verdict, reason, id],
    );
    await pool.query("insert into audit_log (action, target, reason) values ('verdict_override', $1, $2)", [ref, `${body.verdict}: ${reason}`]);
  }
  if (body.acked === true) {
    await pool.query("update escalations set acknowledged_at = now() where lead_id = $1 and acknowledged_at is null", [id]);
    await pool.query("insert into audit_log (action, target) values ('escalation_acknowledged', $1)", [ref]);
  }
  return NextResponse.json({ ok: true });
}
