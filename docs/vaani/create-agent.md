> ## Documentation Index
> Fetch the complete documentation index at: https://docs.vaanivoice.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Create Agent

> Create a new agent and associate it with your account

## Create Agent

Create a new agent and associate it with the authenticated user's client. The `client_id` is automatically extracted from your API key — you don't need to supply it.

***

## Parameters

<ParamField body="agent_display_name" type="string" required>
  Human-readable name for the agent (e.g. `"support-bot"`)
</ParamField>

<ParamField body="config" type="object" default="{}">
  Optional initial configuration for the agent. You can pass any subset of the agent config sections here or leave it empty and configure them later via the section PATCH endpoints.

  <Expandable title="config structure">
    <ParamField body="persona" type="object">
      Persona section — identity, senses/capabilities, actions, memories.
    </ParamField>

    <ParamField body="training" type="object">
      Training section — knowledge base (RAG), FAQ, guardrails.
    </ParamField>

    <ParamField body="experience" type="object">
      Experience section — conversational feel, call settings.
    </ParamField>

    <ParamField body="analysis" type="object">
      Analysis section — dispositions, data extraction.
    </ParamField>

    <ParamField body="deployment_config" type="object">
      Deployment section — phone call-type routing.
    </ParamField>
  </Expandable>
</ParamField>

***

## Request Example

<RequestExample>
  ```bash cURL theme={null}
  curl -X POST https://api.vaanivoice.ai/api/create-agent \
    -H "X-API-Key: vaani_<your_key>" \
    -H "Content-Type: application/json" \
    -d '{
      "agent_display_name": "support-bot",
      "config": {
        "persona": {
          "identity": {
            "system_prompt": "You are a helpful customer support agent."
          }
        }
      }
    }'
  ```

  ```javascript JavaScript theme={null}
  const response = await fetch("https://api.vaanivoice.ai/api/create-agent", {
    method: "POST",
    headers: {
      "X-API-Key": "vaani_<your_key>",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_display_name: "support-bot",
      config: {
        persona: {
          identity: {
            system_prompt: "You are a helpful customer support agent.",
          },
        },
      },
    }),
  });

  const data = await response.json();
  console.log(data);
  ```

  ```python Python theme={null}
  import requests

  response = requests.post(
      "https://api.vaanivoice.ai/api/create-agent",
      headers={
          "X-API-Key": "vaani_<your_key>",
          "Content-Type": "application/json",
      },
      json={
          "agent_display_name": "support-bot",
          "config": {
              "persona": {
                  "identity": {
                      "system_prompt": "You are a helpful customer support agent."
                  }
              }
          },
      },
  )
  print(response.json())
  ```
</RequestExample>

***

## Response

<ResponseExample>
  ```json Success (200) theme={null}
  {
    "success": true,
    "agent_id": "7ec4155e-0e62-440a-b983-5974f7697854",
    "agent_name": "support-bot",
    "client_id": "9abf5eff-e978-4e87-954d-7ff6ba570796"
  }
  ```
</ResponseExample>

<ResponseField name="success" type="boolean">
  `true` when the agent was created successfully.
</ResponseField>

<ResponseField name="agent_id" type="string">
  UUID of the newly created agent. Use this in subsequent PATCH calls and when triggering calls.
</ResponseField>

<ResponseField name="agent_name" type="string">
  Display name of the new agent.
</ResponseField>

<ResponseField name="client_id" type="string">
  Client UUID the agent was associated with (resolved from your API key).
</ResponseField>

## Video Walkthrough

<div style="position: relative; padding-bottom: 62.7906976744186%; height: 0;">
  <iframe src="https://www.loom.com/embed/63ef773a48fd43e4840458066bbd0232" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" />
</div>

***


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.