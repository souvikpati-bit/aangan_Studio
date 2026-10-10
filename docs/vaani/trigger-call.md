> ## Documentation Index
> Fetch the complete documentation index at: https://docs.vaanivoice.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Create Dispatch

> Trigger an outbound telephony call or an in-browser WebRTC session

## Create Dispatch

Trigger an outbound call or an in-browser WebRTC session with a single endpoint.

Use the `medium` parameter to choose the delivery channel:

| `medium` | What happens |
| - | - |
| `"telephony"` (default) | Outbound SIP/PSTN call to `contact_number` |
| `"webrtc"` | In-browser WebRTC session — returns a LiveKit token and connection URL |

***

## Important Concepts

### Agent ID

You must pass an **`agent_id`**, which is a **UUID** that uniquely identifies an agent.

You can obtain the `agent_id` from the **Agent Config** page on the Vaani portal:

* Go to **app.vaanivoice.ai**
* Navigate to **Agent Config**
* Select your agent
* Copy the **Agent ID (UUID)**

### Metadata

The `metadata` object contains **template variables** that you configure while creating the agent.

* Each key in `metadata` corresponds to a variable used in the agent's prompt or flow
* These values are dynamically injected at call time
* The structure depends on how the agent was configured

### Modify Agent (Runtime Config Override)

The `modify_agent` parameter allows you to override parts of the agent configuration at call time. This works for **both** `telephony` and `webrtc` mediums. It is useful for:

* Customizing agent behavior per call without creating multiple agents
* Dynamically adjusting settings based on the contact or campaign
* Testing configuration changes before making them permanent

**Important Rules:**

1. Only the following top-level sections are accepted:
   * `persona` - Agent persona (identity, senses\_capabilities, actions, memories)
   * `training` - Agent training (knowledge, know\_how, guardrails)
   * `experience` - Agent experience (conversational\_experience, settings)
   * `analysis` - Agent analysis (evaluations, extraction)

2. You must provide the **complete JSON structure** for any section you want to modify. The provided configuration will be **deep-merged** with the agent's base config, with `modify_agent` values taking priority.

3. For nested objects, only the keys you provide will be overridden - other keys in the base config will be preserved.

***

## Required Fields

* `agent_id`: Agent UUID from the Agent Config page
* `medium`: `"telephony"` (default) or `"webrtc"`

### Required for `medium="telephony"` only

* `contact_number`: Contact number with country code (e.g., +919876543210)
* `name`: Customer name

### Optional Telephony Fields

* `outbound_number`: Specific outbound caller ID to use (E.164 format)
* `dnd_check_skipped`: Set to `true` to skip the Do Not Disturb (DND) check

### Optional WebRTC Fields (ignored for `medium="telephony"`)

* `voice_gender`: `"male"` | `"female"` (default: `"female"`)
* `primary_language`: Primary language code, e.g. `"en"`, `"hi"` (default: `"hi"`)
* `secondary_language`: Fallback language code (default: `"en"`)
* `welcome_message`: Custom greeting the agent speaks on connect
* `welcome_interruptible`: Whether the welcome message can be interrupted (default: `true`)
* `bg_noise_enabled`: Enable background noise (default: `false`)
* `bg_noise_volume`: Background noise volume 0–100 (default: `60`)
* `voice_speed`: Speech speed multiplier 0.6–1.4 (default: `1.0`)

### Runtime Config Override

* `modify_agent`: Agent config sections to override at call time (supported for both mediums)

***

## Parameters

<ParamField header="X-Agent-Id" type="string">
  Optional. A custom identifier forwarded to your BYOL WebSocket server in the
  `x_agent_id` field of every turn request's `req_body`. (THIS IS NOT SAME AS
  `agent_id` WHICH YOU PASS IN THE req.body IT IS YOUR CUSTOM ID WHICH YOU WANT
  TO USE) Useful for routing or auditing across multiple agents sharing the same
  WebSocket server.
</ParamField>

<ParamField body="agent_id" type="string" required>
  Agent UUID obtained from the Agent Config page on the portal
</ParamField>

<ParamField body="medium" type="string" default="telephony">
  Call delivery medium: `"telephony"` for an outbound SIP/PSTN call, or
  `"webrtc"` for an in-browser WebRTC session.
</ParamField>

<ParamField body="metadata" type="object" default="{}">
  Template variables configured while creating the agent
</ParamField>

