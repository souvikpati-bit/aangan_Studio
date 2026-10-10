"use client";
import { useEffect, useState } from "react";

/** Calm countdown ring: sage -> ochre -> clay as time runs out. Never flashes. */
export default function EscalationRing({ promiseMinutes, startedAgoMinutes, acked }: { promiseMinutes: number; startedAgoMinutes: number; acked: boolean }) {
  const [elapsed, setElapsed] = useState(startedAgoMinutes * 60);
  useEffect(() => {
    if (acked) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [acked]);

  const total = promiseMinutes * 60;
  const left = total - elapsed;
  const frac = Math.max(0, Math.min(1, left / total));
  const color = acked ? "var(--ok)" : frac > 0.5 ? "var(--ok)" : frac > 0.2 ? "var(--human)" : "var(--esc)";
  const R = 34, C = 2 * Math.PI * R;
  const abs = Math.abs(left);
  const label = `${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;

  return (
    <div className="row" style={{ gap: 16 }} role="timer" aria-label={acked ? "Acknowledged" : left >= 0 ? `${label} left to call back` : `${label} overdue`}>
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
        <circle cx="42" cy="42" r={R} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle cx="42" cy="42" r={R} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - (acked ? 1 : frac))} transform="rotate(-90 42 42)"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.6s ease" }} />
        <text x="42" y="47" textAnchor="middle" className="num" style={{ fontSize: 14, fontWeight: 600, fill: "var(--ink)" }}>{acked ? "✓" : label}</text>
      </svg>
      <div>
        <div style={{ fontWeight: 600, color }}>{acked ? "Acknowledged" : left >= 0 ? "Callback promised" : "Overdue"}</div>
        <div className="muted small">{acked ? "Someone has taken this." : left >= 0 ? `Within ${promiseMinutes} minutes of the call` : "Promised time has passed. Call now."}</div>
      </div>
    </div>
  );
}
