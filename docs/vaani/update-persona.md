> ## Documentation Index
> Fetch the complete documentation index at: https://docs.vaanivoice.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Update Persona

> Partially update the persona section of an agent

## Update Agent Persona

Partially update the **persona** section of an agent. Only the fields you include are deep-merged into the existing configuration; omitted fields are left unchanged.

The persona section controls the agent's **identity** (system prompt, greeting), **AI providers** (STT / LLM / TTS), **actions**, **memories**, and **metadata**.

***

## Path Parameters

<ParamField path="agent_id" type="string" required>
  UUID of the agent to update.
</ParamField>

***

## Body Parameters

<ParamField body="identity" type="object">
  Core identity settings.

  <Expandable title="identity fields">
    <ParamField body="system_prompt" type="string">
      The main system prompt that drives the agent's behaviour.
    </ParamField>

    <ParamField body="personality" type="object">
      Key-value map of personality traits (e.g. `{"tone": "friendly"}`).
    </ParamField>

    <ParamField body="greeting_message" type="object">
      Controls the opening message spoken by the agent.

      <Expandable title="greeting_message fields">
        <ParamField body="agent_message" type="string">
          Text the agent says at the start of the call.
        </ParamField>

        <ParamField body="agent_speech_delay" type="integer">
          Delay (seconds, 0–60) before the agent speaks.
        </ParamField>

        <ParamField body="user_speech_delay" type="integer">
          Silence gap (seconds, 0–60) after user stops talking.
        </ParamField>

        <ParamField body="interruptible" type="boolean">
          Whether the greeting can be interrupted by the user.
        </ParamField>

        <ParamField body="let_user_speak_first" type="boolean">
          If `true`, the agent waits for the user to speak before greeting.
        </ParamField>
      </Expandable>
    </ParamField>
  </Expandable>
</ParamField>

<ParamField body="senses_capabilities" type="object">
  AI provider configuration for speech-to-text, LLM, and text-to-speech.

  <Expandable title="senses_capabilities fields">
    <ParamField body="language" type="string">
      Primary language code (e.g. `"en"`, `"hi"`).
    </ParamField>

    <ParamField body="auto_detect" type="boolean">
      Enable automatic language detection.
    </ParamField>

    <ParamField body="ears" type="object">
      STT (speech-to-text) configuration.

      <Expandable title="ears.stt fields">
        <ParamField body="primary.provider" type="string">STT provider name.</ParamField>
        <ParamField body="primary.model" type="string">STT model identifier.</ParamField>
        <ParamField body="primary.language" type="string">Language hint for STT.</ParamField>
        <ParamField body="primary.keywords" type="array">Keywords to boost recognition accuracy.</ParamField>
        <ParamField body="fallback" type="object">Fallback STT provider (same shape as `primary`).</ParamField>
      </Expandable>
    </ParamField>

    <ParamField body="brain" type="object">
      LLM configuration.

      <Expandable title="brain.llm fields">
        <ParamField body="primary.provider" type="string">LLM provider name (e.g. `"openai"`).</ParamField>
        <ParamField body="primary.model" type="string">Model identifier (e.g. `"gpt-4o"`).</ParamField>
        <ParamField body="primary.parameters.temperature" type="number">Sampling temperature (0–1).</ParamField>
        <ParamField body="primary.parameters.top_p" type="number">Top-p sampling (0–1).</ParamField>
        <ParamField body="primary.parameters.max_tokens" type="integer">Max tokens (50–10000).</ParamField>
        <ParamField body="auto_detect_llm" type="boolean">Auto-select the best LLM for the detected language.</ParamField>
        <ParamField body="fallback" type="object">Fallback LLM provider (same shape as `primary`).</ParamField>
      </Expandable>
    </ParamField>

    <ParamField body="mouth" type="object">
      TTS (text-to-speech) configuration.

      <Expandable title="mouth.tts fields">
        <ParamField body="primary.provider" type="string">TTS provider name (e.g. `"elevenlabs"`).</ParamField>
        <ParamField body="primary.model" type="string">TTS model identifier.</ParamField>
        <ParamField body="primary.voice_id" type="string">Voice ID.</ParamField>
        <ParamField body="primary.voice_name" type="string">Voice name.</ParamField>
        <ParamField body="primary.config" type="object">Provider-specific config key-value pairs.</ParamField>
        <ParamField body="word_pronunciation_pairs" type="object">Map of words to their preferred pronunciation.</ParamField>
        <ParamField body="fallback" type="object">Fallback TTS provider (same shape as `primary`).</ParamField>
      </Expandable>
    </ParamField>
  </Expandable>
</ParamField>

<ParamField body="actions" type="object">
  Custom actions the agent can take during a call (provider-specific shape).
</ParamField>

<ParamField body="memories" type="object">
  Memory configuration for the agent (provider-specific shape).
