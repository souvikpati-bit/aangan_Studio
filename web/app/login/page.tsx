"use client";
import { useState } from "react";

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
    <div style={{ maxWidth: 420, margin: "10vh auto 0" }}>
      <h1 style={{ fontSize: 40, lineHeight: 1.1 }}>Aangan Leads</h1>
      <p className="muted" style={{ margin: "8px 0 24px" }}>Sign in to see today&apos;s enquiries.</p>
      <form className="card" onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label className="small muted" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
        <label className="small muted" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        {error && <div className="banner" role="alert">{error}</div>}
        <button className="btn primary" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
