> ## Documentation Index
> Fetch the complete documentation index at: https://docs.vaanivoice.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Post-Call Analysis & Deployment

> Configure call dispositions, entity extraction, conversation evaluations, and phone number deployment for your voice agent

After an agent completes a phone call, Vaani automatically runs post-call analysis to evaluate the conversation, assign outcome dispositions, and extract structured business data from the transcript. This page guides you through setting up post-call analysis and configuring your agent's deployment routes.

## Video Walkthrough

<div style="position: relative; padding-bottom: 62.7906976744186%; height: 0;">
  <iframe src="https://www.loom.com/embed/794b93a1c35441a4845a89ff9109f247" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" />
</div>

## Post-Call Intelligence Overview

Post-call processing turns raw audio conversations into actionable business intelligence:

* **Dispositions & Tags** — Automatically label the outcome of every call (e.g. `Interested`, `Not Interested`, `Callback Requested`, `Voicemail`, or `Wrong Number`).
* **Condition & Evaluation Prompts** — Instruct an LLM judge to evaluate conversation quality, compliance adherence, or whether specific criteria were satisfied.
* **Entity & Data Extraction** — Extract structured contact details and caller intent directly from the dialog, including name, email, phone number, address, appointment date/time, and custom fields.
* **Telephony Deployment** — Bind provisioned or imported phone numbers to your agent for inbound call reception and outbound dialing pools.

***

## Configuring Post-Call Analysis

<Steps>
  <Step title="Navigate to Agent Analysis Settings">
    In the dashboard, open **Agent Config** → select your agent → go to the **Analysis** (or **Post-Call**) tab.
  </Step>

  <Step title="Define Call Dispositions & Tags">
    Enable disposition tagging to categorize call outcomes based on transcript analysis.

    Add custom disposition tags such as:

    * **Customer Interest**: `Interested`, `Not Interested`, `Follow-up Required`
    * **Outcome Category**: `Call Transferred`, `Demo Scheduled`, `Do Not Call`
    * **Call Status**: `Voicemail Detected`, `Hung Up Early`
  </Step>

  <Step title="Set Up Conversation Evaluation Prompts">
    Configure evaluation rules that assess how the conversation progressed:

    * Write condition prompts that evaluate whether the agent achieved its goal (e.g. *"Did the customer agree to schedule a property visit?"*).
    * Set expected response formats (boolean `true/false`, rating scores, or categorical classifications).
  </Step>

  <Step title="Configure Entity & Data Extraction">
    Define the structured entities you want extracted from every conversation:

    * **Lead Contact Details**: Customer Name, Email Address, Alternate Phone Number, Postal Address.
    * **Call Intent**: Reason for calling, product of interest, budget range.
    * **Action Items**: Preferred callback time, meeting slot, or special requests.

    These extracted entities will be saved in your call analytics and forwarded via webhooks to your CRM.
  </Step>
</Steps>

***

## Agent Deployment & Telephony Binding

Once your analysis pipeline is set, configure how your agent connects to live telephone numbers:

<Steps>
  <Step title="Open Deployment Settings">
    In your agent configuration, navigate to the **Deployment** tab.
  </Step>

  <Step title="Assign Phone Numbers">
    Choose how the agent interacts with telephony:

    * **Inbound Number**: Assign an inbound phone number so incoming callers are automatically connected to this agent.
    * **Outbound Pool**: Select one or more provisioned numbers to use as the caller ID for outbound API calls and campaigns.
  </Step>

  <Step title="Import External SIP Credentials (Optional)">
    If you bring your own telephony carriers (such as Plivo, Telnyx, Twilio, or other SIP providers), enter your SIP domain and authentication credentials in **Settings → Telephony** to attach external numbers to your deployment pool.
  </Step>

  <Step title="Save and Deploy">
    Click **Save Changes**. Your agent is now fully equipped with post-call processing and live phone routing.
  </Step>
</Steps>

***

## Troubleshooting

<AccordionGroup>
  <Accordion title="Entities or contact details are missing from call results">
    Ensure the caller actually provided that information during the conversation. If the information was spoken, check that the entity extraction prompt explicitly lists the field name (e.g., `email_address`, `appointment_time`) and specifies clear extraction instructions.
  </Accordion>

  <Accordion title="Disposition tags are inconsistent or inaccurate">
    Review your disposition definitions. Provide explicit, unambiguous descriptions for each tag (e.g., instead of just "Interested", specify "Customer explicitly agreed to hear more or asked for pricing details").
  </Accordion>

  <Accordion title="Inbound calls are not reaching my agent">
    Verify under **Deployment → Inbound** that the phone number is assigned specifically to this agent. A single phone number can only route inbound calls to one agent at a time.
  </Accordion>

  <Accordion title="Where can I see the post-call analysis results?">
    Post-call results appear in the dashboard under **Call History** / **Call Details** once the call finishes. They are also sent automatically in the `call_postprocessing` payload if you have configured a [Webhook](/guides/webhook-setup).
  </Accordion>
</AccordionGroup>

***

## Next Step

<Card title="Deploy Your Agent" icon="rocket" href="/getting-started/deploy-agent">
  Attach phone numbers, configure calling windows, and launch production campaigns
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.