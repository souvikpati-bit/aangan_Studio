// Live check: Claude extracts facts from each transcript, the rules engine decides, we compare with the golden set.
// Run: node --env-file=.env scripts/run_extraction.ts
import { readFileSync, writeFileSync } from "node:fs";
import { extractWith, splitTranscripts } from "../engine/extract.ts";
import { qualify } from "../engine/qualify.ts";
import type { ServiceArea, Settings } from "../engine/types.ts";

const provider = process.env.LLM_PROVIDER ?? "gemini";
if (provider === "gemini" ? !process.env.GEMINI_API_KEY : !process.env.ANTHROPIC_API_KEY) {
  console.error(`The API key for LLM_PROVIDER=${provider} is not set. Put it in .env (see .env.example).`);
  process.exit(1);
}
const load = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const settings: Settings = load("../config/settings.json");
const area: ServiceArea = load("../config/service_area.json");
const fixtures: { id: string; as_of: string; expect: string; expect_flags: string[] }[] = load("../tests/golden_fixtures.json");
const transcripts = splitTranscripts(readFileSync(new URL("../seed/phone_transcripts_T01-T20.md", import.meta.url), "utf8"));

let ok = 0, inTok = 0, outTok = 0;
const rows: string[] = [];
for (const fx of fixtures) {
  const t = transcripts[fx.id];
  try {
    const { facts, usage } = await extractWith(provider, t, fx.as_of, { gemini: process.env.GEMINI_API_KEY, anthropic: process.env.ANTHROPIC_API_KEY, model: process.env.GEMINI_MODEL });
    inTok += usage.input_tokens; outTok += usage.output_tokens;
    const r = qualify(facts, new Date(fx.as_of), settings, area);
    const flagsOk = fx.expect_flags.every((f) => r.flags.includes(f));
    const pass = r.verdict === fx.expect && flagsOk;
    if (pass) ok++;
    rows.push(`| ${fx.id} | ${fx.expect} | ${r.verdict} | ${pass ? "OK" : "MISMATCH"} | ${r.reason.replace(/\|/g, "/")} | ${r.flags.join(", ")} |`);
  } catch (e) {
    rows.push(`| ${fx.id} | ${fx.expect} | error | MISMATCH | ${(e as Error).message} | |`);
  }
}
const report = `# Extraction report (live, ${provider})\n\nMatched ${ok}/${fixtures.length}. Tokens: ${inTok} in, ${outTok} out.\n\n| Call | Expected | Got | Result | Reason | Flags |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n`;
writeFileSync(new URL("../docs/extraction_report.md", import.meta.url), report);
console.log(report);
