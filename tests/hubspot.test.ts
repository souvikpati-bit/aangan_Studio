import { test } from "node:test";
import assert from "node:assert/strict";
import { stageForStatus, syncLead, updateDeal, STAGES, type HsLead } from "../web/lib/hubspot.ts";

type Call = { method: string; path: string; body: any };
function mock(existingContact?: string) {
  const calls: Call[] = [];
  const f = (async (url: string, init: { method: string; body?: string; headers: Record<string, string> }) => {
    const path = url.replace("https://api.hubapi.com", "");
    calls.push({ method: init.method, path, body: init.body ? JSON.parse(init.body) : undefined });
    assert.equal(init.headers.Authorization, "Bearer tok");
    let out: unknown = {};
    if (path.endsWith("/contacts/search")) out = { results: existingContact ? [{ id: existingContact }] : [] };
    else if (init.method === "POST" && path.endsWith("/contacts")) out = { id: "c1" };
    else if (init.method === "POST" && path.endsWith("/deals")) out = { id: "d1" };
    else if (init.method === "POST" && path.endsWith("/notes")) out = { id: "n1" };
    return new Response(JSON.stringify(out), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, calls };
}
const lead: HsLead = { ref: "L1", name: "Priya Kulkarni", phone: "+919800000001", locality: "Kothrud", property: "Kothrud · 1,400 sq ft · home", verdict: "Qualified", reason: "All five criteria pass", summary: "Full home.", flags: ["VIP"], hasMeeting: true };

test("Qualified lead: contact + deal at Meeting booked + note, deal linked to contact", async () => {
  const { f, calls } = mock();
  const r = await syncLead("tok", lead, f);
  assert.deepEqual(r, { contactId: "c1", dealId: "d1", noteId: "n1" });
  const deal = calls.find((c) => c.path === "/crm/v3/objects/deals")!;
  assert.equal(deal.body.properties.dealstage, STAGES.meeting_booked);
  assert.equal(deal.body.properties.pipeline, "default");
  assert.ok(calls.some((c) => c.method === "PUT" && c.path === "/crm/v4/objects/deals/d1/associations/default/contacts/c1"));
});

test("Qualified lead with no booked slot starts at Qualified", async () => {
  const { f, calls } = mock();
  await syncLead("tok", { ...lead, hasMeeting: false }, f);
  assert.equal(calls.find((c) => c.path === "/crm/v3/objects/deals")!.body.properties.dealstage, STAGES.qualified);
});

test("Not-qualified lead: contact + note with the reason, and NO deal", async () => {
  const { f, calls } = mock();
  const r = await syncLead("tok", { ...lead, verdict: "Not qualified", reason: "Outside Pune/PCMC (Nashik)" }, f);
  assert.equal(r.dealId, undefined);
  assert.ok(!calls.some((c) => c.path.includes("/deals")));
  assert.ok(calls.find((c) => c.path === "/crm/v3/objects/notes")!.body.properties.hs_note_body.includes("Nashik"));
});

test("an existing contact (same phone) is updated, not duplicated", async () => {
  const { f, calls } = mock("c9");
  const r = await syncLead("tok", lead, f);
  assert.equal(r.contactId, "c9");
  assert.ok(calls.some((c) => c.method === "PATCH" && c.path === "/crm/v3/objects/contacts/c9"));
  assert.ok(!calls.some((c) => c.method === "POST" && c.path === "/crm/v3/objects/contacts"));
});

test("an unnamed caller without a number still syncs", async () => {
  const { f, calls } = mock();
  await syncLead("tok", { ...lead, name: "Name not captured", phone: null }, f);
  assert.ok(!calls.some((c) => c.path.endsWith("/search")));
  assert.equal(calls.find((c) => c.path === "/crm/v3/objects/contacts")!.body.properties.firstname, "Caller");
});

test("designer actions move the deal: Won sets the final value, Lost closes it", async () => {
  assert.equal(stageForStatus("Won", true), STAGES.won);
  assert.equal(stageForStatus("Lost", false), STAGES.lost);
  assert.equal(stageForStatus("Meeting held", true), STAGES.proposal);
  const { f, calls } = mock();
  await updateDeal("tok", "d1", "Won", true, 1_200_000, f);
  assert.deepEqual(calls[0].body.properties, { dealstage: "closedwon", amount: "1200000" });
});

test("a HubSpot error is raised with its status so the caller can log it", async () => {
  const bad = (async () => new Response(JSON.stringify({ message: "bad token" }), { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(() => syncLead("tok", lead, bad), /401.*bad token/);
});
