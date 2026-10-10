// HubSpot sync. Pure (fetch only) so it can be tested with a mock. Every caller treats failure as non-fatal: the lead is already saved.
const API = "https://api.hubapi.com";

// Aangan stages -> HubSpot's default Sales Pipeline stage ids. Override with HUBSPOT_STAGE_* env vars if you build a custom pipeline.
export const STAGES = {
  new_enquiry: "appointmentscheduled",
  qualified: "qualifiedtobuy",
  meeting_booked: "presentationscheduled",
  proposal: "contractsent",
  won: "closedwon",
  lost: "closedlost",
} as const;

export function stageForStatus(status: string, hasMeeting: boolean): string {
  if (status === "Won") return STAGES.won;
  if (status === "Lost") return STAGES.lost;
  if (status === "Meeting held") return STAGES.proposal;
  return hasMeeting ? STAGES.meeting_booked : STAGES.qualified;
}

export interface HsLead {
  ref: string; name: string; phone: string | null; locality: string | null; property: string;
  verdict: string; reason: string; summary: string; flags: string[]; dealValueInr?: number | null; hasMeeting?: boolean;
}
export interface HsResult { contactId: string; dealId?: string; noteId?: string }

type F = typeof fetch;
async function hs(f: F, token: string, method: string, path: string, body?: unknown) {
  const r = await f(API + path, {
    method, headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  const json = text ? JSON.parse(text) : {};
  if (!r.ok) throw new Error(`HubSpot ${method} ${path} -> ${r.status}: ${json.message ?? text.slice(0, 160)}`);
  return json;
}

export async function syncLead(token: string, l: HsLead, f: F = fetch): Promise<HsResult> {
  const [first, ...rest] = (l.name === "Name not captured" ? `Caller ${l.ref}` : l.name).split(" ");
  const props: Record<string, string> = { firstname: first, lastname: rest.join(" "), lifecyclestage: l.verdict === "Qualified" ? "opportunity" : "lead" };
  if (l.phone) props.phone = l.phone;
  if (l.locality) props.city = l.locality;

  // Contact: reuse by phone number, otherwise create.
  let contactId: string | undefined;
  if (l.phone) {
    const found = await hs(f, token, "POST", "/crm/v3/objects/contacts/search", {
      filterGroups: [{ filters: [{ propertyName: "phone", operator: "EQ", value: l.phone }] }], limit: 1,
    });
    contactId = found.results?.[0]?.id;
  }
  if (contactId) await hs(f, token, "PATCH", `/crm/v3/objects/contacts/${contactId}`, { properties: props });
  else contactId = (await hs(f, token, "POST", "/crm/v3/objects/contacts", { properties: props })).id as string;

  const out: HsResult = { contactId: contactId! };

  // Deal: only for Qualified leads, starting at "Qualified" (or "Meeting booked" if a slot exists).
  if (l.verdict === "Qualified") {
    const deal = await hs(f, token, "POST", "/crm/v3/objects/deals", {
      properties: {
        dealname: `${l.name === "Name not captured" ? `Caller ${l.ref}` : l.name} · ${l.property}`,
        pipeline: "default", dealstage: stageForStatus("New", !!l.hasMeeting),
        ...(l.dealValueInr ? { amount: String(l.dealValueInr) } : {}),
      },
    });
    out.dealId = deal.id;
    await hs(f, token, "PUT", `/crm/v4/objects/deals/${deal.id}/associations/default/contacts/${contactId}`);
  }

  // Note on the contact: verdict, reason and summary, so a person can follow up (this is how Not-qualified callers are kept).
  const note = await hs(f, token, "POST", "/crm/v3/objects/notes", {
    properties: {
      hs_timestamp: new Date().toISOString(),
      hs_note_body: `<b>${l.verdict}</b>: ${l.reason}<br>${l.property}<br>${l.flags.length ? "Flags: " + l.flags.join(", ") + "<br>" : ""}${l.summary}`,
    },
    associations: [{ to: { id: contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }] }],
  });
  out.noteId = note.id;
  return out;
}

/** Move an existing deal when a designer marks the lead Meeting held / Won / Lost, and record the final value. */
export async function updateDeal(token: string, dealId: string, status: string, hasMeeting: boolean, amountInr?: number | null, f: F = fetch) {
  await hs(f, token, "PATCH", `/crm/v3/objects/deals/${dealId}`, {
    properties: { dealstage: stageForStatus(status, hasMeeting), ...(amountInr ? { amount: String(amountInr) } : {}) },
  });
}

export async function ping(token: string, f: F = fetch): Promise<boolean> {
  await hs(f, token, "GET", "/crm/v3/objects/contacts?limit=1");
  return true;
}
