---
name: publer-api
description: REST API adapter for Publer to discover workspaces, inspect posts, and schedule social publishing jobs.
layer: global
tags:
  - publishing
  - social-media
  - publer
  - api
permissions:
  shell: true
  network:
    allow:
      - app.publer.com
interfaces:
  - id: operation
    description: Discover-workspaces, inspect-posts, or schedule-job operation.
    required: true
    type: string
    examples: [discover-workspaces, inspect-posts, schedule-job]
  - id: workspace-id
    description: Optional Publer workspace identifier.
    required: false
    type: string
    examples: [workspace-12345, team-main]
  - id: post-id
    description: Optional existing post identifier.
    required: false
    type: string
    examples: [post-98765, scheduled-post-42]
  - id: target-channels
    description: Optional consumer-defined channel keys to target. Use as orchestration input only; map to Publer workspace/account/network in the consuming repository.
    required: false
    type: string[]
    examples: [linkedin-personal, linkedin-company, instagram-brand]
---

# Publer API

Publer exposes a RESTful JSON API for scheduling, publishing, and inspecting social media posts across multiple networks. This adapter captures the portable operational surface: authentication, workspace discovery, post listing, and post scheduling.

Use `operation` to choose the Publer workflow, pass `workspace-id` when the call must target a specific workspace, and include `post-id` for inspection or follow-up actions on one existing post. Optionally pass `target-channels` when an upstream workflow provides consumer-side channel intents.

Use this adapter when the task is to operate Publer directly. Keep consumer-specific content workflows, file conventions, and archival logic in the consuming repository or in a higher-level playbook.

`target-channels` is an orchestration hint, not a Publer-native routing field. The consuming repository is responsible for mapping these logical channels to concrete Publer identifiers (workspace, account, network, type).

## Prerequisites

- Node.js 20+ is available. The bundled scripts rely on the built-in `fetch` implementation.
- `PUBLER_API_KEY` is set to a valid Publer API key.
- `PUBLER_WORKSPACE_ID` is set when listing or scheduling posts, unless passed explicitly with `--workspace`.
- The Publer account has API access enabled. Publer documents this as a Business or Enterprise capability.

### Quick check

```bash
[[ -n "$PUBLER_API_KEY" ]] || { echo "MISSING: PUBLER_API_KEY"; exit 1; }
```

## API basics

- Base URL: `https://app.publer.com/api/v1`
- Auth header: `Authorization: Bearer-API <PUBLER_API_KEY>`
- Workspace header: `Publer-Workspace-Id: <PUBLER_WORKSPACE_ID>` or explicit `workspace-id`
- Timestamps: ISO 8601 with timezone, for example `2026-06-01T10:00:00+02:00`

## Machine-readable spec status

As of 2026-06-01, no public OpenAPI or Swagger JSON endpoint could be verified for Publer.

Common OpenAPI and Swagger endpoint locations were checked and returned `404` during verification.

What is publicly available instead:

- Human-readable docs: `https://publer.com/docs`
- API reference entry: `https://publer.com/docs/api-reference/introduction`
- GitBook markdown export for the introduction page: `https://publer.com/docs/api-reference/introduction.md`
- GitBook MCP connect URL: `https://publer.com/docs/~gitbook/mcp`

The GitBook MCP URL is useful as an agent/tool connection surface, but it is not the same thing as a downloadable OpenAPI or Swagger specification file.

### Authentication probe

```bash
curl -s \
  -H "Authorization: Bearer-API $PUBLER_API_KEY" \
  https://app.publer.com/api/v1/workspaces
```

## Bundled scripts

### `cmd/workspaces.mjs` - List workspaces and connected accounts

```bash
node cmd/workspaces.mjs
```

Lists accessible workspaces first, then attempts to list accounts for each workspace. Use this `operation` when `workspace-id` is still unknown and must be discovered first.

### `cmd/list-posts.mjs` - List posts with filters

```bash
node cmd/list-posts.mjs --state scheduled --from 2026-06-01 --to 2026-06-30
```

Options:

