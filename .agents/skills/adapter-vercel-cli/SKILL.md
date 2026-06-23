---
name: vercel-cli
description: This file provides the structural logic and command reference for interacting with Vercel via the Vercel CLI. Use these sequences to manage deployments, check statuses, and debug via runtime logs.
layer: global
interfaces:
  - id: operation
    description: Deploy, status, logs, or rollback operation.
    required: true
    type: string
    examples: [deploy, inspect, logs]
  - id: project-name
    description: Optional Vercel project name.
    required: false
    type: string
    examples: [leafcutter-web, marketing-site]
  - id: environment-name
    description: Optional deployment environment such as production or preview.
    required: false
    type: string
    examples: [production, preview]
---

# Vercel CLI Operations

This file provides the structural logic and command reference for interacting with Vercel via the Vercel CLI. Use these sequences to manage deployments, check statuses, and debug via runtime logs.

Use `operation` to decide whether the adapter should deploy, inspect, or fetch logs, supply `project-name` when repository linking is ambiguous, and set `environment-name` to scope discovery and logs to preview or production.

## 1. Core Logic Sequence

When tasked with Vercel operations, follow this sequence:

- **Environment Audit**: Verify CLI installation and authentication.
- **Project Context**: Confirm the local directory is linked to the intended `project-name`.
- **Deployment Discovery**: Retrieve the list of recent deployments to find the target uid or url.
- **Status Inspection**: Get detailed metadata and health state of the deployment selected by `operation`.
- **Log Harvesting**: Fetch runtime or build logs for the chosen `environment-name`, prioritizing errors and warnings.

## 2. Basic Setup & Discovery

Commands to initialize the environment and find targets.

**IMPORTANT**: Use npx vercel instead of vercel — the CLI may not be on PATH.

| Action | Command | Note |
| --- | --- | --- |
| Check Version | npx vercel --version | Verify CLI availability. |
| Check Auth | npx vercel whoami | Verify login/token status. |
| Link Project | npx vercel link | Connects directory to Vercel (use --yes for non-interactive). |
| List All | npx vercel ls | Shows last 20 deployments. |
| List Production | npx vercel ls --prod | Shows `environment-name=production` deployments only. |

**Note**: vercel ls --json does **NOT** work — the --json flag is not supported for ls.

## 3. Deployment Info & Status

Retrieve metadata for a specific deployment using a uid or url.

- **Inspect Deployment**: npx vercel inspect <deployment-id-or-url>
  - *Returns:* ID, Name, Status, Runtime, Region, and Environment Variables.
- **Wait for Ready**: npx vercel inspect <id> --wait
  - Use this when monitoring a deployment that is currently in BUILDING state.

## 4. Runtime & Build Logs

### CRITICAL: Follow Mode Conflicts

When you pass a deployment URL/ID, vercel logs **implicitly enables****--follow** (live streaming). This conflicts with --level, --limit, and --query. **Always add****--no-follow** when using any filter flags.

### Recommended: Search Logs by Content (Query)

The fastest way to find logs for a specific request, conversation, or error:

npx vercel logs --no-follow --query "<search-term>" --limit 50 --expand --since 48h --no-branch --environment production

Key flags:

- --query "<text>" — Full-text search in log output (e.g. conversation ID, error message)
- --no-follow — **Required** when using any filter flag
- --no-branch — Disable git branch filtering (otherwise only shows logs from current branch)
- --environment production — Scope to production environment
- --since <duration> — Time range: 1h, 30m, 48h, etc.
- --expand — Show full log message below each request line
- --limit <n> — Maximum number of results (default: 100)

### Filter by Level or Status Code

npx vercel logs --no-follow --no-branch --environment production --level error --limit 100

npx vercel logs --no-follow --no-branch --environment production --status-code 500 --limit 50

### Filter by Source

npx vercel logs --no-follow --source serverless --limit 100

Sources: serverless, edge-function, edge-middleware, static

### Live Tail (Streaming)

npx vercel logs <deployment-url> --follow

**Note**: --follow cannot be combined with --level, --limit, --query, or any other filter.

### Build Logs (Deployment Phase)

- **Fetch Build Logs**: npx vercel inspect <id> --logs
  - Use this if the deployment status is ERROR and occurred during the build step.

## 5. Agent Hints & Best Practices

### Log Search Recipe (Copy-Paste Ready)

When asked to debug a specific conversation or error in production:

# Step 1: Auth check

npx vercel whoami

# Step 2: Search logs by conversation ID / error text

npx vercel logs --no-follow --query "<CONVERSATION_ID>" --limit 50 --expand --since 48h --no-branch --environment production

This skips deployment discovery entirely when the `operation` is log inspection — no need to find a deployment URL first.

### Non-Interactive Automation

- Use VERCEL_TOKEN for all agent-driven Vercel commands.
- Prefer --token <token> and --yes/--no flags to avoid prompts.
- Do not use vercel login in automated agent workflows.
- If a Vercel command requires network access or is blocked by the sandbox, run it directly as part of the task flow and request unsandboxed execution for that command rather than asking the user for a separate approval step.

### Troubleshooting with --help

If a command fails or a flag is unrecognized, append --help to the base command to see the full manual.

- Example: npx vercel logs --help

### Deployment Scoping

- **Team Scope**: If the project belongs to a team, always append --scope <team-slug>.
- **Production Only**: Use npx vercel ls --prod when `environment-name` should ignore preview or branch deployments.

### Target Identification

Vercel commands generally accept three types of identifiers:

- **Deployment ID**: dpl_xxxxxxxxxxxxxxxx (Most reliable).
- **Deployment URL**: project-name-123.vercel.app.
- **Project Name**: Refers to the latest deployment for that project.

### Logic for Error Handling

- If vercel ls returns no deployments: Check vercel link status.
- If vercel logs returns nothing: Add --no-branch --environment production (branch filtering may exclude results).
- If vercel logs returns "does not support filtering": Add --no-follow to disable implicit streaming.
- If the error is a Build Error: Use npx vercel inspect <id> --logs.
- If "Permission Denied": Run vercel login or check VERCEL_TOKEN environment variable.

## 6. Common JSON Command Reference

For automated parsing, use these flags:

- npx vercel logs --no-follow --json --limit 100
- npx vercel teams list --json

## External References

- [Vercel CLI documentation](https://vercel.com/docs/cli)
- [Vercel CLI command reference](https://vercel.com/docs/cli/commands)
- [Vercel REST API](https://vercel.com/docs/rest-api)
