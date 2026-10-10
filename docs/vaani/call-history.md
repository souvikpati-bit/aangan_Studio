> ## Documentation Index
> Fetch the complete documentation index at: https://docs.vaanivoice.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Call History

> Get call history for a client

## Get Call History

Get call history for a client.

Shows all calls for the client if the user belongs to that client.

## Parameters

* **Query**
  * `page` (integer, optional, default: `1`): Page number (1-indexed)
  * `page_size` (integer, optional, default: `50`, max: `200`): Number of records per page

## Request Example

<RequestExample>
  ```bash cURL theme={null}
  # API_KEY=your_api_key

  curl -H "X-API-Key:$API_KEY" "https://api.vaanivoice.ai/api/call-history?page=1&page_size=50"
  ```

  ```javascript JavaScript theme={null}
  // const API_KEY = "your_api_key";

  const response = await fetch(
    "https://api.vaanivoice.ai/api/call-history?page=1&page_size=50",
    {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
      },
    }
  );

  const data = await response.json();
  console.log(data);
  ```

  ```python Python theme={null}
  # API_KEY = "your_api_key"

  import requests

  headers = {
      "X-API-Key": API_KEY,
  }

  response = requests.get(
      "https://api.vaanivoice.ai/api/call-history",
      headers=headers,
      params={"page": 1, "page_size": 50},
  )

  print(response.json())
  ```
</RequestExample>

## Response

### Success Response (200)

<ResponseExample>
  ```json theme={null}
  {
    "data": [
      {
        "call_id": "outbound-1776774443-863aa698",
        "call_type": "Outbound",
        "call_status": "User disconnected",
        "direction": "Outbound",
        "agent_name": "vaani321talha",
        "agent_id": "7ec4155e-0e62-440a-b983-5974f7697854",
        "client_name": "vaani321",
        "client_id": "9abf5eff-e978-4e87-954d-7ff6ba570796",
        "from_number": "+918037565218",
        "to_number": "+917893209830",
        "Start_time": "2026-04-21T12:27:23.335803",
        "End_time": "2026-04-21T12:27:57.453173",
        "duration_ms": 742.269,
        "call_cost": 2.3,
        "call_summary": "The agent opened the call with a friendly greeting...",
        "call_entity": {},
        "call_eval_tag": "not enough data",
        "call_conversation_quality": {},
        "post_processing_status": "completed",
        "call_dialing_at": "2026-04-21T12:27:41.474651",
        "call_ringing_at": "2026-04-21T12:27:43.395994",
        "user_picked_up_at": "2026-04-21T12:27:53.431057",
        "recording_api": "https://api.vaanivoice.ai/api/stream/outbound-1776774443-863aa698",
        "call_transcription": "https://api.vaanivoice.ai/api/transcript/outbound-1776774443-863aa698",
        "call_metadata": {
          "name": "John",
          "phone": "+917893209830",
          "agent_name": "vaani321talha",
          "agent_id": "7ec4155e-0e62-440a-b983-5974f7697854",
          "client_id": "9abf5eff-e978-4e87-954d-7ff6ba570796"
        },
        "chat_history": [],
        "callback_requested": false,
        "callback_id": null,
        "callback_status": null
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 50,
      "total_count": 1028,
      "total_pages": 21,
      "has_next": true,
      "has_previous": false
    }
  }
  ```
</ResponseExample>

<ResponseField name="data" type="array">
  Array of call objects

  <Expandable title="Call Object Properties">
    <ResponseField name="call_id" type="string">
      Unique call identifier (e.g., `outbound-1776774443-863aa698`)
    </ResponseField>

    <ResponseField name="call_type" type="string">
      Type of call — `Outbound` or `Inbound`
    </ResponseField>

    <ResponseField name="call_status" type="string">
      Final call status (e.g., `User disconnected`, `completed`, `error`)
    </ResponseField>

    <ResponseField name="direction" type="string">
      Call direction — `Outbound` or `Incoming`
    </ResponseField>

    <ResponseField name="agent_name" type="string">
      Name of the agent that handled the call
    </ResponseField>

    <ResponseField name="agent_id" type="string">
      UUID of the agent
    </ResponseField>

    <ResponseField name="from_number" type="string">
      Caller number (E.164 format)
    </ResponseField>

    <ResponseField name="to_number" type="string">
      Destination number (E.164 format)
    </ResponseField>

    <ResponseField name="Start_time" type="string">
      Call start timestamp (ISO 8601)
    </ResponseField>

    <ResponseField name="End_time" type="string">
      Call end timestamp (ISO 8601)
    </ResponseField>

    <ResponseField name="duration_ms" type="number">
      Call duration in milliseconds
    </ResponseField>

    <ResponseField name="call_cost" type="number">
      Call cost in credits
    </ResponseField>

    <ResponseField name="call_summary" type="string | null">
      AI-generated summary of the call
    </ResponseField>

    <ResponseField name="call_eval_tag" type="string | null">
      Evaluation tag assigned to the call
    </ResponseField>

    <ResponseField name="post_processing_status" type="string">
      Post-processing status — `completed`, `not_processed`, or `processing`
    </ResponseField>

    <ResponseField name="recording_api" type="string">
      URL to stream the call recording
    </ResponseField>

    <ResponseField name="call_transcription" type="string">
      URL to fetch the call transcript
    </ResponseField>

    <ResponseField name="call_metadata" type="object">
      Metadata passed when triggering the call
    </ResponseField>

    <ResponseField name="chat_history" type="array">
      Structured chat history of the call
    </ResponseField>

    <ResponseField name="callback_requested" type="boolean">
      Whether a callback was requested during the call
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="pagination" type="object">
  Pagination metadata

  <Expandable title="Pagination Properties">
    <ResponseField name="page" type="integer">
      Current page number
    </ResponseField>

    <ResponseField name="page_size" type="integer">
      Number of records per page
    </ResponseField>

    <ResponseField name="total_count" type="integer">
      Total number of records
    </ResponseField>

    <ResponseField name="total_pages" type="integer">
      Total number of pages
    </ResponseField>

    <ResponseField name="has_next" type="boolean">
      Whether there is a next page
    </ResponseField>

    <ResponseField name="has_previous" type="boolean">
      Whether there is a previous page
    </ResponseField>
  </Expandable>
</ResponseField>

### Validation Error (422)

<ResponseExample>
  ```json theme={null}
  {
    "detail": [
      {
        "loc": ["query", "page"],
        "msg": "value is not a valid integer",
        "type": "type_error.integer"
      }
    ]
  }
  ```
</ResponseExample>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.