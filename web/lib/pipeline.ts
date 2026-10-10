import { db } from "./db";
import { extractWith } from "../../engine/extract.ts";
import { qualify } from "../../engine/qualify.ts";
import type { Facts, ServiceArea, Settings } from "../../engine/types.ts";
import settingsJson from "../../config/settings.json";
import areaJson from "../../config/service_area.json";
import { briefHtml, briefSubject, briefText, sendEmail } from "./email";
import { syncLead } from "./hubspot";

const settings = settingsJson as unknown as Settings;
const area = areaJson as unknown as ServiceArea;

/** The fields of Vaani's `call_postprocessing` webhook that we use. Nothing here is guaranteed, so every read is defensive. */
export interface VaaniPost {
  call_id?: string;
  timestamp?: string;
  data?: {
    call_id?: string; room_name?: string; call_duration?: number; end_reason?: string; summary?: string;
    entities?: Record<string, unknown>; dispositions?: Record<string, unknown>;
    recording_url?: string; transcript?: string; phone_number?: string; from_number?: string;
  };
}

const str = (v: unknown) => (typeof v === "string" && v.trim() && !/^(null|none|n\/a|not captured)$/i.test(v.trim()) ? v.trim() : null);
const isMasked = (p: string | null) => !p || /[*xX•]/.test(p);

export interface Outcome { duplicate: boolean; callId: string; verdict?: string; leadRef?: string; emailed?: boolean; extractionFailed?: boolean }

