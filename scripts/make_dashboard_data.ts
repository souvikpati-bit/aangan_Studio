// Builds web/data/leads.json: the 20 golden calls (+2 labelled demo cases) run through the real rules engine.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { qualify } from "../engine/qualify.ts";
import type { Facts, ServiceArea, Settings } from "../engine/types.ts";

const load = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const settings: Settings = load("../config/settings.json");
const area: ServiceArea = load("../config/service_area.json");
const fixtures: { id: string; as_of: string; facts: Facts }[] = load("../tests/golden_fixtures.json");

// Display-only details taken from the transcripts. "—" means not captured on the call.
type D = [name: string, calledAt: string, duration: string, summary: string, slot: string | null, mode: string | null, source: string];
const D: Record<string, D> = {
  T01: ["Priya", "2 Sep · 10:23 am", "4 min 12 s", "Wants the whole 3BHK redone (kitchen, living room, both bedrooms). Owner; husband agrees.", "Fri 4 Sep · 6:00 pm", "Site visit", "Referral · Shruti Joshi"],
  T02: ["Name not captured", "3 Sep · 2:41 pm", "5 min 08 s", "Full redesign of a 2BHK. Pushed for a price twice, accepted the standard answer and booked.", "Mon 7 Sep · 11:00 am", "Call", "Instagram"],
  T03: ["Suresh Patil", "3 Sep · 4:15 pm", "2 min 40 s", "Home office and study in Nashik. Outside Pune and PCMC, declined politely.", null, null, "LinkedIn"],
  T04: ["Name not captured", "4 Sep · 11:07 am", "3 min 22 s", "Wanted ideas for colours and furniture only. No execution, declined politely.", null, null, "—"],
  T05: ["Aarti Mehta", "5 Sep · 10:52 am", "6 min 44 s", "Full 4BHK redesign, moving back in by February. Prefers a site visit.", "Tue 8 Sep · 4:00 pm", "Site visit", "Referral · Vikram Agarwal"],
  T06: ["Name not captured", "5 Sep · 3:28 pm", "5 min 01 s", "Startup fitting out a bare-shell 800 sq ft office for 20 people. Founder is the decision-maker.", "Wed 9 Sep · 5:00 pm", "Site visit", "—"],
  T07: ["Name not captured", "8 Sep · 9:44 am", "3 min 15 s", "Wanted living room and kitchen done before Diwali, about 3 weeks. A start after Diwali would work.", null, null, "—"],
  T08: ["Unknown caller", "9 Sep · 10:47 pm", "Missed", "Missed call after hours from the Nanded City area. SMS sent; callback due 8:00 am.", null, null, "—"],
  T09: ["Sheetal Deshpande", "10 Sep · 11:32 am", "5 min 52 s", "Existing client, Viman Nagar 2BHK. Designer Aryan has not replied in five days. Wants a senior person to call back.", null, null, "—"],
  T10: ["Name not captured", "11 Sep · 2:04 pm", "3 min 40 s", "Kitchen and one bedroom in Kharadi with a volunteered budget far below that scope. Declined kindly.", null, null, "—"],
  T11: ["Name not captured", "12 Sep · 10:18 am", "6 min 22 s", "Rented 2BHK in Baner, landlord agrees, no structural change. Living room, bedroom, kitchen.", "Mon 14 Sep · 6:30 pm", "Site visit", "—"],
  T12: ["Anand Sharma", "15 Sep · 10:05 am", "7 min 30 s", "5,500 sq ft villa, new possession, empty. Wants the principal designer on site this week or next.", "Thu 17 Sep · 11:00 am", "Site visit", "—"],
  T13: ["Name not captured", "16 Sep · 12:19 pm", "6 min 08 s", "3BHK in Aundh: kitchen, wardrobes, living room. Asked for a range, accepted the standard answer and booked.", "Sat 19 Sep · 12:00 pm", "Site visit", "—"],
  T14: ["Name not captured (son)", "17 Sep · 11:41 am", "4 min 55 s", "Son calling about his parents' new 3BHK in Hadapsar. Parents decide and will attend the consultation.", "Sun 20 Sep · 11:00 am", "Site visit", "—"],
  T15: ["Smita", "18 Sep · 3:12 pm", "5 min 44 s", "Possession in about six weeks. Wants design to start now; the builder will let them in to see the flat.", "Mon 21 Sep · 5:00 pm", "Site visit", "—"],
  T16: ["Girish Nair", "19 Sep · 10:38 am", "5 min 18 s", "Called Monday, nobody followed up. Frustrated. Handle with care and book directly.", "Sun 20 Sep · 10:00 am", "Site visit", "—"],
  T17: ["Ritu Kapoor", "22 Sep · 2:14 pm", "1 min 12 s + 4 min 30 s", "Line dropped, she called back two minutes later. Merged into one lead. Full-home 3BHK.", "Thu 24 Sep · 6:00 pm", "Site visit", "—"],
  T18: ["Name not captured", "23 Sep · 11:55 am", "3 min 02 s", "180 sq ft coworking pod, below the commercial minimum. Declined politely.", null, null, "—"],
  T19: ["Name not captured", "24 Sep · 4:02 pm", "2 min 50 s", "Restaurant interiors in Koregaon Park. Out of scope, declined politely.", null, null, "—"],
  T20: ["Pooja", "25 Sep · 9:15 am", "4 min 44 s", "2BHK in Magarpatta, January start. Both owners want to attend.", "Tue 29 Sep · 7:00 pm", "Site visit", "—"],
};

