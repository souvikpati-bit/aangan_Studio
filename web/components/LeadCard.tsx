"use client";
import { useRef, useState } from "react";
import gsap from "gsap";
import { Lead, Verdict, verdictClass } from "../lib/types";
import { dur, ease, reducedMotion } from "../lib/motion";
import EscalationRing from "./EscalationRing";

export type LeadView = Lead & { overrideReason?: string; acked?: boolean };
const STATUSES = ["New", "Contacted", "Meeting held", "Won", "Lost"];
const OVERRIDE_TO: Verdict[] = ["Qualified", "Needs human", "Not qualified"];
const ICON = { pass: "✓", fail: "✕", unclear: "?" } as const;
const NAMES = ["Real project", "Service area", "Timeline", "Budget", "Decision-maker"];

export default function LeadCard({ lead, fresh, onChange }: { lead: LeadView; fresh?: boolean; onChange: (patch: Partial<LeadView>) => void }) {
  const [open, setOpen] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [newVerdict, setNewVerdict] = useState<Verdict>("Qualified");
  const [reason, setReason] = useState("");
  const detail = useRef<HTMLDivElement>(null);
  const quiet = lead.verdict === "Needs human" || lead.verdict === "Missed" || lead.verdict === "Escalate";

  function toggle() {
    const el = detail.current;
    if (!open) {
      setOpen(true);
      requestAnimationFrame(() => {
        const d = detail.current;
        if (d && !reducedMotion() && !quiet) gsap.fromTo(d, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: dur.ui, ease: ease.move });
      });
    } else if (el && !reducedMotion() && !quiet) {
      gsap.to(el, { height: 0, opacity: 0, duration: dur.fast, ease: ease.move, onComplete: () => setOpen(false) });
    } else setOpen(false);
  }

  const crit = (["c1", "c2", "c3", "c4", "c5"] as const).map((k, i) => ({ k, name: NAMES[i], c: lead.criteria[k] }));
  const showChecks = lead.verdict !== "Escalate" && lead.verdict !== "Missed" && lead.verdict !== "Closed";

  return (
    <article className={`card lead-card${fresh ? " flash" : ""}`} data-v={lead.verdict} data-flip-id={lead.id} aria-label={`${lead.name}, ${lead.verdict}`}>
      <div className="between">
        <div className="row" style={{ gap: 14, flexWrap: "nowrap", minWidth: 0 }}>
          <span className="avatar" aria-hidden="true">{(lead.name.match(/[A-Za-z]/)?.[0] ?? "?").toUpperCase()}</span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 24, lineHeight: 1.15 }}>{lead.name}</h3>
            <p className="muted small" style={{ margin: "2px 0 0" }}>{lead.property}</p>
          </div>
        </div>
        <span className={`pill ${verdictClass[lead.verdict]}`}>{lead.verdict}</span>
      </div>

      <p style={{ margin: "12px 0" }}>{lead.reason}</p>

      <div className="row">
        {lead.demo && <span className="tag">Demo case</span>}
        {lead.flags.includes("VIP") && <span className="tag vip">VIP</span>}
        {lead.flags.filter((f) => f !== "VIP").map((f) => <span key={f} className="tag">{f.replace(/_/g, " ")}</span>)}
        {showChecks && crit.map((x, i) => (
          <span key={x.k} className={`chk ${x.c.result}`} title={`${x.name}: ${x.c.note}`} aria-label={`${x.name}: ${x.c.result}`}>{i + 1} {ICON[x.c.result]}</span>
        ))}
      </div>

      {lead.verdict === "Escalate" && lead.escalation && (
        <div className="slot">
          <EscalationRing promiseMinutes={lead.escalation.promiseMinutes} startedAgoMinutes={lead.escalation.startedAgoMinutes} acked={!!lead.acked} />
          {!lead.acked && <button className="btn primary sm" style={{ marginTop: 12 }} onClick={() => onChange({ acked: true })}>Acknowledge</button>}
        </div>
      )}

      {lead.slot && (
        <div className="slot between" style={{ alignItems: "center" }}>
          <span><b>{lead.slot}</b> <span className="muted">· {lead.mode}</span></span>
          <span className="pill ok">Booked</span>
        </div>
      )}
      {lead.question && <p className="slot small"><b>Ask the caller:</b> {lead.question}</p>}

      <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
        <button className="link" onClick={toggle} aria-expanded={open}>{open ? "Hide details" : "Show details"}</button>
        <select className="field" style={{ width: "auto" }} value={lead.status} aria-label={`Status for ${lead.name}`} onChange={(e) => onChange({ status: e.target.value })}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {open && (
        <div ref={detail} className="detail">
          <dl style={{ paddingTop: 12 }}>
            <dt>Phone</dt><dd className="num">{lead.phone}</dd>
            <dt>Call</dt><dd>{lead.calledAt} · {lead.duration}</dd>
            <dt>Source</dt><dd>{lead.source}</dd>
            <dt>Summary</dt><dd>{lead.summary}</dd>
            {lead.score !== null && <><dt>Score</dt><dd className="num">{lead.score} / 100</dd></>}
            {showChecks && <><dt>Checks</dt><dd>{crit.map((x) => <div key={x.k}><span className={`chk ${x.c.result}`}>{ICON[x.c.result]}</span> {x.name}: <span className="muted">{x.c.note}</span></div>)}</dd></>}
            {lead.notes.length > 0 && <><dt>Note for designer</dt><dd>{lead.notes.join(" · ")}</dd></>}
            <dt>Already asked</dt><dd>{lead.asked.length ? lead.asked.join(", ") : "Nothing captured"} <span className="muted">(do not ask again)</span></dd>
            <dt>Recording</dt>
            <dd>
              {lead.callId && lead.hasRecording ? (
                <audio controls preload="none" style={{ width: "100%", maxWidth: 360 }} src={`/api/calls/${encodeURIComponent(lead.callId)}/audio`} aria-label={`Recording of the call with ${lead.name}`} />
              ) : <span className="muted">{lead.callId ? "No recording for this call" : "Sample call: no recording"}</span>}
            </dd>
            <dt>Transcript</dt>
            <dd>
              {lead.transcript ? (
                <details>
                  <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Read the transcript</summary>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 13, maxHeight: 280, overflow: "auto", padding: "8px 0" }}>{lead.transcript}</div>
                </details>
              ) : <span className="muted">{lead.callId ? "No transcript for this call" : "Sample call: no transcript"}</span>}
            </dd>
            {lead.overrideReason && <><dt>Override</dt><dd>{lead.overrideReason}</dd></>}
          </dl>

          {!overriding ? (
            <button className="link" onClick={() => setOverriding(true)}>Override verdict</button>
          ) : (
            <form style={{ display: "grid", gap: 8, paddingBottom: 4 }} onSubmit={(e) => {
              e.preventDefault();
              if (!reason.trim()) return;
              onChange({ verdict: newVerdict, overrideReason: `Changed to ${newVerdict}: ${reason.trim()}` });
              setOverriding(false); setReason("");
            }}>
              <label className="small muted" htmlFor={`v-${lead.id}`}>New verdict</label>
              <select id={`v-${lead.id}`} className="field" value={newVerdict} onChange={(e) => setNewVerdict(e.target.value as Verdict)}>
                {OVERRIDE_TO.map((v) => <option key={v}>{v}</option>)}
              </select>
              <label className="small muted" htmlFor={`r-${lead.id}`}>Reason (required)</label>
              <input id={`r-${lead.id}`} className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="One line" />
              <div className="row"><button className="btn primary sm" type="submit" disabled={!reason.trim()}>Save override</button><button className="btn sm" type="button" onClick={() => setOverriding(false)}>Cancel</button></div>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
