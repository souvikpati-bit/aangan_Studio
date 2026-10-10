# Vaani Voice agent

Platform: **vaanivoice.ai** (API `api.vaanivoice.ai`, header `X-API-Key`).

## Created by script (`npm run vaani:create`, safe to re-run)
- Agent **Aangan Studio Front Desk**; its id is `VAANI_AGENT_ID` in `.env`.
- System prompt: `agent/vaani_system_prompt.txt`, generated from `agent/prompt.ts` by `npm run vaani:prompt`. It contains no pricing, never promises a booking it cannot make, and was scanned for price leaks.
- Greeting says it is an AI and that the call may be recorded; the greeting can be interrupted.
- English with automatic language detection; silence timers lengthened so callers are not cut off; 10-minute call limit.
- 18 post-call data points (call type, name, property, locality, area, scope, timeline words, execution yes/no, decision-maker, budget volunteered, referrer, how found, price asked, consultation mode, availability, recording declined, wants a person).

## Set up in the Vaani dashboard
- **Webhook** (Developers > Webhooks): endpoint `https://<app>/api/webhooks/vaani`, agent Aangan Studio Front Desk, event **Call Post-Processing**. The endpoint treats the message only as a doorbell and fetches the call from Vaani with the API key, so no secret is stored in Vaani.
- **Cal.com:** an API key and two event types (60-minute site visit, 30-minute phone consultation) exist; linking them in Vaani (Integrations) is what lets the agent book on the call.

## Limits worth knowing
- Vaani's own call-list endpoint returns an error for this account, so calls arrive through the webhook, or can be added by session id.
- Webhook payloads may mask phone numbers, so returning-caller recognition depends on what Vaani sends.
- The Vaani wallet needs credit for calls to be answered.
