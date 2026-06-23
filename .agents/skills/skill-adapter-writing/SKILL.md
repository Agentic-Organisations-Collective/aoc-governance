---
name: adapter-writing
description: Create well-formed adapter artifacts with integration details and permissions.
layer: company
tags:
  - leafcutter-os
interfaces:
  - id: adapter-brief
    description: Description of the external integration to wrap.
    required: true
  - id: integration-surface
    description: CLI, API, or service surface to standardize.
    required: false
---

# Adapter Writing

Create adapter artifacts (`*.adapter.md`) that conform to the leafcutter-os governance schema. An adapter connects the leafcutter-os to an external tool, CLI, API, or service. Start from an `adapter-brief`, and use `integration-surface` to capture whether the wrapper targets a CLI, API, or comparable service boundary.

## Required Frontmatter

```yaml
---
name: <adapter-name>           # kebab-case, typically <tool>-cli or <service>-api
description: <one-liner>       # Consumer-facing summary of the integration
layer: <global|company|project|person>
tags:
  - <category tags>
permissions:                   # Optional
  shell: <boolean>
  files:
    read: [<glob patterns>]
    write: [<glob patterns>]
    deny_write: [<glob patterns>]
  network:
    allow: [<hostnames>]
interfaces:                    # Recommended
  - id: <parameter-id>
    description: <what this parameter controls>
    required: <boolean>
    type: <string|number|boolean|array|object>
    examples: [<sample value>]
---
```

## Frontmatter Rules

- `name`: Required. Use kebab-case. Convention: `{tool}-cli` for CLI wrappers, `{service}-api` for API integrations.
- `description`: Required. One sentence answering "What external tool does this connect me to?"
- `layer`: Required. Most adapters are `global` (tool-agnostic) or `company` (org-specific config).
- `tags`: Optional but recommended.
- `permissions`: Optional. Declare shell/network access the adapter requires.
- `interfaces`: Recommended. Declare the adapter call surface with a slugified `id`, a semantic `description`, and optional `examples` for typical values.
- Reference every declared parameter `id` in the body at least once using inline code, for example `operation` or `output-path`.
- Let the initial `adapter-brief` drive the adapter scope, and use `integration-surface` to decide whether the body should center CLI commands, REST endpoints, or another tool boundary.

## Content Structure

```markdown
# <Adapter Display Name>

One paragraph: what tool/service this adapter connects to and why.

## Prerequisites

- Required CLI installations or API access.
- Environment variables or authentication setup.

## Available Commands / Endpoints

Table of key commands or API operations.

## Commands

(Optional) Helper commands bundled with the adapter in a `cmd/` directory.

## Usage Examples

Concrete examples of invoking the adapter.

## Configuration

Environment variables, config files, or setup needed.
```

## Design Principles

- **Thin wrapper.** An adapter documents and standardizes access to an external tool — it doesn't reimagine the tool.
- **Authentication guidance.** Always document how to authenticate, but never include secrets.
- **Commands for complex operations.** If a command sequence is non-trivial, provide a helper command in `cmd/`.
- **Idempotent operations.** Prefer commands that are safe to re-run.

## Naming Convention

- File: `.agents/skills/adapter-{name}/{name}.adapter.md` (kebab-case).
- Frontmatter `name`: Same kebab-case identifier.
- Package: `@schafe-vorm-fenster/adapter-{name}`.
- Name pattern: `{tool}-cli` for CLI tools, `{service}-api` for APIs, `{tool}-mcp` for MCP bridges.

## Quality Checklist

- [ ] Frontmatter passes `pnpm lint:artifacts`.
- [ ] Prerequisites clearly state what must be installed.
- [ ] No secrets or credentials in the artifact.
- [ ] Commands are exact and tested.
- [ ] Permissions declare required network access.
- [ ] No overlap with existing adapters (check `packages/adapters/`).
