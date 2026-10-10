import type { Facts } from "./types.ts";

export const EXTRACT_PROMPT_VERSION = "extract-v1";

const SYSTEM = `You extract structured facts from one phone-call transcript for Aangan Studio, a Pune interior design studio that does design + execution in Pune city and PCMC.
Return ONLY one JSON object, no prose. Rules:
- Never guess. If the caller did not say it, use null. Never invent numbers, names or dates.
- Dates: resolve to ISO yyyy-mm-dd using the call date given below (a month alone means the LAST day of that month; a start-only month goes in start_by, not needed_by). needed_by is when the project must be complete or move-in ready. If the caller gives no completion date, needed_by is null.
- Do not decide the verdict. Only report facts.
- budget_max_inr: only if the caller volunteered a budget; the UPPER end, in rupees (1 lakh = 100000).
- call_type: new_lead | returning (refers to an earlier call/enquiry) | complaint (existing client with a running project issue) | missed (no conversation) | spam.
- wants_execution: false if the caller only wants ideas/advice/suggestions; true if they want a project done; null if unclear.
- decision_maker: yes (they decide) | authorised (someone with authority has agreed) | unclear.
- price_asked: true if the caller asked about cost/price/range.
- service_recovery: true if the caller says an earlier enquiry was lost or not followed up.
- conf: your confidence 0..1 for c1 (real project), c2 (service area/type), c3 (timeline), c4 (budget), c5 (decision-maker).
JSON keys: call_type, wants_execution, property_type (home|office|restaurant|hotel|retail|gym|other), home_kind (apartment|villa), locality, scope_kind (full_home|partial|single_room|office|unknown), rooms_count, sqft, needed_by, needed_by_words, start_by, budget_max_inr, decision_maker, decision_maker_note, referrer, price_asked, follow_up, follow_up_note, service_recovery, key_facts_missing, angry_or_bad_line, conf.`;

export interface ExtractOptions {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
}
export interface ExtractResult {
  facts: Facts;
  usage: { input_tokens: number; output_tokens: number };
}

const CALL_TYPES = ["new_lead", "returning", "complaint", "missed", "spam"];

/** Strict-ish validation so a malformed model reply never reaches the rules engine. */
export function parseFacts(text: string): Facts {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON object in model reply");
  const o = JSON.parse(m[0]);
  if (!CALL_TYPES.includes(o.call_type)) throw new Error(`Bad call_type: ${o.call_type}`);
  for (const k of ["needed_by", "start_by"] as const)
    if (o[k] != null && !/^\d{4}-\d{2}-\d{2}$/.test(o[k])) throw new Error(`Bad date for ${k}: ${o[k]}`);
  for (const k of ["sqft", "rooms_count", "budget_max_inr"] as const)
    if (o[k] != null && typeof o[k] !== "number") throw new Error(`${k} must be a number`);
  return o as Facts;
}

export async function extractFacts(transcript: string, asOfISO: string, opt: ExtractOptions): Promise<ExtractResult> {
  const f = opt.fetchImpl ?? fetch;
  const res = await f("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": opt.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: opt.model ?? "claude-sonnet-5-5",
      max_tokens: 1000,
      temperature: 0,
      system: SYSTEM,
      messages: [{ role: "user", content: `Call date (as_of): ${asOfISO}\n\nTranscript:\n${transcript}` }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const j = await res.json();
  const text = (j.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
  return { facts: parseFacts(text), usage: { input_tokens: j.usage?.input_tokens ?? 0, output_tokens: j.usage?.output_tokens ?? 0 } };
}

/** Split the seed file into { T01: "...", ... }. */
export function splitTranscripts(md: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = md.split(/^(?=T\d{2} · )/m).filter((p) => /^T\d{2} · /.test(p));
  for (const p of parts) out[p.slice(0, 3)] = p.trim();
  return out;
}