- `--state <state>`: Filter by state, defaults to `scheduled`
- `--from <date>`: Start date filter in `YYYY-MM-DD`
- `--to <date>`: End date filter in `YYYY-MM-DD`
- `--query <text>`: Search query for post content
- `--workspace <id>`: Override `PUBLER_WORKSPACE_ID` with explicit `workspace-id`

### `cmd/upload-media.mjs` - Upload a media file

```bash
node cmd/upload-media.mjs --file ./photo.jpg
```

Uploads a local file to Publer's media storage and prints the resulting media URL to stdout. Use the returned URL with `schedule-post.mjs --media <url>`.

Options:

- `--file <path>`: Local file path to upload (required)
- `--workspace <id>`: Override `PUBLER_WORKSPACE_ID`

Supported extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.mp4`, `.mov`, `.avi`, `.pdf`

### `cmd/schedule-post.mjs` - Submit a scheduling job

```bash
node cmd/schedule-post.mjs \
  --account 63c675b54e299e9cf2b667ea \
  --text "Exciting update about our product launch!" \
  --scheduled-at "2026-06-02T09:00:00+02:00" \
  --network linkedin \
  --type status
```

Options:

- `--account <id>`: Target account ID, repeatable
- `--text <content>`: Post text content
- `--media <url>`: Media URL from `upload-media.mjs`, repeatable (for photo/video/carousel)
- `--scheduled-at <iso8601>`: Scheduled publication time, required for `scheduled`
- `--network <name>`: Network key such as `linkedin`, `instagram`, `facebook` (required)
- `--type <type>`: Content type, defaults to `status`
- `--state <state>`: `scheduled`, `draft`, or `publish_now`
- `--workspace <id>`: Override `PUBLER_WORKSPACE_ID` with explicit `workspace-id`
- `--dry-run`: Print payload without calling the API

The script submits the scheduling `operation` and polls `GET /job_status/{job_id}` until completion or timeout. A completed job is still treated as failed when Publer returns non-empty `payload.failures` data, and follow-up inspection can then target the resulting `post-id`.

## Request envelope

Publer scheduling requests use a bulk envelope:

```json
{
  "bulk": {
    "state": "scheduled",
    "posts": [
      {
        "networks": {
          "linkedin": {
            "type": "status",
            "text": "Post content goes here"
          }
        },
        "accounts": [
          {
            "id": "ACCOUNT_ID",
            "scheduled_at": "2026-06-01T10:00:00+02:00"
          }
        ]
      }
    ]
  }
}
```

## Supported values

### Network keys

`facebook`, `instagram`, `twitter`, `linkedin`, `pinterest`, `youtube`, `tiktok`, `google`, `telegram`, `mastodon`, `threads`, `bluesky`

### Content types

`status`, `link`, `photo`, `gif`, `video`, `reel`, `story`, `short`, `poll`, `document`, `carousel`, `article`

### Publishing states

| State | Behavior |
| --- | --- |
| `scheduled` | Publishes at `scheduled_at` |
| `draft` | Stores as draft only |
| `publish_now` | Attempts immediate publication |

## Error handling

- `401`: API key missing or invalid
- `403`: Plan or scope does not allow the action
- `429`: Rate limited, retry with backoff
- Async failures can be returned in `payload.failures` even when the job status is `complete`

## Scope boundary

This package intentionally does not include repository-specific publishing pipeline logic such as:

- mapping local channels to fixed Publer account IDs
- mapping `target-channels` values to consumer-owned channel registries
- scanning a consuming repository for content files
- writing Publer job identifiers back into domain documents
- moving published files between repository folders

Those behaviors depend on a consumer repository's content model and belong in that consumer or in a higher-level playbook, not in this reusable adapter.

## External References

- [Publer API documentation](https://publer.com/docs)
- [Publer API reference](https://publer.com/docs/api-reference/introduction)
- [Publer API reference markdown export](https://publer.com/docs/api-reference/introduction.md)
- [Publer GitBook MCP connect URL](https://publer.com/docs/~gitbook/mcp)
