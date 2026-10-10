Subject: Webhooks page missing + call-history API error (agent 527ad8ad-3ab9-42a4-a630-0cc99eaf1c86)

Hi Vaani team,

I'm building an inbound lead-qualification agent on your platform (agent id 527ad8ad-3ab9-42a4-a630-0cc99eaf1c86, account: souvik_pati@pg27.mesaschool.co). Two things block me:

1. Your docs (Guides > Webhook Setup) say webhooks are registered under Settings > Webhooks, but my dashboard's Settings page only shows "Organisation Defaults, Team, Notifications". Could you enable webhooks for my workspace, or tell me where to register one? I need the `call_postprocessing` event (transcript, summary, entities, recording_url) posted to my server.

2. GET https://api.vaanivoice.ai/api/call-history?page=1&page_size=5 with a valid X-API-Key returns:
   {"status_code":500,"error":"Internal Server Error","message":"Error fetching call history: 400: Invalid client_id format","path":"/api/call-history/e123ad8a-f0f1-70da-a2d1-f4ac2bc79694/Souvik"}
   It looks like the client name ("Souvik") is being used where a client id is expected. Other endpoints (list-agents, create-agent, PATCH sections) work fine with the same key.

Also: for web test calls (WebRTC and chat), does the call_postprocessing webhook fire, and does it include the caller's phone number or is it masked?

Thank you.
