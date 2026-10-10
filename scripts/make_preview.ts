// Builds design/preview.html: every golden call, run through the real rules engine.
import { readFileSync, writeFileSync } from "node:fs";
import { qualify } from "../engine/qualify.ts";
import type { Facts, ServiceArea, Settings } from "../engine/types.ts";

const load = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const settings: Settings = load("../config/settings.json");
const area: ServiceArea = load("../config/service_area.json");
const fx: { id: string; as_of: string; facts: Facts }[] = load("../tests/golden_fixtures.json");

const cls: Record<string, string> = { Qualified: "ok", "Not qualified": "declined", "Needs human": "human", Escalate: "esc", Missed: "human", Closed: "declined" };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const icon = { pass: "✓", fail: "✕", unclear: "?" } as const;

const cards = fx.map((f) => {
  const r = qualify(f.facts, new Date(f.as_of), settings, area);
  const where = [f.facts.locality, f.facts.sqft ? `${f.facts.sqft} sq ft` : null, f.facts.property_type].filter(Boolean).join(" · ") || "details not captured";
  const checks = (["c1", "c2", "c3", "c4", "c5"] as const)
    .map((k, i) => `<span class="chk ${r.criteria[k].result}" title="${esc(r.criteria[k].note)}">${i + 1} ${icon[r.criteria[k].result]}</span>`).join("");
  return `<article class="card"><header><div><h3>${f.id} <small>${f.as_of}</small></h3><p class="meta">${esc(where)}</p></div><span class="pill ${cls[r.verdict]}">${r.verdict}</span></header>
<p>${esc(r.reason)}</p><div class="tags">${checks}${r.flags.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div>
${r.notes.length ? `<p class="meta">Note: ${esc(r.notes.join(" · "))}</p>` : ""}</article>`;
});

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aangan Engine Preview</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#F6F2EC;--surface:#FBF9F5;--ink:#2A2622;--ink-2:#6B635A;--line:#E3DCD1;--ok:#4F7A5E;--ok-bg:#E6EEE7;--human:#9A6B1F;--human-bg:#F3E8D2;--declined:#6B635A;--declined-bg:#ECE7DF;--esc:#A4492F;--esc-bg:#F4E1DA}
@media(prefers-color-scheme:dark){:root{--bg:#1B1815;--surface:#23201C;--ink:#F1ECE4;--ink-2:#A79F94;--line:#38332D;--ok:#8DB5A0;--ok-bg:#26332B;--human:#D9AE63;--human-bg:#3A2F1B;--declined:#A79F94;--declined-bg:#2E2A25;--esc:#E08B72;--esc-bg:#3F2620}}
*{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--ink);font:400 15px/1.6 Inter,sans-serif;padding:40px 16px}
main{max-width:1000px;margin:0 auto}h1{font:400 40px Fraunces,serif;margin-bottom:8px}.sub{color:var(--ink-2);margin-bottom:32px;max-width:60ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:20px;display:grid;gap:12px;box-shadow:0 8px 24px rgba(42,38,34,.06)}
header{display:flex;justify-content:space-between;gap:12px}h3{font:400 22px Fraunces,serif}h3 small{font:400 12px Inter;color:var(--ink-2)}
.meta{color:var(--ink-2);font-size:13px}.pill{font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;height:fit-content;white-space:nowrap}
.ok{background:var(--ok-bg);color:var(--ok)}.human{background:var(--human-bg);color:var(--human)}.declined{background:var(--declined-bg);color:var(--declined)}.esc{background:var(--esc-bg);color:var(--esc)}
.tags{display:flex;gap:6px;flex-wrap:wrap}.tag,.chk{font-size:12px;border:1px solid var(--line);border-radius:999px;padding:2px 9px;color:var(--ink-2)}
.chk.pass{color:var(--ok)}.chk.fail{color:var(--esc)}.chk.unclear{color:var(--human)}
</style></head><body><main><h1>What the engine decides</h1>
<p class="sub">All 20 September phone calls run through the real rules engine. Checks 1–5 are: real project, service area, timeline, budget, decision-maker (✓ pass, ✕ fail, ? unclear). Hover a check for its reason. Inputs are hand-labelled facts, not live AI extraction yet.</p>
<div class="grid">${cards.join("")}</div></main></body></html>`;
writeFileSync(new URL("../design/preview.html", import.meta.url), html);
console.log("wrote design/preview.html");
