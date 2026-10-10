import { db } from "./db";
import type { Lead } from "./types";

export type LeadRow = Lead & { overrideReason?: string; acked?: boolean };

const SQL = `
select l.ref, l.is_demo, l.name, l.phone, l.property_line, l.source, l.status, l.lead_flags, l.asked, l.price_asked,
       l.follow_up_note, l.consult_mode,
       c.called_at_text, c.duration_text, c.summary,
       q.verdict, q.reason, q.score, q.notes, q.question, q.c1, q.c2, q.c3, q.c4, q.c5, q.override_reason,
       m.slot_text,
       e.promised_minutes, e.acknowledged_at,
       extract(epoch from (now() - e.created_at)) / 60 as esc_started_ago_min
from leads l
left join lateral (select * from qualification_results x where x.lead_id = l.id order by x.created_at desc limit 1) q on true
left join lateral (select * from calls x where x.lead_id = l.id order by x.created_at limit 1) c on true
left join lateral (select * from meetings x where x.lead_id = l.id order by x.created_at desc limit 1) m on true
left join lateral (select * from escalations x where x.lead_id = l.id order by x.created_at desc limit 1) e on true
order by l.is_demo, l.ref`;

export async function getLeads(): Promise<LeadRow[]> {
  const { rows } = await db().query(SQL);
  return rows.map((r, i) => ({
    id: r.ref,
    demo: r.is_demo,
    order: i,
    name: r.name ?? "Name not captured",
    phone: r.phone ?? "Number withheld",
    calledAt: r.called_at_text ?? "",
    duration: r.duration_text ?? "",
    summary: r.summary ?? "",
    source: r.source ?? "—",
    slot: r.slot_text,
    mode: r.consult_mode,
    verdict: r.verdict,
    reason: r.reason ?? "",
    score: r.score,
    flags: r.lead_flags ?? [],
    notes: r.notes ?? [],
    question: r.question,
    criteria: { c1: r.c1, c2: r.c2, c3: r.c3, c4: r.c4, c5: r.c5 },
    property: r.property_line ?? "Details not captured",
    asked: r.asked ?? [],
    status: r.status,
    priceAsked: r.price_asked,
    followUpNote: r.follow_up_note,
    escalation: r.promised_minutes ? { promiseMinutes: r.promised_minutes, startedAgoMinutes: Number(r.esc_started_ago_min) } : null,
    overrideReason: r.override_reason ?? undefined,
    acked: !!r.acknowledged_at,
  }));
}
