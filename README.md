# Aangan Studio: AI voice lead qualification

Answers inbound phone enquiries with a Vaani Voice agent, qualifies them with Nikhil's five-criteria rubric,
books a consultation (Cal.com), and shows everything on a password-protected dashboard. Never quotes a price.

## Stack
Vaani Voice (calls, recording, transcript) · Neon Postgres · Next.js on Vercel · Gemini (reads transcripts) ·
Cal.com (bookings) · Resend (emails) · HubSpot (CRM, planned).

## Layout
| Folder | What |
|---|---|
| `engine/` | Rules engine (`qualify.ts`), AI extraction (`extract.ts`), call merging (`dedupe.ts`) |
| `agent/` | Voice agent prompt + price-leak guard |
| `booking/` | Consultation slot finder |
| `web/` | Dashboard, login, Vaani webhook (`/api/webhooks/vaani`), audio proxy |
| `db/` | `schema.neon.sql` |
| `config/` | Thresholds, service area (editable) |
| `seed/` | The source documents (services, rubric, pricing guide, 20 transcripts) |
| `scripts/` | Setup, tests, live checks |
| `docs/` | Test reports and Vaani notes |

## Setup
1. `copy .env.example .env` and fill it in (never commit `.env`).
2. `npm install` (root) and `npm install --prefix web`
3. `npm run db:migrate` then `npm run db:seed` (sample leads)
4. `node --no-warnings --env-file=.env scripts/create_user.ts you@example.com "a-strong-password" founder`
5. `npm run vaani:create` creates/updates the voice agent
6. `npm run dev --prefix web` then open http://localhost:3000

## Tests
- `npm test` runs 47 offline tests (20 golden calls, timeline edges, price guard, slot finder, extraction parsing).
- `npm run extract:live` reads all 20 transcripts with the real AI and compares to the golden set (needs an AI key). Last run: 20/20.
- `node --no-warnings --env-file=.env scripts/test_webhook.ts` end-to-end webhook test against a local server.

## Deploy (Vercel)
Import the GitHub repo, set **Root Directory** to `web`, add the variables from `.env`, then register
`https://<app>.vercel.app/api/webhooks/vaani?secret=<VAANI_WEBHOOK_SECRET>` in Vaani (Settings → Webhooks).