</ParamField>

<ParamField body="metadata" type="object">
  Arbitrary metadata key-value pairs attached to the persona.
</ParamField>

***

## Request Example

<RequestExample>
  ```bash cURL theme={null}
  curl -X PATCH https://api.vaanivoice.ai/api/agent/7ec4155e-0e62-440a-b983-5974f7697854/persona \
    -H "X-API-Key: vaani_<your_key>" \
    -H "Content-Type: application/json" \
    -d '{
      "identity": {
        "system_prompt": "You are a helpful customer service agent.",
        "greeting_message": {
          "agent_message": "Hi! How can I help you today?",
          "agent_speech_delay": 1,
          "interruptible": true
        }
      },
      "senses_capabilities": {
        "language": "en",
        "brain": {
          "llm": {
            "primary": {
              "provider": "openai",
              "model": "gpt-4o",
              "parameters": { "temperature": 0.7 }
            }
          }
        }
      }
    }'
  ```

  ```javascript JavaScript theme={null}
  const response = await fetch(
    "https://api.vaanivoice.ai/api/agent/7ec4155e-0e62-440a-b983-5974f7697854/persona",
    {
      method: "PATCH",
      headers: {
        "X-API-Key": "vaani_<your_key>",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identity: {
          system_prompt: "You are a helpful customer service agent.",
          greeting_message: {
            agent_message: "Hi! How can I help you today?",
            agent_speech_delay: 1,
            interruptible: true,
          },
        },
      }),
    }
  );
  const data = await response.json();
  console.log(data);
  ```

  ```python Python theme={null}
  import requests

  requests.patch(
      "https://api.vaanivoice.ai/api/agent/7ec4155e-0e62-440a-b983-5974f7697854/persona",
      headers={"X-API-Key": "vaani_<your_key>", "Content-Type": "application/json"},
      json={
          "identity": {
              "system_prompt": "You are a helpful customer service agent.",
              "greeting_message": {
                  "agent_message": "Hi! How can I help you today?",
                  "agent_speech_delay": 1,
                  "interruptible": True,
              },
          }
      },
  )
  ```
</RequestExample>

***

## Response

