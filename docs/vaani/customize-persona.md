> ## Documentation Index
> Fetch the complete documentation index at: https://docs.vaanivoice.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Customize Persona of Your Agent

> Fine-tune system prompts, greeting behavior, STT & TTS voice engines, custom tool calling, and cross-call memory

After creating your initial voice agent, you can customize its persona to match your brand's voice and operational requirements. Fine-tuning your agent's persona controls how it greets callers, how accurately it hears speech, its vocal tone and emotional expression, its memory across calls, and the external tools it can execute during live conversations.

## Video Walkthrough

<div style="position: relative; padding-bottom: 62.7906976744186%; height: 0;">
  <iframe src="https://www.loom.com/embed/830ca7036f68471c94fb1a819d700285" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" />
</div>

## Persona Configuration Pillars

Customizing an agent consists of four main areas:

1. **Identity & Greeting** — Defining who the agent is, its initial opening line, speech delay, and conversational pacing.
2. **Senses & Capabilities (AI Pipeline)** — Choosing the best Speech-to-Text (STT), Large Language Model (Brain), and Text-to-Speech (TTS) voice engines.
3. **Tools & Integrations** — Enabling the agent to look up customer data, book appointments, or trigger APIs via cURL integrations mid-call.
4. **Context & Memory** — Giving the agent recall of past conversations with the same caller or shared knowledge across agents.

***

## Step-by-Step Customization

<Steps>
  <Step title="Configure Identity & Greeting">
    Open **Agent Config** → select your agent → navigate to **Persona → Identity**:

    * **System Prompt**: Refine the instructions, guidelines, and behavioral traits for your agent. Use curly braces like `{customer_name}` or `{company_name}` for dynamic metadata variables.
    * **Greeting Message**: Specify the exact first words the agent says when the call connects.
    * **Speech Delays & Interruption**: Configure `agent_speech_delay` (how soon it speaks), silence tolerance before responding, and whether the caller is allowed to interrupt the greeting (`interruptible: true`).
    * **Let User Speak First**: Enable this if you prefer the agent to wait for the caller to say "Hello?" before delivering its opening line.
  </Step>

  <Step title="Set Up Ears (Speech-to-Text / STT)">
    Go to **Senses & Capabilities → Ears**:

    * **Primary Provider**: We recommend **Deepgram** for ultra-low latency and superior conversational transcription.
    * **Fallback Provider**: Configure **AssemblyAI** (or another supported STT engine) as a fallback in case the primary engine encounters network anomalies.
    * **Keyword Boosting & Special Words**: Add difficult or phonetically ambiguous terms (such as brand names, technical jargon, or place names like *"Mississippi"*) so the STT engine transcribes them accurately.
  </Step>

  <Step title="Select Brain (LLM) & Mouth (Voice / TTS)">
    Fine-tune the intelligence and voice of your agent:

    * **LLM Engine**: Choose the underlying language model and temperature based on your need for creative dialog vs. strict procedural accuracy.
    * **Voice & TTS**: Select a voice model suited to your brand's regional accent, gender, and language.
    * **Emotion & Pace**: Adjust speaking rate and emotional tone (e.g., cheerful, empathetic, or authoritative).
    * **Pronunciation Dictionaries**: Provide custom phonetic respellings for words or acronyms the text-to-speech engine might otherwise mispronounce.
  </Step>

  <Step title="Add Custom Tools via cURL">
    Equip your agent to perform actions while on the call:

    * Paste a standard **cURL** request for your webhook or REST endpoint (e.g., check account balance, verify OTP, or schedule a calendar invite).
    * Provide clear natural-language descriptions of when the agent should trigger the tool.
  </Step>

  <Step title="Enable Agent Memory">
    Activate conversational recall under the **Memory** settings:

    * **Previous Calls Memory**: Enables the agent to remember context, preferences, and action items from prior calls with the same phone number.
    * **Cross-Agent Memory**: Allows context to persist even if a customer speaks with different agents across multiple departments.
  </Step>
</Steps>

***

## Troubleshooting

<AccordionGroup>
  <Accordion title="The agent speaks before the caller finishes talking">
    Adjust the silence tolerance and user speech delay settings in your greeting and persona configurations. Increasing the pause threshold by 200–500ms prevents the agent from cutting in while the caller takes a breath.
  </Accordion>

  <Accordion title="The agent misinterprets specific brand or product names">
    Add the problematic terms to the **Keyword Boosting** list in your STT configuration, or add them to the **Pronunciation Dictionary** with their phonetic equivalents.
  </Accordion>

  <Accordion title="Can I change an agent's voice or prompt while calls are active?">
    Yes. Edits saved in the dashboard apply to all new calls immediately. In-flight calls will finish using the configuration with which they were initiated.
  </Accordion>

  <Accordion title="My custom tool isn't being called by the agent">
    Verify that the tool's natural-language description clearly explains what triggers it and what arguments it requires. Also ensure that the external endpoint returns a response within 2–3 seconds so the conversation doesn't stall.
  </Accordion>
</AccordionGroup>

***

## Next Step

<Card title="Voice Lab" icon="microphone" href="/getting-started/voice-lab">
  Browse, audition, and swap realistic AI voices across providers like Cartesia and ElevenLabs
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.