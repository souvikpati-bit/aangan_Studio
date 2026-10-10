# Vaani Voice agent: status

Platform: **vaanivoice.ai** (API: `api.vaanivoice.ai`, docs: docs.vaanivoice.ai, header `X-API-Key`). Not vaanilabs.in.

## Created by script (`npm run vaani:create`, safe to re-run)
- Agent: **Aangan Studio Front Desk**, id saved as `VAANI_AGENT_ID` in `.env`
- System prompt: `agent/vaani_system_prompt.txt` (scanned: no price leaks; no pricing.md content)
- Greeting: AI + recording disclosure, then "How can I help you today?"
- Language: English, auto-detect on (for Hindi/Hinglish)
- Max call length: 10 minutes, then hang up
- Post-call extraction: 18 data points (call type, name, property, locality, area, scope, timeline words, execution yes/no, decision-maker, budget volunteered, referrer, how found, price asked, consult mode, availability, recording declined, wants human)

## Still to do in the Vaani dashboard (needs your login)
1. **Phone number**: Settings / Telephony, attach a number, then set it as the agent's inbound number.
2. **Cal.com**: Settings → Integrations → Cal.com. Paste the Cal.com API key and choose the event type (the agent then books during the call).
3. **Webhook**: Settings → Webhooks. URL = `https://<vercel-app>/api/webhooks/vaani` (after deploy). Event used: `call_postprocessing` (carries transcript, summary, entities, recording_url).
4. **Recording**: turn recording on for the agent if the dashboard has a toggle. The API ignores it.
5. **Test**: use the dashboard's in-browser test call before using a real number.

## Known limits
- Per-call variables (like today's date) are only documented for outbound calls. The agent is told never to guess dates; exact dates come from the booking tool and from the call timestamp.
- Webhook payloads may mask phone numbers. Checked at first real call.
