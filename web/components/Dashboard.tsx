"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { TABS, Tab, inTab } from "../lib/types";
import { dur, ease, reducedMotion, stagger } from "../lib/motion";
import LeadCard, { LeadView } from "./LeadCard";
import Hero from "./Hero";

gsap.registerPlugin(useGSAP, Flip);

export default function Dashboard({ initial }: { initial: LeadView[] }) {
  const [leads, setLeads] = useState<LeadView[]>(initial);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Qualified");
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const flip = useRef<Flip.FlipState | null>(null);

  // Pick up new calls every 20 seconds. Skipped while a save is in flight so it never overwrites a change.
  const saving = useRef(0);
  const known = useRef(new Set(initial.map((l) => l.id)));
  useEffect(() => {
    const t = setInterval(async () => {
      if (saving.current > 0 || document.hidden) return;
      try {
        // Quietly collect any finished calls that have not been saved yet, then reload the list.
        await fetch("/api/sync", { method: "POST" }).catch(() => undefined);
        const r = await fetch("/api/leads", { cache: "no-store" });
        if (!r.ok) return;
        const fresh: LeadView[] = await r.json();
        const added = fresh.filter((l) => !known.current.has(l.id));
        if (added.length) { remember(); fresh.forEach((l) => known.current.add(l.id)); }
        setLeads(fresh);
        setNewIds((s) => new Set([...s, ...added.map((l) => l.id)]));
      } catch { /* offline: try again next time */ }
    }, 20_000);
    return () => clearInterval(t);
  }, []);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const matches = (l: LeadView) => {
    const s = q.trim().toLowerCase();
    return !s || [l.name, l.property, l.summary, l.source, l.id].join(" ").toLowerCase().includes(s);
  };
  const visible = leads.filter((l) => inTab(l, tab) && matches(l));
  const counts = Object.fromEntries(TABS.map((t) => [t, leads.filter((l) => inTab(l, t)).length])) as Record<Tab, number>;

  // First load: headings then cards rise in. Skipped for reduced motion.
  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.from(".reveal", { y: 20, opacity: 0, duration: dur.ui, ease: ease.in, stagger });
    gsap.from(".lead-card", { y: 20, opacity: 0, duration: dur.ui, ease: ease.in, stagger, delay: 0.15 });
  }, { scope: root });

  // Tab / search change: cards glide to their new places (Flip) instead of blinking.
  useGSAP(() => {
    if (!flip.current) return;
    const state = flip.current;
    flip.current = null;
    if (reducedMotion() || tab === "Needs human" || tab === "Escalations") return; // urgent screens: no decorative motion
    Flip.from(state, {
      targets: ".lead-card", duration: dur.ui, ease: ease.move, stagger: 0.03, absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: dur.ui, ease: ease.in }),
      onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.15 }),
    });
  }, { scope: root, dependencies: [tab, q] });

  const remember = () => { flip.current = Flip.getState(".lead-card"); };
  // Update the screen at once, save to the database, and roll back with a message if the save fails.
  const patch = (id: string, p: Partial<LeadView>) => {
    const before = leads.find((l) => l.id === id);
    remember();
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));
    setSaveError(null);
    const body: Record<string, unknown> = {};
    if (p.status) body.status = p.status;
    if (p.verdict) { body.verdict = p.verdict; body.overrideReason = (p.overrideReason ?? "").replace(/^Changed to [^:]+: /, ""); }
    if (p.acked) body.acked = true;
    saving.current++;
    fetch(`/api/leads/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => { if (!r.ok) throw new Error(`Save failed (${r.status})`); })
      .catch((e: Error) => {
        setSaveError(`${e.message}. The change was undone.`);
        if (before) setLeads((ls) => ls.map((l) => (l.id === id ? before : l)));
      })
      .finally(() => { saving.current--; });
  };

  return (
    <div ref={root}>
      <div className="reveal" style={{ marginBottom: 28 }}>
        <Hero total={leads.filter((l) => !l.demo).length} qualified={counts["Qualified"]} needsHuman={counts["Needs human"]} escalations={counts["Escalations"]} />
      </div>
      <div className="banner reveal" style={{ marginBottom: 20 }}>
        The 20 real September calls and two labelled demo cases are shown with your live calls. New calls appear at the top within seconds.
      </div>
      {saveError && <div className="banner" role="alert" style={{ marginBottom: 20 }}>{saveError}</div>}

      <div className="reveal row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <div className="tabs" role="tablist" aria-label="Lead views">
          {TABS.map((t) => (
            <button key={t} role="tab" className="tab" aria-selected={tab === t} onClick={() => { remember(); setTab(t); }}>
              {t} <span className="count num">{counts[t]}</span>
            </button>
          ))}
        </div>
        <input className="field" style={{ maxWidth: 260 }} type="search" placeholder="Search name, area, source" aria-label="Search leads"
          value={q} onChange={(e) => { remember(); setQ(e.target.value); }} />
      </div>

      <section aria-label={`${tab} leads`} aria-live="polite">
        {visible.length === 0 ? (
          <p className="muted">Nothing here{q ? " for that search" : ""}.</p>
        ) : (
          <div className="grid">
            {visible.map((l) => <LeadCard key={l.id} lead={l} fresh={newIds.has(l.id)} onChange={(p) => patch(l.id, p)} />)}
          </div>
        )}
      </section>
    </div>
  );
}
