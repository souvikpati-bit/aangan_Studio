// Designer emails through Resend. If the key or address is missing, nothing is sent and the reason is returned (never thrown).
export interface BriefLead {
  ref: string; name: string; phone: string; property: string; verdict: string; reason: string;
  flags: string[]; notes: string[]; asked: string[]; summary: string; source: string; priceAsked: boolean;
  question?: string | null; slot?: string | null; url: string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function briefSubject(l: BriefLead): string {
  const tag = l.verdict === "Escalate" ? "ESCALATION" : l.verdict;
  return `[${tag}] ${l.name} · ${l.property}`;
}

export function briefText(l: BriefLead): string {
  return [
    `${l.verdict}: ${l.name} (${l.phone})`,
    l.property,
    `Why: ${l.reason}`,
    l.slot ? `Booked: ${l.slot}` : "",
    l.priceAsked ? "They asked about price. Do not quote before the consultation." : "",
    l.flags.length ? `Flags: ${l.flags.join(", ")}` : "",
    l.notes.length ? `Notes: ${l.notes.join(" | ")}` : "",
    l.question ? `Ask the caller: ${l.question}` : "",
    `Source: ${l.source}`,
    `Already asked (do not repeat): ${l.asked.join(", ") || "nothing captured"}`,
    "",
    l.summary,
    "",
    `Open the card: ${l.url}`,
  ].filter((x) => x !== "").join("\n");
}

export function briefHtml(l: BriefLead): string {
  const row = (k: string, v: string) => `<tr><td style="padding:6px 16px 6px 0;color:#6b635a;vertical-align:top">${k}</td><td style="padding:6px 0">${esc(v)}</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#f6f2ec;font-family:Inter,Arial,sans-serif;color:#2a2622">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
<p style="letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:#6b635a;margin:0 0 8px">Aangan Studio · new enquiry</p>
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:30px;margin:0 0 4px">${esc(l.name)}</h1>
<p style="margin:0 0 20px;color:#6b635a">${esc(l.property)}</p>
<div style="background:#fbf9f5;border:1px solid #e3dcd1;border-radius:16px;padding:20px">
<p style="margin:0 0 12px"><b style="color:#2f4a3c">${esc(l.verdict)}</b> · ${esc(l.reason)}</p>
<table style="font-size:14px;border-collapse:collapse">
${row("Phone", l.phone)}${l.slot ? row("Booked", l.slot) : ""}${row("Source", l.source)}
${l.flags.length ? row("Flags", l.flags.join(", ")) : ""}${l.priceAsked ? row("Price", "Asked. Do not quote before the consultation.") : ""}
${l.notes.length ? row("Notes", l.notes.join(" | ")) : ""}${l.question ? row("Ask the caller", l.question) : ""}
${row("Already asked", l.asked.join(", ") || "nothing captured")}
</table>
<p style="font-size:14px;margin:16px 0 0">${esc(l.summary)}</p></div>
<p style="margin:20px 0"><a href="${esc(l.url)}" style="background:#2f4a3c;color:#f6f2ec;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px">Open the card</a></p>
</div></body></html>`;
}

export async function sendEmail(to: string | undefined, subject: string, html: string, text: string): Promise<{ sent: boolean; reason?: string; id?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "RESEND_API_KEY is not set" };
  if (!to) return { sent: false, reason: "DESIGNER_EMAIL is not set" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || "onboarding@resend.dev", to: [to], subject, html, text }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { sent: false, reason: `Resend ${r.status}: ${j.message ?? "error"}` };
    return { sent: true, id: j.id };
  } catch (e) {
    return { sent: false, reason: (e as Error).message };
  }
}
