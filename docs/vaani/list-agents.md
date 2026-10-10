> ## Documentation Index
> Fetch the complete documentation index at: https://docs.vaanivoice.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# List Agents

> List all agents associated with your organization

## List Agents

Retrieve all agents associated with the authenticated user's organization. Supports optional search filtering by display name or agent name, as well as pagination.

***

## Query Parameters

<ParamField query="search" type="string">
  Filter agents by display name or agent slug.
</ParamField>

<ParamField query="page" type="integer">
  Page number for pagination (1-indexed). When omitted, returns all agents as a list.
</ParamField>

<ParamField query="page_size" type="integer" default="10">
  Number of agents per page (max 200).
</ParamField>

<ParamField query="published_only" type="boolean" default="false">
  Filter to only return published agents.
</ParamField>

***

## Request Example

<RequestExample>
  ```bash cURL theme={null}
  curl -X GET "https://api.vaanivoice.ai/api/agents?search=support&page=1&page_size=10" \
    -H "X-API-Key: vaani_<your_key>"
  ```

  ```javascript JavaScript theme={null}
  const response = await fetch("https://api.vaanivoice.ai/api/agents?search=support&page=1&page_size=10", {
    method: "GET",
    headers: {
      "X-API-Key": "vaani_<your_key>",
    },
  });

  const data = await response.json();
  console.log(data);
  ```

  ```python Python (Requests) theme={null}
  import requests

  response = requests.get(
      "https://api.vaanivoice.ai/api/agents",
      headers={
          "X-API-Key": "vaani_<your_key>",
      },
      params={
          "search": "support",
          "page": 1,
          "page_size": 10,
      },
  )
  print(response.json())
  ```

  ```python Python SDK theme={null}
  from vaani_sdk import VaaniClient

  with VaaniClient(api_key="vaani_<your_key>") as client:
      # List all agents
      agents = client.agents.list()
      for agent in agents:
          print(agent.id, agent.display_name, agent.agent_name)

      # Search with pagination
      filtered = client.agents.list(search="support", page=1, page_size=10)
  ```
</RequestExample>

***

## Response

<ResponseExample>
  ```json Paginated (200 OK) theme={null}
  {
    "data": [
      {
        "id": "7ec4155e-0e62-440a-b983-5974f7697854",
        "agent_name": "clientnamesupportbot",
        "display_name": "Support Bot",
        "client_id": "9abf5eff-e978-4e87-954d-7ff6ba570796",
        "client_name": "Acme Corp",
        "published": true,
        "published_at": "2026-09-01T12:00:00Z",
        "last_edited_at": "2026-09-25T10:00:00Z",
        "deployment_config": {},
        "status": "running",
        "gsheet_config": null,
        "archived": false
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total_count": 1,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false
    }
  }
  ```

  ```json Non-Paginated (200 OK) theme={null}
  [
    {
      "id": "7ec4155e-0e62-440a-b983-5974f7697854",
      "agent_name": "clientnamesupportbot",
      "display_name": "Support Bot",
      "client_id": "9abf5eff-e978-4e87-954d-7ff6ba570796",
      "client_name": "Acme Corp",
      "published": true,
      "published_at": "2026-09-01T12:00:00Z",
      "last_edited_at": "2026-09-25T10:00:00Z",
      "deployment_config": {},
      "status": "running",
      "gsheet_config": null,
      "archived": false
    }
  ]
  ```
</ResponseExample>

<ResponseField name="data" type="array">
  List of agent objects.

  <Expandable title="agent properties">
    <ResponseField name="id" type="string">
      Unique identifier (UUID) of the agent.
    </ResponseField>

    <ResponseField name="agent_name" type="string">
      Internal system slug identifier of the agent.
    </ResponseField>

    <ResponseField name="display_name" type="string">
      Human-readable display name of the agent.
    </ResponseField>

    <ResponseField name="client_id" type="string">
      UUID of the organization owning the agent.
    </ResponseField>

    <ResponseField name="client_name" type="string">
      Name of the organization.
    </ResponseField>

    <ResponseField name="published" type="boolean">
      Whether the agent has been published for active use.
    </ResponseField>

    <ResponseField name="published_at" type="string">
      ISO timestamp when the agent was published.
    </ResponseField>

    <ResponseField name="last_edited_at" type="string">
      ISO timestamp when the agent was last edited.
    </ResponseField>

    <ResponseField name="status" type="string">
      Current agent status (e.g. `running`, `stopped`, `initialized`).
    </ResponseField>

    <ResponseField name="archived" type="boolean">
      Whether the agent is archived.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="pagination" type="object">
  Pagination metadata included when `page` parameter is provided.

  <Expandable title="pagination properties">
    <ResponseField name="page" type="integer">Current page number.</ResponseField>
    <ResponseField name="page_size" type="integer">Number of items per page.</ResponseField>
    <ResponseField name="total_count" type="integer">Total matching agents.</ResponseField>
    <ResponseField name="total_pages" type="integer">Total number of pages.</ResponseField>
    <ResponseField name="has_next" type="boolean">Whether more pages exist.</ResponseField>
    <ResponseField name="has_previous" type="boolean">Whether a prior page exists.</ResponseField>
  </Expandable>
</ResponseField>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.