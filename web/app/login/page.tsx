"use client";
import { useState } from "react";
import Cinema from "../../components/Cinema";
import Reveal from "../../components/Reveal";
import Magnetic from "../../components/Magnetic";

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: f.get("email"), password: f.get("password") }),
    });
    if (r.ok) { window.location.href = "/"; return; }
    setError((await r.json().catch(() => ({}))).error ?? "Could not sign in");
    setBusy(false);
  }

  return (
    <div className="login-shell">
      <Cinema className="login-art on-photo" images={["/media/login-portrait.jpg", "/media/hero-entry.jpg", "/media/living-dusk.jpg"]} interval={8} label="A calm, modern living room">
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <span className="mark" style={{ color: "var(--on-photo)" }}>Aangan<i aria-hidden="true" /></span>
          <div style={{ display: "grid", gap: 14 }}>
            <span className="eyebrow">Interior design · Pune</span>
            <Reveal as="h2" text="Rooms that feel like home." delay={0.2} />
          </div>
        </div>
      </Cinema>

      <div className="login-form">
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <span className="eyebrow" style={{ color: "var(--brass)" }}>Aangan Studio</span>
          <Reveal text="Welcome back" style={{ fontSize: "clamp(34px, 5vw, 46px)", lineHeight: 1.05, fontWeight: 300 }} />
          <p className="muted" style={{ margin: "0 0 8px" }}>Sign in to see today&apos;s enquiries, with every call transcribed and recorded.</p>
          <label className="small muted" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required className="field" />
          <label className="small muted" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
          {error && <div className="banner" role="alert">{error}</div>}
          <Magnetic strength={0.12}><button className="btn primary" disabled={busy} type="submit" style={{ width: "100%" }}>{busy ? "Signing in…" : "Sign in"}</button></Magnetic>
        </form>
      </div>
    </div>
  );
}
