"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { dur, ease, reducedMotion } from "../../lib/motion";
import Cinema from "../../components/Cinema";
import Reveal from "../../components/Reveal";
import Lenis from "lenis";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// SAMPLE figures only. Real values will come from the database once calls are live.
const calls = 200, costPerCall = 33, won = 4, avgValue = 1_100_000;
const meetings = 14, meetingToWon = 0.25;
const forecast = meetings * meetingToWon * avgValue;
const monthlyCost = calls * costPerCall;
const lakh = (n: number) => `₹ ${(n / 100000).toFixed(1)} L`;

const tiles: { label: string; value: number; fmt: (n: number) => string; note: string }[] = [
  { label: "Answered within 5 minutes", value: 96, fmt: (n) => `${Math.round(n)}%`, note: "Before: about 48% had no reply in 48 hours" },
  { label: "Revenue won this month", value: won * avgValue, fmt: lakh, note: `${won} projects at the sample average` },
  { label: "Forecast, next 30 days", value: forecast, fmt: lakh, note: `${meetings} meetings × ${meetingToWon * 100}% × ${lakh(avgValue)}` },
  { label: "Cost of the tool, per month", value: monthlyCost, fmt: (n) => `₹ ${Math.round(n).toLocaleString("en-IN")}`, note: `About ₹${costPerCall} per call, ${calls} calls` },
  { label: "Cost per won project", value: monthlyCost / won, fmt: (n) => `₹ ${Math.round(n).toLocaleString("en-IN")}`, note: "Compare with ₹8–14 lakh per project" },
  { label: "Average project value", value: avgValue, fmt: lakh, note: "Within the ₹8–14 L range" },
];

export default function Founder() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const still = reducedMotion();
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const to = Number(el.dataset.count);
      const fmt = tiles[Number(el.dataset.i)].fmt;
      if (still) { el.textContent = fmt(to); return; }
      const o = { v: 0 };
      gsap.to(o, {
        v: to, duration: 1.4, ease: "power2.out", onUpdate: () => { el.textContent = fmt(o.v); },
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });
    if (still) return;
    // Smooth, weighted scrolling on this long page only, wired to GSAP so scroll effects stay in sync.
    const lenis = new Lenis({ duration: 1.1 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    gsap.to("[data-parallax]", { yPercent: -14, ease: "none", scrollTrigger: { trigger: ".founder-hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.from(".reveal", { y: 24, opacity: 0, duration: dur.ui, ease: ease.in, stagger: 0.06 });
    gsap.from(".bar", { scaleY: 0, duration: 0.9, ease: ease.reveal, stagger: 0.15, scrollTrigger: { trigger: ".bars", start: "top 85%", once: true } });
    return () => { lenis.destroy(); gsap.ticker.remove(tick); };
  }, { scope: root });

  const bars = [{ label: "Within 1 hour", v: 12 }, { label: "Same day", v: 7 }, { label: "Next day", v: 3 }];

  return (
    <div ref={root}>
      <Cinema className="founder-hero hero on-photo" images={["/media/living-classic.jpg", "/media/living-oak.jpg", "/media/hero-entry.jpg"]} interval={8} label="Elegant living rooms">
        <div className="hero-in" data-parallax>
          <span className="eyebrow">For the founder</span>
          <Reveal text="Faster answers, measured in revenue." />
          <p className="lede">Quick replies only count if more projects are won. This page follows the whole chain: response, meetings, won value, and what the tool costs.</p>
          <span className="chip" style={{ alignSelf: "flex-start", fontSize: 12 }}>Sample figures · real numbers appear as calls come in</span>
        </div>
      </Cinema>

      <div className="metrics-float">
      <div className="metrics">
        {tiles.map((t, i) => (
          <div key={t.label} className="card metric reveal">
            <div className="muted small">{t.label}</div>
            <div className="big" data-count={t.value} data-i={i}>{t.fmt(t.value)}</div>
            <div className="muted small">{t.note}</div>
          </div>
        ))}
      </div>

      </div>

      <section className="card reveal" style={{ marginTop: 16 }} aria-labelledby="conv">
        <h2 id="conv" style={{ fontSize: 22 }}>Conversion by response time</h2>
        <p className="muted small" style={{ margin: "4px 0 16px" }}>The brief says a reply within 1 hour converts about 4× better than next day. This chart will prove it with real calls.</p>
        <div className="bars row" style={{ alignItems: "flex-end", gap: 24, height: 180 }} role="img" aria-label="Sample conversion: within 1 hour 12 percent, same day 7 percent, next day 3 percent">
          {bars.map((b) => (
            <div key={b.label} style={{ flex: 1, textAlign: "center" }}>
              <div className="num small" style={{ fontWeight: 600 }}>{b.v}%</div>
              <div className="bar" style={{ height: b.v * 11, background: "var(--accent)", borderRadius: "10px 10px 0 0", margin: "4px auto 0", maxWidth: 90 }} />
              <div className="muted small" style={{ marginTop: 8 }}>{b.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
