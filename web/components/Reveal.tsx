"use client";
import { createElement, useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { dur, ease, reducedMotion } from "../lib/motion";

/** Headline that rises into view word by word, each word masked by its own line. */
export default function Reveal({
  text, as = "h1", className = "", delay = 0, style,
}: { text: string; as?: "h1" | "h2" | "h3" | "p"; className?: string; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    gsap.set(el, { visibility: "visible" });
    if (reducedMotion()) return;
    gsap.from(el.querySelectorAll(".rv-in"), { yPercent: 115, rotate: 2, duration: dur.hero, ease: ease.reveal, stagger: 0.07, delay });
  }, { scope: ref });

  const words = text.split(" ");
  return createElement(
    as,
    { ref, className: `reveal-text ${className}`, style: { visibility: "hidden", ...style }, "aria-label": text },
    words.map((w, i) => (
      <span key={i} className="rv-mask" aria-hidden="true">
        <span className="rv-in">{w}{i < words.length - 1 ? " " : ""}</span>
      </span>
    )),
  );
}