// Two labelled demo cases so the Needs-human queue is not empty (the golden set has none).
const demos: { id: string; as_of: string; facts: Facts; d: D }[] = [
  { id: "DEMO-1", as_of: "2026-09-26",
    facts: { call_type: "new_lead", wants_execution: true, property_type: "home", locality: "Baner", scope_kind: "partial", rooms_count: 2, needed_by: "2026-11-10", decision_maker: "yes" },
    d: ["Demo caller A", "26 Sep · 1:10 pm", "4 min 05 s", "DEMO: needs two rooms done in about 6.5 weeks. The designer should judge whether that is feasible.", null, null, "—"] },
  { id: "DEMO-2", as_of: "2026-09-26",
    facts: { call_type: "new_lead", wants_execution: true, property_type: "home", locality: null, key_facts_missing: true },
    d: ["Demo caller B", "26 Sep · 8:40 pm", "0 min 48 s", "DEMO: caller hung up before locality and scope were captured. Callback needed.", null, null, "—"] },
];

const all = [
  ...fixtures.map((f) => ({ id: f.id, as_of: f.as_of, facts: f.facts, d: D[f.id], demo: false })),
  ...demos.map((x) => ({ ...x, demo: true })),
];

const yn = (v: unknown) => v !== null && v !== undefined;
const leads = all.map((x, i) => {
  const r = qualify(x.facts, new Date(x.as_of), settings, area);
  const f = x.facts;
  const [name, calledAt, duration, summary, slot, mode, source] = x.d;
  const asked: string[] = [];
  if (!name.startsWith("Name not") && !name.startsWith("Unknown") && !name.startsWith("Demo")) asked.push("Name");
  if (yn(f.locality)) asked.push("Locality");
  if (yn(f.sqft)) asked.push("Size");
  if (yn(f.scope_kind) && f.scope_kind !== "unknown") asked.push("Scope");
  if (yn(f.needed_by) || yn(f.start_by)) asked.push("Timeline");
  if (yn(f.decision_maker)) asked.push("Decision-maker");
  return {
    id: x.id, demo: x.demo, order: i,
    name, phone: `+91 98•••• ••${String(10 + i).padStart(2, "0")}`, calledAt, duration, summary, source, slot, mode,
    verdict: r.verdict, reason: r.reason, score: r.score, flags: r.flags, notes: r.notes, question: r.question ?? null,
    criteria: r.criteria,
    property: [f.locality, f.sqft ? `${f.sqft.toLocaleString("en-IN")} sq ft` : null, f.property_type].filter(Boolean).join(" · ") || "Details not captured",
    asked,
    status: "New",
    priceAsked: !!f.price_asked,
    followUpNote: f.follow_up_note ?? null,
    escalation: r.verdict === "Escalate" ? { promiseMinutes: 15, startedAgoMinutes: 4 } : null,
  };
});

mkdirSync(new URL("../web/data/", import.meta.url), { recursive: true });
writeFileSync(new URL("../web/data/leads.json", import.meta.url), JSON.stringify(leads, null, 1));
console.log(`wrote ${leads.length} leads`);
