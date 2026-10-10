> ## Documentation Index
> Fetch the complete documentation index at: https://docs.vaanivoice.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Call Details

> Get detailed call information including transcript, entities, and evaluation

## Get Call Details

Get detailed call information including transcript, extracted entities, conversation evaluation, and AI-generated summary.

The `user_id` and `client_name` are automatically resolved from your API key — you only need to provide the `call_id`.

## Parameters

<ParamField path="call_id" type="string" required>
  The unique call ID (e.g., `outbound-1776774443-863aa698`)
</ParamField>

## Request Example

<RequestExample>
  ```bash cURL theme={null}
  # CALL_ID=your_call_id
  # API_KEY=your_api_key

  curl -H "X-API-Key:$API_KEY" "https://api.vaanivoice.ai/api/call_details/$CALL_ID"
  ```

  ```javascript JavaScript theme={null}
  const CALL_ID = "outbound-1776774443-863aa698";
  const API_KEY = "your_api_key";

  const response = await fetch(
    `https://api.vaanivoice.ai/api/call_details/${CALL_ID}`,
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
  import requests

  CALL_ID = "outbound-1776774443-863aa698"
  API_KEY = "your_api_key"

  headers = {
      "X-API-Key": API_KEY
  }

  response = requests.get(
      f"https://api.vaanivoice.ai/api/call_details/{CALL_ID}",
      headers=headers
  )

  print(response.json())
  ```
</RequestExample>

## Response

### Success Response (200)

<ResponseExample>
  ```json theme={null}
  {
    "transcription": "AGENT: Hi! You've reached our customer service. I am your assistant, how can I help you today?\n\n USER: Hello. What are you offering?\n\n AGENT: Namaste! We provide a platform where you can start any business...",
    "entity": {
      "Call_back": "No",
      "Callback_time": null,
      "issue_raised_unresolved_bool": "NO",
      "issue_type_extraction": "N/A"
    },
    "conversation_eval": {},
    "summary": "The agent opened the call with a friendly greeting and introduced themselves as the customer's assistant. The customer asked what was being offered. The agent explained the platform's business services.",
    "call_eval_tag": "not enough data"
  }
  ```
</ResponseExample>

<ResponseField name="transcription" type="string">
  Full conversation transcript with speaker labels (`AGENT:` / `USER:`)
</ResponseField>

<ResponseField name="entity" type="object">
  Extracted entities from the call

  <Expandable title="Entity Properties">
    The fields vary based on your agent's configuration. Common fields include:

    <ResponseField name="Call_back" type="string">
      Whether a callback was requested — `"Yes"` or `"No"`
    </ResponseField>

    <ResponseField name="Callback_time" type="string | null">
      Requested callback time, or `null` if none
    </ResponseField>

    <ResponseField name="issue_raised_unresolved_bool" type="string">
      Whether an unresolved issue was raised — `"YES"` or `"NO"`
    </ResponseField>

    <ResponseField name="issue_type_extraction" type="string">
      Type of issue extracted, or `"N/A"`
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="conversation_eval" type="object">
  Conversation evaluation metrics (structure varies by agent configuration)
</ResponseField>

<ResponseField name="summary" type="string">
  AI-generated summary of the call conversation
</ResponseField>

<ResponseField name="call_eval_tag" type="string | null">
  Evaluation tag assigned to the call (e.g., `"vkyc_completed_already"`, `"not enough data"`)
</ResponseField>

### Not Yet Processed

If the call has not been post-processed yet, the response fields will indicate unavailability:

<ResponseExample>
  ```json theme={null}
  {
    "transcription": "Transcript is not available for further evaluations.",
    "entity": "Transcript is not available for further evaluations.",
    "conversation_eval": "Transcript is not available for further evaluations.",
    "summary": "Transcript is not available for further evaluations.",
    "call_eval_tag": null
  }
  ```
</ResponseExample>

### Validation Error (422)

<ResponseExample>
  ```json theme={null}
  {
    "detail": [
      {
        "loc": ["path", "call_id"],
        "msg": "field required",
        "type": "value_error.missing"
      }
    ]
  }
  ```
</ResponseExample>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.