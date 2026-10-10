import type { Criterion, Facts, Qualification, Result, ServiceArea, Settings } from "./types.ts";

const DAY_MS = 86_400_000;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
const crit = (result: Result, note: string, confidence = 0.9): Criterion => ({ result, note, confidence });

/** Whole-day difference converted to weeks, measured from the call date (as_of), never "today". */
export function weeksBetween(asOf: Date, target: Date): number {
  return (target.getTime() - asOf.getTime()) / DAY_MS / 7;
}

function localityClass(locality: string | null | undefined, area: ServiceArea): "listed" | "adjoining" | "outside" | "unknown" {
  if (!locality) return "unknown";
  const l = norm(locality);
  const has = (list: string[]) => list.some((x) => l.includes(x));
  if (has(area.outside)) return "outside";
  if (has(area.pune_city) || has(area.pcmc)) return "listed";
  if (has(area.adjoining_unlisted_but_in_pune)) return "adjoining";
  return "unknown";
}

/** Backend-only budget floor for the stated scope. Never spoken to a caller. */
export function budgetFloor(f: Facts, s: Settings): number | null {
  if (f.property_type === "office") return f.sqft ? f.sqft * s.budget.commercial_floor_per_sqft_inr : null;
  if (f.scope_kind === "full_home") return f.sqft ? f.sqft * s.budget.full_home_floor_per_sqft_inr : null;
  if (f.rooms_count) return f.rooms_count * s.budget.per_room_floor_inr;
  return null;
}

