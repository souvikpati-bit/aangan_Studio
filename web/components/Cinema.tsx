"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { reducedMotion } from "../lib/motion";

/**
 * A slow, film-like slideshow of interior photographs: each room drifts and zooms gently (Ken Burns)
 * and melts into the next. Only transform and opacity are animated, so it stays smooth on phones.
 * With "reduce motion" on, it shows the first photo, still.
 */
export default function Cinema({
  images, interval = 7, tone = "dusk", className = "", children, label,
}: {
  images: string[]; interval?: number; tone?: "dusk" | "soft" | "none"; className?: string; children?: React.ReactNode; label?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const slides = gsap.utils.toArray<HTMLElement>(".cin-slide", root.current);
    if (!slides.length) return;
    if (reducedMotion()) { gsap.set(slides[0], { opacity: 1 }); return; }

    let i = 0;
    const play = (idx: number, first = false) => {
      const el = slides[idx];
      const dir = idx % 2 === 0 ? 1 : -1;
      gsap.fromTo(el, { opacity: first ? 1 : 0, scale: 1.12, xPercent: 2.5 * dir }, { opacity: 1, duration: first ? 0.01 : 1.8, ease: "power2.inOut", overwrite: "auto" });
      gsap.to(el, { scale: 1.02, xPercent: -2.5 * dir, duration: interval + 2.4, ease: "none" });
      if (slides.length > 1) {
        const prev = slides[(idx + slides.length - 1) % slides.length];
        if (prev !== el) gsap.to(prev, { opacity: 0, duration: 1.8, ease: "power2.inOut" });
      }
    };
    gsap.set(slides, { opacity: 0 });
    play(0, true);
    if (slides.length < 2) return;
    const t = setInterval(() => { if (document.hidden) return; i = (i + 1) % slides.length; play(i); }, interval * 1000);
    return () => clearInterval(t);
  }, { scope: root });

  return (
    <div ref={root} className={`cinema ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {images.map((src, n) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} className="cin-slide" src={src} alt="" decoding="async" loading={n === 0 ? "eager" : "lazy"} style={{ opacity: n === 0 ? 1 : 0 }} />
      ))}
      {tone !== "none" && <div className={`cin-tone ${tone}`} />}
      <div className="cin-grain" />
      {children && <div className="cin-content">{children}</div>}
    </div>
  );
}