<ResponseExample>
  ```json Success (200) theme={null}
  {
    "agent_id": "d665d65d-f1f1-4c23-aee2-0675bd3ec06f",
    "client_id": "e3e5b338-937e-4672-a700-1a1f5817a385",
    "user_id": "8133cd0a-e071-7057-744a-f8f60603ae56",
    "metadata": {
      "environment": "qa",
      "version": "1"
    },
    "integration_secrets": {
      "CAL": "********",
      "WHATSAPP": "********",
      "CAL_API_KEY": "********",
      "WHATSAPP_ACCESS_TOKEN": "********"
    },
    "agent_display_name": "agent creation api",
    "last_edited_at": "2026-09-22T05:06:28.844081",
    "published_at": null,
    "persona": {
      "metadata": {
        "environment": "qa",
        "version": "1"
      },
      "identity": {
        "personality": {
          "male": "default personality",
          "tone": "friendly",
          "style": "professional"
        },
        "greeting_message": {
          "agent_message": "Hello, I am your support assistant.",
          "agent_speech_delay": 2,
          "interruptible": true,
          "let_user_speak_first": false,
          "user_speech_delay": 3
        },
        "system_prompt": "BASE_SYSTEM_PROMPT"
      },
      "senses_capabilities": {
        "language": "en",
        "auto_detect": false,
        "ears": {
          "stt": {
            "primary": {
              "provider": "deepgram",
              "model": "nova-3",
              "language": "en",
              "keywords": [],
              "config": {}
            },
            "fallback": {
              "provider": "assemblyai",
              "model": "best",
              "config": {
                "end_of_turn_confidence_threshold": 0.5,
                "min_end_of_turn_silence_when_confident": 160,
                "max_turn_silence": 1280,
                "format_turns": true
              }
            }
          }
        },
        "brain": {
          "llm": {
            "primary": {
              "provider": "google",
              "model": "gemini-3.5-flash",
              "parameters": {
                "temperature": 0.7,
                "top_p": 1,
                "max_tokens": 500
              }
            },
            "fallback": {
              "provider": "azure",
              "model": "gpt-4o",
              "parameters": {
                "temperature": 0.7,
                "top_p": 1,
                "max_tokens": 500
              }
            },
            "auto_detect": false
          }
        },
        "mouth": {
          "tts": {
            "primary": {
              "provider": "cartesia",
              "model": "sonic-3-2025-10-27",
              "voice_id": "1259b7e3-cb8a-43df-9446-30971a46b8b0",
              "voice_name": "devansh",
              "is_cloned": false,
              "config": {
                "speed": 1,
                "language": "en",
                "emotion": [
                  "positivity:highest",
                  "curiosity:highest"
                ],
                "emotions": []
              }
            },
            "fallback": {
              "provider": "elevenlabs",
              "model": "eleven_flash_v2_5",
              "voice_id": "9T9vSqRrPPxIs5wpyZfK",
              "is_cloned": false,
              "config": {
                "language": "en"
              }
            },
            "word_pronunciation_pairs": {}
          }
        }
      },
      "actions": {
        "agent_id": "d665d65d-f1f1-4c23-aee2-0675bd3ec06f",
        "agent_name": "vaaniairesearchpvt.ltd.agentcreationapi",
        "functions": [],
        "count": 0
      },
      "memories": {
        "agent_id": "d665d65d-f1f1-4c23-aee2-0675bd3ec06f",
        "agent_ids": [
          "d665d65d-f1f1-4c23-aee2-0675bd3ec06f"
        ],
        "agent_name": "vaaniairesearchpvt.ltd.agentcreationapi",
        "use_previous_call_contexts": false,
        "max_history_calls": 5,
        "feed_context_api": {},
        "use_rag": false,
        "knowledge_bases": [],
        "total_count": 0
      },
      "timezone": "Asia/Kolkata",
      "agent_gender": null
    },
    "training": {
      "knowledge": {
        "use_rag": false,
        "rag_knowledge_base_dict": {
          "knowledge_bases": {}
        }
      },
      "know_how": {
        "faq": {},
        "pain_points": {},
        "faq_merged": {},
        "pain_points_merged": {},
        "faq_json_file_url": null,
        "pain_points_json_file_url": null,
        "guardrails": {}
      }
    },
    "experience": {
      "conversational_experience": {
        "bg_noise": {},
        "filler_words": {
          "filler_words": false,
          "filler_words_frequency": 0,
          "filler_words_list": []
        },
        "filler_words_frequency": 0,
        "filler_words_list": [],
        "breathing_sound": {},
        "eagerness_to_speak": "fast",
        "patience_with_user_entries": {},
        "mood_mapping": {}
      },
      "settings": {
        "idle_conversation_settings": {
          "pulse_check": true,
          "end_conversation_on_idle": true,
          "idle_call_hangup_timeout": 10,
          "idle_call_warning_timeout": 10,
          "idle_call_hangup_message": "Thank you for calling. Hanging up due to inactivity.",
          "idle_call_warning_message": "Hello, you have been inactive for a while. Please let me know if you need help.",
          "idle_call_hangup_messages": null,
          "idle_call_warning_messages": null,
          "initial_idle_call_warning_timeout": 5,
          "initial_idle_call_hungup_timeout": 20,
          "initial_warning_message": "are u there",
          "initial_warning_messages": null
        },
        "end_call": {
          "enabled": true,
          "end_call_phrase": null,
          "hangup_timeout": null,
          "conditional_end_call_phrases": {
            "enabled": false,
            "phrases": []
          }
        },
        "call_settings": {
          "max_duration_action": "hang_up",
          "max_duration_hangup_message": "The maximum call duration has been reached. Thank you for your time. Goodbye.",
          "max_duration_transfer_message": ""
        },
        "voice_volume_step": null,
        "vad_watcher": {
          "empty_transcript_wait": 6,
          "max_consecutive_noise": 3,
          "noise_hangup_message": "There is too much noise in background, unable to understand. Please call back at a better time.",
          "noise_response_phrases": [
            "Sorry, I couldn't hear you properly. Could you speak a little louder?",
            "I didn't catch that. Would you mind speaking up a bit?",
            "Your voice isn't very clear. Could you please say that again a little louder?"
          ]
        },
        "stuck_watcher": {
          "thinking_timeout": 15,
          "speaking_timeout": 30,
          "thinking_message": "Please give me a moment while I check that for you.",
          "network_issue_message": "I am experiencing network issues and unable to proceed further. Hanging up."
        }
      }
    },
    "analysis": {
      "evaluations": {
        "dispositions": {},
        "conversation_evaluation": {
          "enabled": false
        }
      },
      "extraction": {
        "data_collection": {
          "enabled": false,
          "data_points": []
        },
        "collect_concerns": {}
      }
    },
    "deployment_config": {},
    "system_prompt_config": {},
    "webhook": null,
    "gsheet_config": {},
    "extra_params": {
      "flexprice_customer_id": "cust_01KK4GED0RDKADASQQA1TZ9E4J",
      "flexprice_wallet_id": "wallet_01KV8135E83EH0MG58HCEEBV0S"
    },
    "frontend_features": {
      "recording": false,
      "transcript": false,
      "summary": false,
      "conversation_evaluation": false,
      "extracted_information": true,
      "preemptive_generation": false,
      "volume_control": true
    },
    "static_prompt_ids": [],
    "warnings": []
  }
  ```
</ResponseExample>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.