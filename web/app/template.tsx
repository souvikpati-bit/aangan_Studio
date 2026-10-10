"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { reducedMotion } from "../lib/motion";

// Soft cross-fade with a slight rise between screens.
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (reducedMotion() || !ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", clearProps: "transform,opacity" });
  }, { scope: ref });
  return <div ref={ref}>{children}</div>;
}
