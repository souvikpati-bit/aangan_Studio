// Live HubSpot check: creates a sample contact + deal + note, verifies them, then deletes them. Prints no secrets.
import { ping, syncLead } from "../web/lib/hubspot.ts";

const token = process.env.HUBSPOT_TOKEN;
if (!token) throw new Error("HUBSPOT_TOKEN is not set in .env");
const H = { Authorization: `Bearer ${token}`, "content-type": "application/json" };
const api = async (method: string, path: string, body?: unknown) => {
  const r = await fetch("https://api.hubapi.com" + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  return { status: r.status, json: t ? JSON.parse(t) : {} };
};

console.log("token works (read contacts):", await ping(token));

const phone = "+919000000" + String(Date.now()).slice(-3);
const r = await syncLead(token, {
  ref: "TEST", name: "Aangan Test Caller", phone, locality: "Kothrud", property: "Kothrud · 1,400 sq ft · home",
  verdict: "Qualified", reason: "Live integration test (safe to delete)", summary: "Created by the Aangan integration test.", flags: ["test"], hasMeeting: true,
});
console.log("created:", r);

const deal = await api("GET", `/crm/v3/objects/deals/${r.dealId}?properties=dealname,dealstage,pipeline&associations=contacts`);
console.log("deal:", deal.status, deal.json.properties?.dealname, "| stage:", deal.json.properties?.dealstage, "| linked contacts:", deal.json.associations?.contacts?.results?.length ?? 0);
const note = await api("GET", `/crm/v3/objects/notes/${r.noteId}?properties=hs_note_body&associations=contacts`);
console.log("note:", note.status, "| on contact:", note.json.associations?.contacts?.results?.[0]?.id === r.contactId);

// second call with the same number must reuse the contact (HubSpot search needs a few seconds to index a new contact)
await new Promise((res) => setTimeout(res, 15000));
const again = await syncLead(token, { ref: "TEST", name: "Aangan Test Caller", phone, locality: "Kothrud", property: "x", verdict: "Not qualified", reason: "repeat call", summary: "", flags: [] });
console.log("same number reuses contact:", again.contactId === r.contactId);

// stage move
const { updateDeal } = await import("../web/lib/hubspot.ts");
await updateDeal(token, r.dealId!, "Won", true, 1200000);
const won = await api("GET", `/crm/v3/objects/deals/${r.dealId}?properties=dealstage,amount`);
console.log("after Won:", won.json.properties?.dealstage, won.json.properties?.amount);

// clean up everything this test created
for (const [kind, id] of [["notes", r.noteId], ["notes", again.noteId], ["deals", r.dealId], ["contacts", r.contactId]] as const) {
  if (id) console.log("deleted", kind, (await api("DELETE", `/crm/v3/objects/${kind}/${id}`)).status);
}