<ParamField body="modify_agent" type="object" default="null">
  Runtime configuration override. Accepted for both mediums. Accepts only these top-level keys: `persona`, `training`, `experience`, `analysis`. Each key must contain the complete JSON structure for that section. Values are deep-merged with the base agent config.

  When BYOL (Bring Your Own LLM) is enabled for the agent, the full `modify_agent` object — including `persona.metadata` template variables — is forwarded to your WebSocket server in the `req_body` field of every turn request. See [BYOL request payload](/guides/byol#agent--your-server-request) and the [modify\_agent examples](#modify_agent-examples) below.

  <Expandable title="modify_agent Properties">
    <ParamField body="persona" type="object">
      Override persona configuration including:

      * `metadata` - Template variables (patient\_name, appointment\_date, etc.)
      * `identity` - Personality, greeting\_message, system\_prompt
      * `senses_capabilities` - STT, LLM, TTS configurations
      * `actions` - Agent functions
      * `memories` - RAG and knowledge bases
    </ParamField>

    <ParamField body="training" type="object">
      Override training configuration including:

      * `knowledge` - RAG settings, filler messages
      * `know_how` - FAQ, pain points, guardrails
    </ParamField>

    <ParamField body="experience" type="object">
      Override experience configuration including:

      * `conversational_experience` - Filler words, eagerness, mood
      * `settings` - Idle conversation, end call, call duration settings
    </ParamField>

    <ParamField body="analysis" type="object">
      Override analysis configuration including:

      * `evaluations` - Dispositions, conversation evaluation
      * `extraction` - Data collection, concerns
    </ParamField>
  </Expandable>
</ParamField>

### Telephony Parameters

<ParamField body="contact_number" type="string">
  Contact number with country code (e.g., +919876543210). **Required when
  `medium="telephony"`.**
</ParamField>

<ParamField body="name" type="string">
  Customer name. **Required when `medium="telephony"`.**
</ParamField>

<ParamField body="voice" type="string" default="">
  Voice preference (optional, telephony only)
</ParamField>

<ParamField body="dnd_check_skipped" type="boolean" default="false">
  Set to `true` to skip the Do Not Disturb (DND) check for this call. Telephony
  only.
</ParamField>

<ParamField body="outbound_number" type="string" default="null">
  Optional outbound caller ID to use (E.164 format). Telephony only.
</ParamField>

### WebRTC Parameters

<ParamField body="voice_gender" type="string" default="female">
  Voice gender preset: `"male"` | `"female"`. WebRTC only.
</ParamField>

<ParamField body="primary_language" type="string" default="hi">
  Primary language code for the session (e.g. `"en"`, `"hi"`). WebRTC only.
</ParamField>

<ParamField body="secondary_language" type="string" default="en">
  Fallback language code for the session. WebRTC only.
</ParamField>

<ParamField body="welcome_message" type="string">
  Custom greeting the agent speaks when the call connects. Overrides the agent's
  default greeting. WebRTC only.
</ParamField>

<ParamField body="welcome_interruptible" type="boolean" default="true">
  Whether the welcome message can be interrupted by the user speaking. WebRTC
  only.
</ParamField>

<ParamField body="bg_noise_enabled" type="boolean" default="false">
  Enable background noise for the session. WebRTC only.
</ParamField>

<ParamField body="bg_noise_volume" type="integer" default="60">
  Background noise volume (0–100). WebRTC only.
</ParamField>

<ParamField body="voice_speed" type="number" default="1.0">
  Speech speed multiplier (0.6–1.4). WebRTC only.
</ParamField>

***

## Request Body

<CodeGroup>
  ```json Telephony (default) theme={null}
  {
    "agent_id": "string (uuid)",
    "medium": "telephony",
    "contact_number": "string",
    "name": "string",
    "voice": "string",
    "metadata": {},
    "outbound_number": "string",
    "dnd_check_skipped": false,
    "modify_agent": {
      "persona": {},
      "training": {},
      "experience": {},
      "analysis": {}
    }
  }
  ```

  ```json WebRTC theme={null}
  {
    "agent_id": "string (uuid)",
    "medium": "webrtc",
    "metadata": {},
    "voice_gender": "female",
    "primary_language": "en",
    "secondary_language": "en",
    "welcome_message": "Hello! How can I help you?",
    "welcome_interruptible": true,
    "bg_noise_enabled": false,
    "bg_noise_volume": 60,
    "voice_speed": 1.0,
    "modify_agent": {
      "persona": {},
      "training": {},
      "experience": {},
      "analysis": {}
    }
  }
  ```
</CodeGroup>

***

## Request Example

<RequestExample>
  ```bash cURL — Telephony theme={null}
  curl -X POST -H "X-API-Key: vaani_<your_key>" -H "X-Agent-Id: <AgentID>" -H "Content-Type: application/json" \
   -d '{
     "agent_id": "uuid-or-agent-name",
     "medium": "telephony",
     "contact_number": "+1234567890",
     "name": "John",
     "metadata": {},
     "dnd_check_skipped": true
   }' \
   https://api.vaanivoice.ai/api/trigger-call/
  ```

  ```bash cURL — WebRTC theme={null}
  curl -X POST -H "X-API-Key: vaani_<your_key>" -H "X-Agent-Id: <YOUR_CUSTOM_ID>" -H "Content-Type: application/json" \
   -d '{
     "agent_id": "uuid-or-agent-name",
     "medium": "webrtc",
     "primary_language": "en",
     "welcome_message": "Hello! How can I help you today?"
   }' \
   https://api.vaanivoice.ai/api/trigger-call/
  ```

  ```javascript JavaScript — Telephony theme={null}
  const response = await fetch("https://api.vaanivoice.ai/api/trigger-call/", {
    method: "POST",
    headers: {
      "X-API-Key": "YOUR_API_KEY",
      "X-Agent-Id": "YOUR_CUSTOM_AGENT_ID",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: "8cf3373e-eb6f-4b4c-9f3c-324a56a91147",
      medium: "telephony",
      contact_number: "+919873446506",
      name: "Nishank",
      metadata: {},
      dnd_check_skipped: true,
    }),
  });
  const data = await response.json();
  console.log(data);
  ```

  ```javascript JavaScript — WebRTC theme={null}
  const response = await fetch("https://api.vaanivoice.ai/api/trigger-call/", {
    method: "POST",
    headers: {
      "X-API-Key": "YOUR_API_KEY",
      "X-Agent-Id": "YOUR_CUSTOM_AGENT_ID",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: "8cf3373e-eb6f-4b4c-9f3c-324a56a91147",
      medium: "webrtc",
      primary_language: "en",
      welcome_message: "Hello!",
    }),
  });
  const { token, room_name, connection_url, live_captions_url } =
    await response.json();
  // Connect to the WebRTC server using token and connection_url
  ```

  ```python Python — Telephony theme={null}
  import requests

  response = requests.post(
      "https://api.vaanivoice.ai/api/trigger-call/",
      headers={"X-API-Key": "YOUR_API_KEY", "X-Agent-Id": "YOUR_CUSTOM_AGENT_ID", "Content-Type": "application/json"},
      json={
          "agent_id": "8cf3373e-eb6f-4b4c-9f3c-324a56a91147",
          "medium": "telephony",
          "contact_number": "+919873446506",
          "name": "Nishank",
          "metadata": {},
          "dnd_check_skipped": True,
      }
  )
  print(response.json())
  ```

  ```python Python — WebRTC theme={null}
  import requests

  response = requests.post(
      "https://api.vaanivoice.ai/api/trigger-call/",
      headers={"X-API-Key": "YOUR_API_KEY", "X-Agent-Id": "YOUR_CUSTOM_AGENT_ID", "Content-Type": "application/json"},
      json={
          "agent_id": "8cf3373e-eb6f-4b4c-9f3c-324a56a91147",
          "medium": "webrtc",
          "primary_language": "en",
      }
  )
  data = response.json()
  token = data["token"]
  connection_url = data["connection_url"]
  live_captions_url = data["live_captions_url"]
  ```
</RequestExample>

***

## modify\_agent Examples

### Example 1: Football Expert Agent (Telephony)

```bash theme={null}
curl -X POST https://api.vaanivoice.ai/api/trigger-call/ \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Agent-Id: YOUR_CUSTOM_AGENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "b5d24304-db83-4072-ac9c-df219cb9a65c",
    "medium": "telephony",
    "contact_number": "+919876543210",
    "name": "Football Fan",
    "dnd_check_skipped": true,
    "modify_agent": {
      "persona": {
        "metadata": {
          "sport": "Football",
          "topic": "FIFA World Cup and Premier League"
        },
        "identity": {
          "greeting_message": {
            "agent_message": "Hello! I'\''m your Football Expert. Let'\''s talk about the beautiful game!",
            "agent_speech_delay": 1,
            "interruptible": true
          },
          "system_prompt": "You are a passionate Football expert and enthusiast. Your role is to have an engaging conversation about football. Discuss FIFA World Cup, Premier League, famous players like Messi, Ronaldo, and Mbappe. Be enthusiastic and share interesting facts about the game."
        }
      },
      "training": {
        "know_how": {
          "guardrails": {
            "custom_rules": [
              {
                "name": "Stay on Football Topic",
                "triggers": ["cricket", "basketball", "other sports"],
                "active": true,
                "handlingType": "response",
                "response": "I'\''m specifically here to talk about football! Let'\''s get back to discussing the beautiful game."
              }
            ]
          }
        }
      }
    }
  }'
```

### Example 2: Medical Appointment Reminder (Telephony)

```bash theme={null}
curl -X POST https://api.vaanivoice.ai/api/trigger-call/ \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Agent-Id: YOUR_CUSTOM_AGENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "764bcf29-a556-4bf3-9b0a-058324f423d5",
    "medium": "telephony",
    "contact_number": "+919876543210",
    "name": "Alice Smith",
    "modify_agent": {
      "persona": {
        "metadata": {
          "patient_name": "Alice Smith",
          "department": "cardiology",
          "appointment_date": "15th June",
          "appointment_time": "10:00 AM"
        },
        "identity": {
          "greeting_message": {
            "agent_message": "Hello Alice, this is a reminder about your cardiology appointment.",
            "agent_speech_delay": 1,
            "interruptible": true
          }
        }
      },
      "experience": {
        "settings": {
          "call_settings": {
            "max_call_duration": 5
          }
        }
      }
    }
  }'
```

### Example 3: Custom WebRTC Session with Override

```bash theme={null}
curl -X POST https://api.vaanivoice.ai/api/trigger-call/ \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Agent-Id: YOUR_CUSTOM_AGENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "764bcf29-a556-4bf3-9b0a-058324f423d5",
    "medium": "webrtc",
    "primary_language": "en",
    "welcome_message": "Hello! I'\''m your custom assistant.",
    "modify_agent": {
      "persona": {
        "identity": {
          "system_prompt": "You are a custom assistant specialized in product support."
        }
      },
      "experience": {
        "settings": {
          "idle_conversation_settings": {
            "idle_call_hangup_timeout": 60
          }
        }
      }
    }
  }'
```

### Example 4: Survey with Custom Data Collection (Telephony)

```bash theme={null}
curl -X POST https://api.vaanivoice.ai/api/trigger-call/ \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Agent-Id: YOUR_CUSTOM_AGENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "764bcf29-a556-4bf3-9b0a-058324f423d5",
    "medium": "telephony",
    "contact_number": "+919876543210",
    "name": "Survey Participant",
    "modify_agent": {
      "persona": {
        "identity": {
          "greeting_message": {
            "agent_message": "Hello! I'\''m calling to conduct a quick satisfaction survey."
          }
        }
      },
      "analysis": {
        "extraction": {
          "data_collection": {
            "enabled": true,
            "data_points": [
              {
                "name": "satisfaction_rating",
                "prompt": "What satisfaction rating did the customer provide (1-5)?",
                "values": ["1", "2", "3", "4", "5"],
                "nullable": false
              },
              {
                "name": "feedback_comments",
                "prompt": "What feedback or comments did the customer share?",
                "values": [],
                "nullable": true
              }
            ]
          }
        }
      }
    }
  }'
```

### Example 5: BYOL with Per-Call Template Variables (Telephony)

Use `persona.metadata` to pass per-call variables that get injected into `{{placeholder}}` references in the system prompt. These values are forwarded to your BYOL WebSocket server in `req_body.modify_agent.persona.metadata`.

```bash theme={null}
curl -X POST https://api.vaanivoice.ai/api/trigger-call/ \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Agent-Id: YOUR_CUSTOM_AGENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "535d0c34-8086-419e-b39d-ee549fc28e93",
    "medium": "telephony",
    "contact_number": "+919876543210",
    "name": "John",
    "dnd_check_skipped": true,
    "modify_agent": {
      "persona": {
        "metadata": {
          "customer_name": "John Doe",
          "account_type": "Premium",
          "subscription_end": "Dec 31, 2026"
        },
        "identity": {
          "system_prompt": "You are speaking with {{customer_name}}, who has a {{account_type}} account valid until {{subscription_end}}."
        }
      }
    }
  }'
```

***

## Response

### Telephony Success Response (200)

<ResponseExample>
  ```json Telephony theme={null}
  {
    "success": true,
    "message": "Call initiated successfully",
    "output": {
      "agent_name": "vaani321talha",
      "call_id": "outbound-1776774443-863aa698",
      "live_captions_url": "wss://api.vaanivoice.ai/api/live-transcripts/ws/outbound-1776774443-863aa698"
    },
    "error": null
  }
  ```

  ```json WebRTC theme={null}
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "room_name": "room_d083374a_c167_4bda_b8bc_2a418ca85f35_abc123",
    "agent_name": "d083374a-c167-4bda-b8bc-2a418ca85f35",
    "connection_url": "wss://rtc.vaanivoice.ai",
    "live_captions_url": "wss://api.vaanivoice.ai/api/live-transcripts/ws/room_d083374a_c167_4bda_b8bc_2a418ca85f35_abc123"
  }
  ```
</ResponseExample>

#### Telephony Response Fields

<ResponseField name="success" type="boolean">
  Whether the call was dispatched successfully
</ResponseField>

<ResponseField name="message" type="string">
  Status message — `"Call initiated successfully"` on success
</ResponseField>

<ResponseField name="output" type="object">
  Call dispatch details

  <Expandable title="Output Properties">
    <ResponseField name="agent_name" type="string">
      Name of the agent handling the call
    </ResponseField>

    <ResponseField name="call_id" type="string">
      Unique call/room identifier (e.g., `outbound-1776774443-863aa698`)
    </ResponseField>

    <ResponseField name="live_captions_url" type="string">
      WebSocket URL for real-time live captions/transcripts streaming.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="error" type="string | null">
  Error message if the operation failed, `null` on success
</ResponseField>

#### WebRTC Response Fields

<ResponseField name="token" type="string">
  Short-lived JWT for WebRTC authentication. Pass this to the WebRTC client SDK
  to connect.
</ResponseField>

<ResponseField name="room_name" type="string">
  The LiveKit room the agent has been dispatched to.
</ResponseField>

<ResponseField name="agent_name" type="string">
  Agent identifier that was dispatched.
</ResponseField>

<ResponseField name="connection_url" type="string">
  WebRTC server WebSocket URL (`wss://...`). Use this as the server URL in the
  WebRTC client SDK.
</ResponseField>

<ResponseField name="live_captions_url" type="string">
  WebSocket URL for real-time live captions/transcripts streaming.
</ResponseField>

***

## Live Captions

The `live_captions_url` in the response provides a WebSocket endpoint for streaming real-time transcripts during the call. It works identically for both telephony and WebRTC sessions.

```javascript theme={null}
const ws = new WebSocket(
  response.output?.live_captions_url ?? response.live_captions_url,
);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case "connected":
      console.log("Connected to live captions");
      break;
    case "history":
      console.log("History:", message.segments);
      break;
    case "transcript":
      console.log(`${message.segment.speaker}: ${message.segment.text}`);
      break;
    case "call_ended":
      console.log("Call ended");
      ws.close();
      break;
  }
};
```

### Message Types

| Type | Description |
| - | - |
| `connected` | Connection established |
| `history` | Historical transcript segments (sent on connect) |
| `transcript` | Real-time speech transcript |
| `turn_started` | Speaker turn started |
| `turn_ended` | Speaker turn ended |
| `interrupted` | Speaker was interrupted |
| `call_started` | Call has started |
| `call_ended` | Call has ended |
| `agent_thinking` | Agent is processing |

### Transcript Segment Structure

```json theme={null}
{
  "id": "unique-segment-id",
  "call_id": "outbound-1776774443-863aa698",
  "event_type": "transcript",
  "speaker": "agent",
  "text": "Hello, how can I help you today?",
  "timestamp": 1776774443.123,
  "is_final": true,
  "segment_index": 1,
  "was_interrupted": false,
  "confidence": 0.95
}
```

***

### Validation Error (422)

<ResponseExample>
  ```json theme={null}
  {
    "detail": [
      {
        "loc": ["body", "contact_number"],
        "msg": "field required",
        "type": "value_error.missing"
      }
    ]
  }
  ```
</ResponseExample>

<ResponseField name="detail" type="array">
  Array of validation error objects

  <Expandable title="Validation Error Properties">
    <ResponseField name="loc" type="array">
      Location of the error (path in request body)
    </ResponseField>

    <ResponseField name="msg" type="string">
      Error message
    </ResponseField>

    <ResponseField name="type" type="string">
      Error type
    </ResponseField>
  </Expandable>
</ResponseField>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.