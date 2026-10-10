"use client";
import Link from "next/link";
import Cinema from "./Cinema";
import Reveal from "./Reveal";
import Magnetic from "./Magnetic";
import CountUp from "./CountUp";

const PHOTOS = ["/media/hero-entry.jpg", "/media/living-oak.jpg", "/media/living-dusk.jpg", "/media/living-classic.jpg"];

export default function Hero({ qualified, needsHuman, escalations, total }: { qualified: number; needsHuman: number; escalations: number; total: number }) {
  return (
    <Cinema className="hero on-photo" images={PHOTOS} label="Interiors designed by Aangan Studio">
      <div className="hero-in">
        <span className="eyebrow">Aangan Studio · Pune</span>
        <Reveal text="Every enquiry, answered beautifully." />
        <p className="lede">Calls are answered, qualified and booked around the clock. Here is what came in, with the transcript and the recording.</p>
        <div className="chips" aria-label="Summary">
          <span className="chip"><b><CountUp to={total} /></b> enquiries</span>
          <span className="chip"><b><CountUp to={qualified} /></b> qualified</span>
          <span className="chip"><b><CountUp to={needsHuman} /></b> need a person</span>
          <span className="chip"><b><CountUp to={escalations} /></b> escalated</span>
          <Magnetic><Link className="btn light" href="/talk" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Talk to the agent</Link></Magnetic>
        </div>
      </div>
    </Cinema>
  );
}