export function qualify(f: Facts, asOf: Date, s: Settings, area: ServiceArea): Qualification {
  const flags: string[] = [];
  const notes: string[] = [];
  const conf = (k: "c1" | "c2" | "c3" | "c4" | "c5") => f.conf?.[k] ?? 0.9;
  if (f.price_asked) flags.push("price_asked");
  if (f.service_recovery) flags.push("service_recovery");
  if (f.referrer && s.flags.vip_referrers.some((v) => norm(v) === norm(f.referrer!))) flags.push("VIP");
  if ((f.sqft ?? 0) > s.flags.high_value_sqft || f.home_kind === "villa") flags.push("high_value");

  const empty = (c: Result): Qualification["criteria"] => ({
    c1: crit(c, "n/a"), c2: crit(c, "n/a"), c3: crit(c, "n/a"), c4: crit(c, "n/a"), c5: crit(c, "n/a"),
  });
  const base = { flags, notes, weeks_to_deadline: null as number | null };

  // Rule 1 (and non-leads): call type decides first.
  if (f.call_type === "complaint")
    return { ...base, verdict: "Escalate", reason: "Existing client complaint - not a lead", score: null, criteria: empty("unclear") };
  if (f.call_type === "missed")
    return { ...base, verdict: "Missed", reason: "Missed/dropped call - SMS + callback, no verdict yet", score: null, criteria: empty("unclear") };
  if (f.call_type === "spam")
    return { ...base, verdict: "Closed", reason: "Wrong number / vendor / spam", score: null, criteria: empty("unclear") };

  // C1 real project
  let c1: Criterion;
  if (f.wants_execution === false) c1 = crit("fail", "Advice only, no execution", conf("c1"));
  else if (f.wants_execution === true) c1 = crit("pass", "Wants design + execution", conf("c1"));
  else c1 = crit("unclear", "Unclear if execution is wanted", conf("c1"));

  // C2 service area + project type + commercial size
  let c2: Criterion;
  const loc = localityClass(f.locality, area);
  if (f.property_type && s.commercial.out_of_scope_types.includes(f.property_type))
    c2 = crit("fail", `${f.property_type} projects are out of scope`, conf("c2"));
  else if (loc === "outside") c2 = crit("fail", `Outside Pune/PCMC (${f.locality})`, conf("c2"));
  else if (f.property_type === "office" && f.sqft != null && f.sqft < s.commercial.min_sqft)
    c2 = crit("fail", `Commercial ${f.sqft} sq ft is below the ${s.commercial.min_sqft} sq ft minimum`, conf("c2"));
  else if (f.property_type === "office" && f.sqft != null && f.sqft > s.commercial.max_sqft)
    c2 = crit("fail", `Commercial ${f.sqft} sq ft is above ~${s.commercial.max_sqft} sq ft`, Math.min(conf("c2"), 0.7));
  else if (loc === "listed") c2 = crit("pass", `In service area (${f.locality})`, conf("c2"));
  else if (loc === "adjoining") {
    c2 = crit("pass", `${f.locality} is in Pune but not on the list (adjoining area)`, conf("c2"));
    flags.push("adjoining_area");
  } else c2 = crit("unclear", "Locality not captured or not recognised", conf("c2"));

  // C3 timeline, measured from as_of
  let c3: Criterion;
  let weeks: number | null = null;
  if (f.needed_by) {
    weeks = weeksBetween(asOf, new Date(f.needed_by));
    if (weeks < s.timeline.fail_under_weeks)
      c3 = crit("fail", `Needs it in ${weeks.toFixed(1)} weeks (< ${s.timeline.fail_under_weeks})`, conf("c3"));
    else if (weeks < s.timeline.human_under_weeks)
      c3 = crit("unclear", `${weeks.toFixed(1)} weeks - designer to judge feasibility`, conf("c3"));
    else {
      c3 = crit("pass", `${weeks.toFixed(1)} weeks available`, conf("c3"));
      if (weeks < s.timeline.tight_under_weeks) flags.push("tight_timeline");
    }
  } else c3 = crit("pass", "No completion date given (start date or 'design now')", conf("c3"));
  if (f.follow_up) {
    flags.push("follow_up");
    if (f.follow_up_note) notes.push(f.follow_up_note);
  }

  // C4 budget (only if volunteered)
  let c4: Criterion;
  if (f.budget_max_inr == null) c4 = crit("pass", "Budget not mentioned - treated as pass", conf("c4"));
  else {
    const floor = budgetFloor(f, s);
    if (floor == null) c4 = crit("unclear", "Budget given but scope unclear - ask a scope question, not about money", conf("c4"));
    else if (f.budget_max_inr < floor * s.budget.clear_fail_fraction_of_floor)
      c4 = crit("fail", "Volunteered budget is significantly below what a project of that scope would cost with us", conf("c4"));
    else c4 = crit("pass", "Volunteered budget not clearly misaligned", conf("c4"));
  }

  // C5 decision-maker
  let c5: Criterion;
  if (f.decision_maker === "yes" || f.decision_maker === "authorised") c5 = crit("pass", f.decision_maker_note ?? "Decision-maker confirmed", conf("c5"));
  else {
    c5 = crit("unclear", f.decision_maker_note ?? "Decision-maker not clear", conf("c5"));
    notes.push(f.decision_maker_note ?? "Decision-maker unclear - designer to confirm");
  }

  const criteria = { c1, c2, c3, c4, c5 };
  const list = [c1, c2, c3, c4, c5];
  const pts = (r: Result) => s.score[r];
  const score = list.reduce((n, c) => n + pts(c.result), 0);
  const out = (verdict: Qualification["verdict"], reason: string, question?: string): Qualification => ({
    verdict, reason, score, criteria, flags, notes, weeks_to_deadline: weeks, ...(question ? { question } : {}),
  });

  // Rule 2: clear fail on 1-4. Low confidence -> human (a good lead rejected costs far more).
  const names = { c1: "Real project", c2: "Service area", c3: "Timeline", c4: "Budget" } as const;
  for (const k of ["c1", "c2", "c3", "c4"] as const) {
    const c = criteria[k];
    if (c.result === "fail") {
      if (c.confidence < s.confidence.min_to_decline)
        return out("Needs human", `${names[k]}: likely fail but confidence ${c.confidence} < ${s.confidence.min_to_decline} - ${c.note}`);
      return out("Not qualified", `${names[k]}: ${c.note}`);
    }
  }
  // Rule 5: other human-needed cases
  if (f.key_facts_missing) return out("Needs human", "Caller hung up before key facts were captured");
  if (f.angry_or_bad_line) return out("Needs human", "Abusive/very upset caller or poor line");
  // Rule 4: unclear on 1-3 -> one direct question, then human
  const qs: Record<string, string> = {
    c1: "Are you looking for design together with execution of the work?",
    c2: "Which area or locality is the property in?",
    c3: "When would you need the project complete?",
  };
  for (const k of ["c1", "c2", "c3"] as const) {
    if (criteria[k].result === "unclear") return out("Needs human", `${names[k]} unclear: ${criteria[k].note}`, qs[k]);
  }
  // Rule 3 + 6: 4/5 unclear still qualifies, uncertainty written to the handoff note
  if (c4.result === "unclear") notes.push(c4.note);
  return out("Qualified", "All five criteria pass or are unclear only on budget/decision-maker");
}
