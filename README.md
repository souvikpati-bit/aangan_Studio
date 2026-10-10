# Aangan Studio: AI voice lead qualification

An AI voice agent answers every enquiry call for **Aangan Studio**, a Pune interior design studio. It qualifies the caller against the owner's own rubric, notes the preferred consultation time, and hands the designer a ready brief: a dashboard card with the **transcript and recording**, an **email**, and a **HubSpot contact and deal**. It never quotes a price.

Live app (sign-in required): https://aangan-studio-gamma.vercel.app

## Why it exists

The studio gets about 200 enquiries a month. A third arrive outside office hours, and about half get no reply within 48 hours, although an enquiry answered within an hour converts about four times better. The goal is not faster replies for their own sake, but more won projects, so the founder page tracks response time, meetings, won value and the cost of the tool side by side.

## How a call flows

```
Caller  ->  Vaani Voice agent (answers 24x7, says it is an AI, records)
                |  call ends
                v
        Vaani webhook  ->  /api/webhooks/vaani   (only the call id is used)
                |  fetch transcript, summary, recording from Vaani
                v
        Gemini reads the transcript  ->  facts (area, size, timeline, who decides ...)
                v
        Rules engine (Nikhil's five criteria)  ->  Qualified / Not qualified / Needs human / Escalate
                v
   Neon database  ->  dashboard card (+ transcript, recording player)
                  ->  designer email (Resend)
                  ->  HubSpot contact + deal + note
```

The AI only **reads** the call. The verdict comes from plain, tested code (`engine/qualify.ts`), so every decision can be explained and replayed.

## Results

- **20 of 20** real September call transcripts reach the expected verdict and flags, measured with the live AI (`docs/extraction_report.md`).
- **63 automated tests** pass offline: the rules, timeline edge cases at exactly 5, 6, 8 and 12 weeks, the price-leak guard, slot finder, HubSpot sync (mocked) and the Vaani helpers.
- End to end on the live site with real Vaani calls: lead created, transcript and recording shown, email sent, HubSpot contact + deal + note created, duplicates ignored.

## Design rules built in

- **Never quotes a price.** The agent prompt contains no pricing; an automatic scan fails the build if any figure or hint could leak.
- **Honest about being an AI**, and tells the caller the call may be recorded.
- **Declines only on a clear, confident fail.** Anything doubtful goes to a person ("Needs human"), because rejecting a good lead costs more than passing a bad one.
- **Never invents a booking.** Without a calendar tool the agent says it has noted the preference and the designer will confirm.
- Passwords are stored only as scrypt hashes; every page and API needs a signed-in session; recordings are served through the server and never on a public link.

## Stack

| Part | Tool |
|---|---|
| Voice agent, recording, transcripts | Vaani Voice |
| Reading the call | Google Gemini |
| Database | Neon (Postgres) |
| Dashboard | Next.js, React, Tailwind, GSAP (+ Lenis), hosted on Vercel |
| Email | Resend |
| CRM | HubSpot |
| Scheduling (set up, not yet linked in Vaani) | Cal.com |

## Repository map

| Folder | What |
|---|---|
| `engine/` | Rules engine, AI extraction, call merging |
| `agent/` | Voice agent prompt and the price-leak guard |
| `booking/` | Consultation slot finder |
| `web/` | Dashboard, login, Vaani webhook, audio proxy |
| `db/` | Database schema (`schema.neon.sql`) |
| `config/` | Editable thresholds and the service-area list |
| `seed/` | Source documents: services, rubric, pricing guide, 20 transcripts |
| `scripts/` | Setup, live checks and end-to-end tests |
| `tests/` | The 63 tests |
| `docs/` | Test and extraction reports |

## Run it

```bash
cp .env.example .env            # fill in the keys (never commit .env)
npm install && npm install --prefix web
npm test                        # 63 offline tests, no keys needed
npm run db:migrate && npm run db:seed
npm run user:create -- you@example.com "a-strong-password" founder
npm run vaani:create            # creates or updates the voice agent
npm run dev                     # http://localhost:3000
```

`npm run extract:live` re-runs the 20-transcript check against the real AI, and `npm run test:webhook` runs the end-to-end webhook test against a running server.

## Known limits

- Real booking on the call needs Cal.com linked inside Vaani; today the agent records the preferred time and the designer confirms.
- No phone number is attached; calls are tested through Vaani's browser test.
- Vaani's own wallet must stay topped up for calls to work.
- The founder page shows sample figures until enough real calls exist.

## Credits

Photography from [Unsplash](https://unsplash.com), used under the Unsplash licence.
