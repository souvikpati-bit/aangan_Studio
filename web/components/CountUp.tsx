"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { reducedMotion } from "../lib/motion";

/** A number that counts up once when it first appears. */
export default function CountUp({ to, className = "" }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) { el.textContent = String(to); return; }
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.2, ease: "power2.out", delay: 0.4, onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
  }, { scope: ref, dependencies: [to] });
  return <span ref={ref} className={`num ${className}`}>{to}</span>;
}
