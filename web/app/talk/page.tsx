"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
    <div style={{ maxWidth: 560, margin: "4vh auto 0" }}>
      <h1 style={{ fontSize: "clamp(30px, 6vw, 44px)", lineHeight: 1.1 }}>Talk to the agent</h1>
      <p className="muted" style={{ margin: "8px 0 24px" }}>
        Press start and speak as a caller would. When you finish, the call is saved to the dashboard with its transcript and recording, and a brief is emailed to you.
      </p>

      <div className="card" style={{ display: "grid", gap: 16, textAlign: "center" }}>
        {phase === "idle" || phase === "error" ? (
          <button className="btn primary" onClick={start}>Start call</button>
        ) : phase === "connecting" ? (
          <p role="status">Connecting…</p>
        ) : phase === "live" ? (
          <>
            <p role="status" className="num" style={{ fontSize: 28, margin: 0 }}>● Live {mm}:{ss}</p>
            <p className="muted small" style={{ margin: 0 }}>Speak normally. The agent will answer.</p>
            <button className="btn" onClick={end}>End call</button>
          </>
        ) : phase === "saving" ? (
          <p role="status">Saving your call… this takes up to a minute while Vaani writes the transcript.</p>
        ) : (
          <>
            {result?.status === "processed" ? (
              <p role="status"><b>Saved.</b> Verdict: <b>{result.verdict}</b>. It is now on the dashboard, and the brief email is on its way.</p>
            ) : (
              <p role="status">{result?.message ?? "Done."}</p>
            )}
            <div className="row" style={{ justifyContent: "center" }}>
              <Link className="btn primary" href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Open the dashboard</Link>
              <button className="btn" onClick={() => { setPhase("idle"); setResult(null); }}>Another call</button>
            </div>
          </>
        )}
        {msg && <div className="banner" role="alert">{msg}</div>}
      </div>

      <details style={{ marginTop: 24 }}>
        <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Made a call inside Vaani instead? Add it here</summary>
        <form onSubmit={importCall} style={{ display: "grid", gap: 8, paddingTop: 8 }}>
          <label className="small muted" htmlFor="cid">Session ID: in Vaani, open Conversations → History, open the call, and copy the ID at the top (looks like webrtc-1791652638-f1903889)</label>
          <input id="cid" className="field" value={importId} onChange={(e) => setImportId(e.target.value)} placeholder="webrtc-…" />
          <button className="btn sm" type="submit" disabled={!importId.trim() || phase === "saving"}>Add this call</button>
        </form>
      </details>

      <div ref={audioHost} aria-hidden="true" />
    </div>
  );
}