export async function processCall(p: VaaniPost): Promise<Outcome> {
  const d = p.data ?? {};
  const vaaniCallId = p.call_id ?? d.call_id ?? d.room_name;
  if (!vaaniCallId) throw new Error("Webhook has no call_id");
  const pool = db();

  // 1. SAVE THE CALL FIRST. A repeated delivery of the same call is ignored (idempotent).
  const endedAt = p.timestamp ? new Date(p.timestamp) : new Date();
  const durMs = typeof d.call_duration === "number" ? d.call_duration : 0;
  const startedAt = new Date(endedAt.getTime() - durMs);
  const rawPhone = str(d.phone_number) ?? str(d.from_number);
  const ins = await pool.query(
    `insert into calls (vaani_call_id, from_number, caller_id_hidden, started_at, ended_at, duration_s, summary, transcript, recording_url, answered_by, ai_disclosed, raw)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ai',true,$10) on conflict (vaani_call_id) do nothing returning id`,
    [vaaniCallId, rawPhone, !rawPhone, startedAt, endedAt, Math.round(durMs / 1000), str(d.summary), str(d.transcript), str(d.recording_url), JSON.stringify(p)],
  );
  if (!ins.rows[0]) return { duplicate: true, callId: vaaniCallId };
  const callId: string = ins.rows[0].id;

  // 2. EXTRACT FACTS. If the AI fails, the lead is still kept and handed to a human.
  const entities = d.entities ?? {};
  const transcript = str(d.transcript) ?? "";
  let facts: Facts | null = null;
  let extractionError: string | null = null;
  let tokens = { input_tokens: 0, output_tokens: 0 };
  try {
    if (!transcript) throw new Error("No transcript in the webhook");
    const r = await extractWith(
      process.env.LLM_PROVIDER ?? "gemini", transcript, endedAt.toISOString().slice(0, 10),
      { gemini: process.env.GEMINI_API_KEY, anthropic: process.env.ANTHROPIC_API_KEY, model: process.env.GEMINI_MODEL },
    );
    facts = r.facts; tokens = r.usage;
  } catch (e) {
    extractionError = (e as Error).message;
  }

  // 3. DECIDE (rules engine). No facts -> Needs human.
  const q = facts
    ? qualify(facts, endedAt, settings, area)
    : { verdict: "Needs human" as const, reason: `Could not read the call automatically (${extractionError})`, score: null, flags: [] as string[], notes: [] as string[], question: undefined, weeks_to_deadline: null,
        criteria: Object.fromEntries(["c1", "c2", "c3", "c4", "c5"].map((k) => [k, { result: "unclear", note: "not assessed", confidence: 0 }])) as never };

  const name = str(entities.customer_name) ?? "Name not captured";
  const source = str(entities.referrer) ? `Referral · ${str(entities.referrer)}` : str(entities.how_found) ?? "—";
  const property = [facts?.locality, facts?.sqft ? `${facts.sqft.toLocaleString("en-IN")} sq ft` : null, facts?.property_type].filter(Boolean).join(" · ") || "Details not captured";
  const asked = [name !== "Name not captured" && "Name", facts?.locality && "Locality", facts?.sqft && "Size", facts?.scope_kind && facts.scope_kind !== "unknown" && "Scope", (facts?.needed_by || facts?.start_by) && "Timeline", facts?.decision_maker && "Decision-maker"].filter(Boolean) as string[];
  const phone = isMasked(rawPhone) ? null : rawPhone;
  const summary = str(d.summary) ?? "";

  // 4. WRITE THE LEAD (merge into an existing lead when the number is known).
  const existing = phone ? (await pool.query("select id, ref, lead_flags, merged_from_call_ids from leads where phone = $1", [phone])).rows[0] : null;
  let leadId: string, ref: string;
  if (existing) {
    leadId = existing.id; ref = existing.ref;
    await pool.query(
      `update leads set name = case when $2 <> 'Name not captured' then $2 else name end, property_line = $3, source = $4,
         lead_flags = (select array(select distinct unnest(lead_flags || $5::text[]))), asked = $6,
         merged_from_call_ids = array_append(merged_from_call_ids, $7), price_asked = price_asked or $8 where id = $1`,
      [leadId, name, property, source, q.flags, asked, vaaniCallId, !!facts?.price_asked],
    );
  } else {
    ref = "L" + Date.now().toString(36).toUpperCase().slice(-6);
    const r = await pool.query(
      `insert into leads (ref, phone, name, property_line, property_type, locality, sqft, source, referrer, price_asked, follow_up, follow_up_note, decision_maker_note, lead_flags, asked, merged_from_call_ids, needed_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) returning id`,
      [ref, phone, name, property, facts?.property_type ?? null, facts?.locality ?? null, facts?.sqft ?? null, source, str(entities.referrer),
       !!facts?.price_asked, q.flags.includes("follow_up"), facts?.follow_up_note ?? null, facts?.decision_maker_note ?? null, q.flags, asked, [vaaniCallId], facts?.needed_by ?? null],
    );
    leadId = r.rows[0].id;
  }
  await pool.query("update calls set lead_id = $1, call_type = $2 where id = $3", [leadId, facts?.call_type ?? null, callId]);
  await pool.query(
    `insert into qualification_results (lead_id, call_id, c1, c2, c3, c4, c5, verdict, reason, score, notes, question)
     values ($1,$2,$3,$4,$5,$6,$7,$8::verdict_t,$9,$10,$11,$12)`,
    [leadId, callId, q.criteria.c1, q.criteria.c2, q.criteria.c3, q.criteria.c4, q.criteria.c5, q.verdict, q.reason, q.score, q.notes, q.question ?? null],
  );
  if (q.verdict === "Escalate")
    await pool.query("insert into escalations (lead_id, call_id, summary, promised_minutes) values ($1,$2,$3,15)", [leadId, callId, summary]);
  if (q.verdict === "Needs human" || q.verdict === "Missed")
    await pool.query("insert into needs_human (lead_id, call_id, reason, due_at) values ($1,$2,$3, now() + interval '30 minutes')", [leadId, callId, q.reason]);
  await pool.query("insert into cost_log (call_id, voice_min, llm_input_tokens, llm_output_tokens) values ($1,$2,$3,$4)", [callId, durMs / 60000, tokens.input_tokens, tokens.output_tokens]);

  // 5. EMAIL THE DESIGNER (once per call). A failed email never loses the lead.
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const brief = {
    ref, name, phone: phone ?? "Number not available", property, verdict: q.verdict, reason: q.reason, flags: q.flags, notes: q.notes, asked,
    summary, source, priceAsked: !!facts?.price_asked, question: q.question, url: `${appUrl}/`,
  };
  const sent = await sendEmail(process.env.DESIGNER_EMAIL, briefSubject(brief), briefHtml(brief), briefText(brief));
  await pool.query(
    "insert into notifications_log (kind, to_addr, lead_id, call_id, dedupe_key, status, body) values ($1,$2,$3,$4,$5,$6,$7) on conflict (dedupe_key) do nothing",
    [q.verdict === "Escalate" ? "escalation" : "brief", process.env.DESIGNER_EMAIL ?? null, leadId, callId, `brief-${vaaniCallId}`, sent.sent ? "sent" : `not sent: ${sent.reason}`, briefText(brief)],
  );
  if (extractionError)
    await pool.query("insert into notifications_log (kind, call_id, dedupe_key, status, body) values ('failure',$1,$2,'logged',$3) on conflict (dedupe_key) do nothing", [callId, `fail-${vaaniCallId}`, `Extraction failed: ${extractionError}`]);

  // 6. HUBSPOT (skipped quietly when no token). A failure is logged and alerted, never allowed to lose the lead.
  if (process.env.HUBSPOT_TOKEN && q.verdict !== "Closed") {
    try {
      const hs = await syncLead(process.env.HUBSPOT_TOKEN, {
        ref, name, phone, locality: facts?.locality ?? null, property, verdict: q.verdict, reason: q.reason, summary, flags: q.flags, hasMeeting: false,
      });
      await pool.query("insert into hubspot_sync_log (lead_id, entity, hubspot_id, status) values ($1,'contact',$2,'ok')", [leadId, hs.contactId]);
      if (hs.dealId) await pool.query("insert into hubspot_sync_log (lead_id, entity, hubspot_id, status) values ($1,'deal',$2,'ok')", [leadId, hs.dealId]);
    } catch (e) {
      await pool.query("insert into hubspot_sync_log (lead_id, entity, status, error) values ($1,'contact','failed',$2)", [leadId, (e as Error).message]);
      await pool.query("insert into notifications_log (kind, call_id, dedupe_key, status, body) values ('failure',$1,$2,'logged',$3) on conflict (dedupe_key) do nothing", [callId, `hs-${vaaniCallId}`, `HubSpot sync failed: ${(e as Error).message}`]);
    }
  }

  return { duplicate: false, callId: vaaniCallId, verdict: q.verdict, leadRef: ref, emailed: sent.sent, extractionFailed: !!extractionError };
}
