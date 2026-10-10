"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Cinema from "../../components/Cinema";
import Reveal from "../../components/Reveal";
import Magnetic from "../../components/Magnetic";

type Phase = "idle" | "connecting" | "live" | "saving" | "done" | "error";
type Result = { status: string; verdict?: string; leadRef?: string; message?: string };

export default function Talk() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [importId, setImportId] = useState("");
  const roomRef = useRef<{ disconnect: () => void } | null>(null);
  const callId = useRef<string | null>(null);
  const audioHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // After the call ends, ask the server every 5 seconds until Vaani has finished processing it (usually 20-60 s).
  async function collect(room: string) {
    setPhase("saving");
    for (let i = 0; i < 30; i++) {
      const r = await fetch("/api/talk/finish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ room }) });
      const j: Result = await r.json().catch(() => ({ status: "failed" }));
      if (j.status === "processed" || j.status === "empty" || j.status === "failed") { setResult(j); setPhase("done"); return; }
      await new Promise((res) => setTimeout(res, 5000));
    }
    setResult({ status: "waiting", message: "Vaani is still processing. The call will appear on the dashboard by itself in a minute or two." });
    setPhase("done");
  }

  async function start() {
    setMsg(null); setResult(null); setSecs(0); setPhase("connecting");
    try {
      const r = await fetch("/api/talk/start", { method: "POST" });
      const s = await r.json();
      if (!r.ok) throw new Error(s.error ?? "Could not start the call");
      callId.current = s.room;
      const { Room, RoomEvent, Track } = await import("livekit-client");
      const room = new Room();
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) { const el = track.attach(); el.setAttribute("data-agent-audio", "1"); audioHost.current?.appendChild(el); }
      });
      room.on(RoomEvent.Disconnected, () => { roomRef.current = null; if (callId.current) { const id = callId.current; callId.current = null; collect(id); } });
      await room.connect(s.url, s.token);
      await room.localParticipant.setMicrophoneEnabled(true);
      roomRef.current = room;
      setPhase("live");
    } catch (e) {
      const err = e as Error;
      setMsg(/permission|denied|NotAllowed/i.test(err.message) ? "The browser blocked the microphone. Allow it in the address bar and try again." : err.message);
      setPhase("error");
      roomRef.current?.disconnect();
    }
  }

  function end() { roomRef.current?.disconnect(); }

  async function importCall(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setResult(null); setPhase("saving");
    const r = await fetch("/api/talk/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ callId: importId }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.error ?? "Could not import"); setPhase("error"); return; }
    if (j.status === "waiting") { await collect(importId.trim()); return; }
    setResult(j); setPhase("done");
  }

  const mm = String(Math.floor(secs / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");

  return (
    <div>
      <Cinema className="talk-shell on-photo" images={["/media/living-dusk.jpg", "/media/living-airy.jpg", "/media/living-oak.jpg"]} interval={9} label="A quiet modern living room">
        <div style={{ minHeight: "min(80vh, 760px)", display: "grid", placeItems: "center", padding: "clamp(16px, 4vw, 40px)" }}>
          <div className="glass talk-card">
            <span className="eyebrow" style={{ color: "var(--brass)" }}>Live demo</span>
            <Reveal as="h1" text="Talk to the agent" style={{ fontSize: "clamp(32px, 6vw, 46px)", lineHeight: 1.05, fontWeight: 300 }} />

            {phase === "idle" || phase === "error" ? (
              <>
                <p className="muted" style={{ margin: 0 }}>Speak as a caller would. When you finish, the call is saved to the dashboard with its transcript and recording, and a brief is emailed to the designer.</p>
                <Magnetic><button className="btn primary" onClick={start} style={{ minWidth: 200 }}>Start call</button></Magnetic>
              </>
            ) : phase === "connecting" ? (
              <p role="status" className="muted" style={{ margin: 0 }}>Connecting…</p>
            ) : phase === "live" ? (
              <>
                <p role="status" className="num" style={{ fontSize: 30, margin: 0 }}><span className="live-dot" aria-hidden="true" />Live {mm}:{ss}</p>
                <div className="wave" aria-hidden="true">{Array.from({ length: 21 }).map((_, i) => <i key={i} />)}</div>
                <p className="muted small" style={{ margin: 0 }}>Speak normally. The agent will answer.</p>
                <button className="btn" onClick={end}>End call</button>
              </>
            ) : phase === "saving" ? (
              <>
                <div className="wave" aria-hidden="true">{Array.from({ length: 11 }).map((_, i) => <i key={i} />)}</div>
                <p role="status" className="muted" style={{ margin: 0 }}>Saving your call… this takes up to a minute while the transcript is written.</p>
              </>
            ) : (
              <>
                {result?.status === "processed" ? (
                  <p role="status" style={{ margin: 0 }}><b>Saved.</b> Verdict: <b>{result.verdict}</b>. It is on the dashboard, and the brief email is on its way.</p>
                ) : (
                  <p role="status" style={{ margin: 0 }}>{result?.message ?? "Done."}</p>
                )}
                <div className="row" style={{ justifyContent: "center" }}>
                  <Link className="btn primary" href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Open the dashboard</Link>
                  <button className="btn" onClick={() => { setPhase("idle"); setResult(null); }}>Another call</button>
                </div>
              </>
            )}
            {msg && <div className="banner" role="alert">{msg}</div>}

            <details style={{ textAlign: "left" }}>
              <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontSize: 13 }} className="muted">Made a call inside Vaani instead? Add it here</summary>
              <form onSubmit={importCall} style={{ display: "grid", gap: 8, paddingTop: 8 }}>
                <label className="small muted" htmlFor="cid">In Vaani, open Conversations → History, open the call, and copy the ID at the top (like webrtc-1791652638-f1903889)</label>
                <input id="cid" className="field" value={importId} onChange={(e) => setImportId(e.target.value)} placeholder="webrtc-…" />
                <button className="btn sm" type="submit" disabled={!importId.trim() || phase === "saving"}>Add this call</button>
              </form>
            </details>
          </div>
        </div>
      </Cinema>
      <div ref={audioHost} aria-hidden="true" />
    </div>
  );
}
