# Test report

Run `npm test` (Node 24, no keys needed). Result: **63 / 63 passing**.

## What the offline tests cover
- **Golden set:** all 20 real September phone transcripts (T01-T20), each run with its own call date, give the expected verdict and flags: 12 Qualified, 6 Not qualified, 1 Escalate, 1 Missed.
- **Timeline edges** at exactly 5, 6, 8 and 12 weeks: fail, Needs human, Qualified with a tight-timeline flag, Qualified.
- **Doubtful cases go to a person:** a low-confidence fail is never declined; an unrecognised neighbourhood with the city "Pune" qualifies with a flag and a note to confirm; a city outside the service area is declined.
- **Price safety:** the agent prompt and every approved line are scanned for lakh/crore, rupee signs, per-sq-ft and multiplier hints and for figures from the internal pricing guide; nine kinds of leak are caught and normal booking sentences pass.
- **Booking:** never in the past, never inside the minimum notice, respects bookable hours, blocked days and travel buffers, returns the three closest slots.
- **Calls:** a dropped call merges with the follow-up call; withheld numbers never merge; Vaani helpers (start a session, read call details, call start and length from the id and transcript timestamps).
- **HubSpot** (mocked): contact + deal + note, existing contact reused by phone, stage moves on Won/Lost, errors surfaced.
- **AI extraction** (mocked): Claude and Gemini adapters, strict validation of the AI's reply.

## Live checks (need keys)
- `npm run extract:live`: the real AI reads all 20 transcripts and the rules engine decides. **20 / 20** match (`docs/extraction_report.md`).
- `npm run test:webhook`: end-to-end against a running server, 11 checks: wrong secret refused, other events ignored, calls processed, duplicates ignored, lead row has name/source/transcript/recording, escalation created, email sent, HubSpot records created, test data cleaned up.
- Real Vaani calls imported on the live site produced the correct lead, transcript, recording link, email and HubSpot records.

## Honest notes
- The 20 golden transcripts are human front-desk calls, so they test understanding and rules, not voice behaviour. Voice behaviour was checked with real test calls in Vaani.
- Transcript T07 says Diwali is "about 3 weeks away" on 8 September, while real Diwali 2026 is 8 November. The test follows what the call says.
- Not tested by automation: the browser microphone path, real phone calls, and Cal.com booking inside Vaani.
