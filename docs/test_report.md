# Test report - Phase 1 (rules engine)

Run: `npm test` (Node 24, no dependencies). Result: **30 / 30 passing**.

## What was tested
- All 20 phone transcripts (T01-T20) through `qualify()` using each call's own date as `as_of`. Result matches the golden set: 12 Qualified, 6 Not qualified, 1 Escalate, 1 Missed.
- Expected flags: price_asked (T02, T13), tight_timeline (T02), VIP (T05), high_value (T12), service_recovery (T16), follow_up (T07).
- Timeline edge cases at exactly 5, 6, 8 and 12 weeks: fail, Needs human, Qualified + tight flag, Qualified.
- A low-confidence fail goes to Needs human, never declined.
- A volunteered budget with unclear scope is not decided.
- Asking for price never disqualifies.
- T17 dropped call + callback merge into one lead. Withheld numbers never merge.

## Important limits of this result
- The fixtures are **hand-labelled facts** (what a correct extraction should return). This proves the rules, not the AI extraction. Extraction accuracy is tested in Phase 2 once an LLM key is in.
- T09 and T08 are tested by call type only, since they have no real conversation.

## Notes for the owner
- **T07 data quirk:** the transcript says Diwali is about 3 weeks away on 8 Sep, but Diwali 2026 is on 8 Nov (about 9 weeks). The fixture follows the call (3 weeks). With the real date T07 would pass the timeline check.
- Assumptions in `config/settings.json` (commercial minimum 500 sq ft, budget floors, adjoining areas Kharadi / Nanded City / Sunderban) still need confirmation.
