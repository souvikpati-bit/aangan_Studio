"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const path = usePathname();
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("reduce-motion") === "true";
      setReduce(saved);
      document.documentElement.dataset.reduceMotion = String(saved);
    } catch { /* storage blocked: fine */ }
  }, []);

  function toggle() {
    const next = !reduce;
    setReduce(next);
    document.documentElement.dataset.reduceMotion = String(next);
    try { localStorage.setItem("reduce-motion", String(next)); } catch { /* ignore */ }
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const onLogin = path === "/login";

  return (
    <header className="top">
      <div className="wrap between" style={{ alignItems: "center", paddingTop: 12, paddingBottom: 12 }}>
        <div className="row" style={{ gap: 24 }}>
          <span className="serif" style={{ fontSize: 22 }}>Aangan</span>
          {!onLogin && (
            <nav aria-label="Main" className="row" style={{ gap: 4 }}>
              <Link href="/" aria-current={path === "/" ? "page" : undefined}>Leads</Link>
              <Link href="/founder" aria-current={path === "/founder" ? "page" : undefined}>Founder</Link>
            </nav>
          )}
        </div>
        <div className="row">
          <button className="btn sm" onClick={toggle} aria-pressed={reduce}>Reduce motion: {reduce ? "on" : "off"}</button>
          {!onLogin && <button className="btn sm" onClick={signOut}>Sign out</button>}
        </div>
      </div>
    </header>
  );
}
