import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPrompt, PRICE_LINE, DECLINE_LINES } from "../agent/prompt.ts";
import { findPriceLeaks } from "../agent/priceGuard.ts";
import { DEFAULT_BOOKING, findSlots, isFree } from "../booking/slots.ts";

const NOW = new Date("2026-09-08T05:00:00Z"); // Tue 8 Sep 2026, 10:30 IST

test("the approved price line and decline lines are leak-free", () => {
  for (const s of [PRICE_LINE, ...Object.values(DECLINE_LINES)]) assert.deepEqual(findPriceLeaks(s), [], s);
});

test("the whole agent prompt is leak-free and holds the exact price line", () => {
  const p = buildPrompt(NOW);
  assert.deepEqual(findPriceLeaks(p), []);
  assert.ok(p.includes(PRICE_LINE));
  assert.ok(p.includes("Tuesday") && p.includes("2026"));
});

test("the prompt never contains any text from pricing.md", () => {
  const pricing = readFileSync(new URL("../seed/pricing.md", import.meta.url), "utf8");
  const p = buildPrompt(NOW);
  for (const row of pricing.match(/₹[\d,]+[^|\n]*/g) ?? []) assert.ok(!p.includes(row.trim()), row);
});

test("price guard catches every kind of leak", () => {
  for (const bad of [
    "It's around 15 lakh", "roughly ₹2,000 per sq ft", "Rs 8 lakh", "starts at 1,800", "about 3x more",
    "for a 2BHK it's typically 12 lakhs", "premium is 2400 a foot", "3.5 lakh per room", "two crore",
  ]) assert.notEqual(findPriceLeaks(bad).length, 0, bad);
});

test("price guard lets normal booking sentences through", () => {
  for (const ok of ["Tuesday 15 September at 6 PM, site visit in Baner.", "Your 2BHK in Wakad, about 950 sq ft.", "I'll call you back within 15 minutes."])
    assert.deepEqual(findPriceLeaks(ok), [], ok);
});

test("never books in the past or inside the minimum notice", () => {
  assert.equal(isFree(new Date("2026-09-08T04:00:00Z"), "call", [], DEFAULT_BOOKING, NOW), false); // past
  assert.equal(isFree(new Date("2026-09-08T08:00:00Z"), "call", [], DEFAULT_BOOKING, NOW), false); // 13:30 IST, < 4h notice
});

test("respects bookable hours (Sunday ends 2 PM, no late-night slots)", () => {
  const sunday = new Date("2026-09-13T09:00:00Z"); // 14:30 IST Sunday
  assert.equal(isFree(sunday, "call", [], DEFAULT_BOOKING, NOW), false);
  assert.equal(isFree(new Date("2026-09-09T17:00:00Z"), "call", [], DEFAULT_BOOKING, NOW), false); // 22:30 IST
});

test("a busy event blocks the slot and a site visit also needs the travel buffer", () => {
  const busy = [{ start: new Date("2026-09-09T06:30:00Z"), end: new Date("2026-09-09T07:30:00Z") }]; // 12:00-13:00 IST
  assert.equal(isFree(new Date("2026-09-09T06:30:00Z"), "call", busy, DEFAULT_BOOKING, NOW), false);
  assert.equal(isFree(new Date("2026-09-09T07:30:00Z"), "call", busy, DEFAULT_BOOKING, NOW), true); // call: no buffer
  assert.equal(isFree(new Date("2026-09-09T07:30:00Z"), "site_visit", busy, DEFAULT_BOOKING, NOW), false); // needs 45 min buffer
});

test("findSlots returns the 3 closest free slots to the preferred time, in order", () => {
  const pref = new Date("2026-09-10T12:30:00Z"); // Thu 18:00 IST
  const busy = [{ start: pref, end: new Date(pref.getTime() + 3_600_000) }];
  const s = findSlots(pref, "call", busy, DEFAULT_BOOKING, NOW);
  assert.equal(s.length, 3);
  assert.ok(s.every((t, i) => i === 0 || +t > +s[i - 1]));
  assert.ok(s.every((t) => isFree(t, "call", busy, DEFAULT_BOOKING, NOW)));
});

test("blocked days (leave) are never offered", () => {
  const cfg = { ...DEFAULT_BOOKING, blockedDays: ["2026-09-10"] };
  const s = findSlots(new Date("2026-09-10T12:30:00Z"), "call", [], cfg, NOW);
  assert.ok(s.every((t) => new Date(t.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10) !== "2026-09-10"));
});
