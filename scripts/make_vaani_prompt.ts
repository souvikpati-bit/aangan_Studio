// Writes the agent system prompt for pasting into the Vaani dashboard, and checks it for price leaks.
import { writeFileSync } from "node:fs";
import { buildPrompt } from "../agent/prompt.ts";
import { findPriceLeaks } from "../agent/priceGuard.ts";

// Use a fixed date, then swap its line for a placeholder the platform can fill at call start.
const text = buildPrompt(new Date("2026-01-01T05:00:00Z")).replace(/^Current date and time \(IST\):.*$/m, "You are not told today's date. Never guess or state a date or weekday yourself. For booking, use only the dates and times returned by the calendar booking tool. If the caller gives a relative date (next Tuesday, in six weeks), repeat their own words back and let the booking tool confirm the exact date.");
const leaks = findPriceLeaks(text);
if (leaks.length) throw new Error("Price leak in prompt: " + leaks.join(", "));
writeFileSync(new URL("../agent/vaani_system_prompt.txt", import.meta.url), text);
console.log("prompt written,", text.length, "chars, leak-free");
