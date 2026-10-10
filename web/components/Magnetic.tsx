"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { reducedMotion } from "../lib/motion";

/** A few pixels of magnetic pull toward the cursor, for the one main call-to-action on a screen. */
export default function Magnetic({ children, strength = 0.25 }: { children: React.ReactNode; strength?: number }) {
  const box = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = box.current;
    if (!el || reducedMotion() || window.matchMedia("(hover: none)").matches) return;
    const target = el.firstElementChild as HTMLElement | null;
    if (!target) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      gsap.to(target, { x: (e.clientX - (r.left + r.width / 2)) * strength, y: (e.clientY - (r.top + r.height / 2)) * strength, duration: 0.4, ease: "power3.out" });
    };
    const leave = () => gsap.to(target, { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, { scope: box });

  return <div ref={box} style={{ display: "inline-block", padding: 10, margin: -10 }}>{children}</div>;
}
