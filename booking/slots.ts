// Slot finder. India has no daylight saving, so IST is a fixed +05:30 offset.
export interface Interval { start: Date; end: Date }
export interface BookingConfig {
  hours: Record<number, [string, string] | null>; // weekday 0=Sun..6=Sat in IST -> ["10:00","20:00"] or null
  blockedDays: string[]; // "YYYY-MM-DD" (IST)
  siteVisitMin: number;
  callMin: number;
  travelBufferMin: number;
  minNoticeHours: number;
  horizonDays: number;
}
export const DEFAULT_BOOKING: BookingConfig = {
  hours: { 0: ["10:00", "14:00"], 1: ["10:00", "20:00"], 2: ["10:00", "20:00"], 3: ["10:00", "20:00"], 4: ["10:00", "20:00"], 5: ["10:00", "20:00"], 6: ["10:00", "20:00"] },
  blockedDays: [], siteVisitMin: 60, callMin: 30, travelBufferMin: 45, minNoticeHours: 4, horizonDays: 14,
};

const IST_MS = 5.5 * 3_600_000;
const MIN = 60_000;
const istParts = (d: Date) => new Date(d.getTime() + IST_MS); // read with getUTC*
const istDate = (d: Date) => istParts(d).toISOString().slice(0, 10);
const atIst = (day: string, hhmm: string) => new Date(new Date(`${day}T${hhmm}:00Z`).getTime() - IST_MS);
const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

export function isFree(start: Date, mode: "site_visit" | "call", busy: Interval[], cfg: BookingConfig, now: Date): boolean {
  const dur = (mode === "site_visit" ? cfg.siteVisitMin : cfg.callMin) * MIN;
  const buf = mode === "site_visit" ? cfg.travelBufferMin * MIN : 0;
  if (start.getTime() < now.getTime() + cfg.minNoticeHours * 3_600_000) return false; // also blocks the past
  const day = istDate(start);
  if (cfg.blockedDays.includes(day)) return false;
  const win = cfg.hours[istParts(start).getUTCDay()];
  if (!win) return false;
  const end = new Date(start.getTime() + dur);
  if (start < atIst(day, win[0]) || end > atIst(day, win[1])) return false;
  const padded = { start: new Date(start.getTime() - buf), end: new Date(end.getTime() + buf) };
  return !busy.some((b) => overlaps(padded, b));
}

/** Returns up to `n` free slots closest to the caller's preferred time (30-minute grid). */
export function findSlots(preferred: Date, mode: "site_visit" | "call", busy: Interval[], cfg: BookingConfig, now: Date, n = 3): Date[] {
  const found: Date[] = [];
  const startDay = istDate(now);
  for (let d = 0; d <= cfg.horizonDays; d++) {
    const day = istDate(new Date(atIst(startDay, "00:00").getTime() + d * 86_400_000 + 12 * 3_600_000));
    for (let m = 0; m < 24 * 60; m += 30) {
      const t = atIst(day, `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
      if (isFree(t, mode, busy, cfg, now)) found.push(t);
    }
  }
  return found.sort((a, b) => Math.abs(+a - +preferred) - Math.abs(+b - +preferred)).slice(0, n).sort((a, b) => +a - +b);
}
