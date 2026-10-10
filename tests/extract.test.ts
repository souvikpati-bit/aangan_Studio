import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractFacts, parseFacts, splitTranscripts } from "../engine/extract.ts";

test("seed file splits into 20 transcripts", () => {
  const md = readFileSync(new URL("../seed/phone_transcripts_T01-T20.md", import.meta.url), "utf8");
  const t = splitTranscripts(md);
  assert.equal(Object.keys(t).length, 20);
  assert.ok(t.T03.includes("Nashik"));
  assert.ok(!t.T03.includes("Hello — I want to redo my living room")); // no bleed from T07
});

test("parseFacts accepts valid JSON, tolerates surrounding text", () => {
  const f = parseFacts('Here you go: {"call_type":"new_lead","sqft":950,"needed_by":"2026-11-01"}');
  assert.equal(f.sqft, 950);
});

test("parseFacts rejects bad call_type, bad date and non-numeric sqft", () => {
  assert.throws(() => parseFacts('{"call_type":"hello"}'));
  assert.throws(() => parseFacts('{"call_type":"new_lead","needed_by":"November"}'));
  assert.throws(() => parseFacts('{"call_type":"new_lead","sqft":"950"}'));
  assert.throws(() => parseFacts("no json here"));
});

test("extractFacts calls the API with key + as_of and returns usage (mocked fetch)", async () => {
  let seen: { headers: Record<string, string>; body: string } | undefined;
  const fakeFetch = (async (_u: string, init: { headers: Record<string, string>; body: string }) => {
    seen = init;
    return new Response(JSON.stringify({ content: [{ text: '{"call_type":"new_lead"}' }], usage: { input_tokens: 10, output_tokens: 5 } }), { status: 200 });
  }) as unknown as typeof fetch;
  const r = await extractFacts("T01 · hello", "2026-09-02", { apiKey: "k", fetchImpl: fakeFetch });
  assert.equal(r.facts.call_type, "new_lead");
  assert.equal(r.usage.output_tokens, 5);
  assert.equal(seen!.headers["x-api-key"], "k");
  assert.ok(seen!.body.includes("2026-09-02"));
});

test("API error surfaces as an error (caller must keep the lead and alert the owner)", async () => {
  const bad = (async () => new Response("no", { status: 500 })) as unknown as typeof fetch;
  await assert.rejects(() => extractFacts("x", "2026-09-02", { apiKey: "k", fetchImpl: bad }));
});
