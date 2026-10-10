> ## Documentation Index
> Fetch the complete documentation index at: https://docs.vaanivoice.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Stream Audio

> Stream the audio recording of a call

## Stream Audio

Stream the audio recording of a call. Returns a binary audio file (`audio/ogg` or `audio/mpeg`).

## Parameters

<ParamField path="call_id" type="string" required>
  The unique call ID (e.g., `outbound-1776774443-863aa698`)
</ParamField>

## Request Example

<RequestExample>
  ```bash cURL theme={null}
  # CALL_ID=your_call_id
  # API_KEY=your_api_key

  # Download the audio file
  curl -H "X-API-Key:$API_KEY" "https://api.vaanivoice.ai/api/stream/$CALL_ID" -o recording.ogg

  # Check headers only (no download)
  curl -sI -H "X-API-Key:$API_KEY" "https://api.vaanivoice.ai/api/stream/$CALL_ID"
  ```

  ```javascript JavaScript theme={null}
  const CALL_ID = "outbound-1776774443-863aa698";
  const API_KEY = "your_api_key";

  const response = await fetch(
    `https://api.vaanivoice.ai/api/stream/${CALL_ID}`,
    {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
      },
    }
  );

  // Use as audio source
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
  ```

  ```python Python theme={null}
  import requests

  CALL_ID = "outbound-1776774443-863aa698"
  API_KEY = "your_api_key"

  headers = {
      "X-API-Key": API_KEY
  }

  response = requests.get(
      f"https://api.vaanivoice.ai/api/stream/{CALL_ID}",
      headers=headers,
      stream=True
  )

  with open("recording.ogg", "wb") as f:
      for chunk in response.iter_content(chunk_size=8192):
          f.write(chunk)
  ```
</RequestExample>

## Response

### Success Response (200)

Returns a binary audio stream. The response is **not JSON** — it is the raw audio file.

<ResponseExample>
  ```bash Response Headers theme={null}
  HTTP/1.1 200 OK
  content-type: audio/ogg
  content-length: 1083518
  ```
</ResponseExample>

<ResponseField name="Content-Type" type="string">
  Audio format — typically `audio/ogg` or `audio/mpeg`
</ResponseField>

<ResponseField name="Content-Length" type="integer">
  Size of the audio file in bytes
</ResponseField>

<Note>
  The response is a binary audio stream, not JSON. Use the `-o` flag with curl to save it to a file, or use the URL directly in an HTML `<audio>` tag for playback.
</Note>

### Not Found (404)

Returned when the recording has not been generated yet (e.g., call is still in progress or too short).

<ResponseExample>
  ```json theme={null}
  {
    "status_code": 404,
    "error": "Not Found",
    "message": "Audio file not found",
    "code": "NOT_FOUND"
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