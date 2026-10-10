import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { qualify } from "../engine/qualify.ts";
import { groupCalls } from "../engine/dedupe.ts";
import type { Facts, ServiceArea, Settings } from "../engine/types.ts";

const load = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const settings: Settings = load("../config/settings.json");
const area: ServiceArea = load("../config/service_area.json");
const fixtures: { id: string; as_of: string; expect: string; expect_flags: string[]; facts: Facts }[] = load("./golden_fixtures.json");

for (const fx of fixtures) {
  test(`${fx.id} -> ${fx.expect}`, () => {
    const r = qualify(fx.facts, new Date(fx.as_of), settings, area);
    assert.equal(r.verdict, fx.expect, `${r.verdict}: ${r.reason}`);
    for (const f of fx.expect_flags) assert.ok(r.flags.includes(f), `missing flag ${f}; got ${r.flags}`);
  });
}

test("golden totals: 12 Qualified, 6 Not qualified, 1 Escalate, 1 Missed", () => {
  const counts: Record<string, number> = {};
  for (const fx of fixtures) {
    const v = qualify(fx.facts, new Date(fx.as_of), settings, area).verdict;
    counts[v] = (counts[v] ?? 0) + 1;
  }
  assert.deepEqual(counts, { Qualified: 12, "Not qualified": 6, Escalate: 1, Missed: 1 });
});

// Timeline edge cases measured from as_of (exactly 5, 6, 8, 12 weeks)
const base: Facts = { call_type: "new_lead", wants_execution: true, property_type: "home", locality: "Baner", scope_kind: "full_home", sqft: 1000, decision_maker: "yes" };
const asOf = new Date("2026-09-01");
const plusWeeks = (w: number) => new Date(asOf.getTime() + w * 7 * 86_400_000).toISOString().slice(0, 10);
for (const [w, verdict, flag] of [[5, "Not qualified", null], [6, "Needs human", null], [8, "Qualified", "tight_timeline"], [12, "Qualified", null]] as const) {
  test(`timeline ${w} weeks -> ${verdict}`, () => {
    const r = qualify({ ...base, needed_by: plusWeeks(w) }, asOf, settings, area);
    assert.equal(r.verdict, verdict);
    if (flag) assert.ok(r.flags.includes(flag));
    else assert.ok(!r.flags.includes("tight_timeline"));
  });
}

test("low-confidence fail goes to Needs human, not declined", () => {
  const r = qualify({ ...base, locality: "Nashik", conf: { c2: 0.6 } }, asOf, settings, area);
  assert.equal(r.verdict, "Needs human");
});

test("budget: volunteered number with unclear scope is not decided", () => {
  const r = qualify({ ...base, scope_kind: "unknown", sqft: null, budget_max_inr: 100000 }, asOf, settings, area);
  assert.equal(r.criteria.c4.result, "unclear");
  assert.equal(r.verdict, "Qualified");
});

test("price asked alone never disqualifies", () => {
  assert.equal(qualify({ ...base, price_asked: true }, asOf, settings, area).verdict, "Qualified");
});

test("T17: dropped call then complete call merge into one lead", () => {
  const g = groupCalls(
    [
      { id: "a", phone: "+919800000001", started_at: "2026-09-22T08:44:00Z", ended_at: "2026-09-22T08:45:12Z", complete: false },
      { id: "b", phone: "+919800000001", started_at: "2026-09-22T08:46:00Z", complete: true },
    ], 24, 10);
  assert.deepEqual(g, [["a", "b"]]);
});

test("withheld numbers never merge", () => {
  const g = groupCalls(
    [
      { id: "a", phone: null, started_at: "2026-09-22T08:44:00Z", complete: false },
      { id: "b", phone: null, started_at: "2026-09-22T08:46:00Z", complete: true },
    ], 24, 10);
  assert.equal(g.length, 2);
});

// A garbled neighbourhood must not block a caller who clearly said they are in Pune (found on a real call: "Hindu border" for Hinjewadi).
test("unrecognised locality + city Pune -> Qualified with adjoining_area flag and a note to confirm", () => {
  const r = qualify({ ...base, locality: "Hindu border", city: "Pune" }, asOf, settings, area);
  assert.equal(r.verdict, "Qualified");
  assert.ok(r.flags.includes("adjoining_area"));
  assert.ok(r.notes.some((n) => n.includes("Hindu border")));
});

test("no locality but city Pune -> Qualified with flag; no city at all -> still Needs human", () => {
  assert.equal(qualify({ ...base, locality: null, city: "Pune" }, asOf, settings, area).verdict, "Qualified");
  assert.equal(qualify({ ...base, locality: null, city: null }, asOf, settings, area).verdict, "Needs human");
});

test("city outside the service area is declined even when the neighbourhood is unknown", () => {
  assert.equal(qualify({ ...base, locality: null, city: "Nashik" }, asOf, settings, area).verdict, "Not qualified");
});
