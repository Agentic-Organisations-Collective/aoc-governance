---
name: playbook-writing
description: Create well-formed playbook artifacts with phases, quality gates, and permissions.
layer: company
tags:
  - leafcutter-os
interfaces:
  - id: artifact-brief
    description: Description of the playbook to create or revise.
    required: true
  - id: target-artifact-type
    description: Target governed artifact family for the playbook.
    required: false
---

# Playbook Writing

Create playbook artifacts (`*.playbook.md`) that conform to the leafcutter-os governance schema. A playbook defines a repeatable operational procedure with ordered phases, quality gates, and explicit permissions. Start from an `artifact-brief`, and use `target-artifact-type` when the playbook must clearly align to a specific governed artifact family.

## Required Frontmatter

```yaml
---
name: <playbook-name>          # kebab-case identifier
description: <one-liner>       # Consumer-facing summary of the procedure
layer: <global|company|project|person>
tags:
  - <category tags>
permissions:                   # Optional but common for playbooks
  shell: <boolean>
  files:
    read: [<glob patterns>]
    write: [<glob patterns>]
    deny_write: [<glob patterns>]
  network:
    allow: [<hostnames>]
---
```

## Frontmatter Rules

- `name`: Required. Use kebab-case (e.g., `dependency-update`, `leafcutter-os-intake`).
- `description`: Required. One sentence answering "What does this procedure accomplish?"
- `layer`: Required. Most operational playbooks are `company`.
- `tags`: Optional but recommended.
- `permissions`: Optional. Declare when the playbook needs shell access, file writes, or network calls.
  - `shell`: Set `true` if the playbook executes CLI commands.
  - `files.write`: Glob patterns for files the playbook may create/modify.
  - `files.deny_write`: Glob patterns for files the playbook must NEVER modify (safety guard).
  - `network.allow`: Hostnames the playbook may contact.

## Content Structure

```markdown
# <Playbook Display Name>

One paragraph: what this playbook accomplishes and when to use it.

## Prerequisites

What must be true before running this playbook.

## Workflow

### Phase 1 — <Name>

Steps, commands, decision points for this phase.

### Phase 2 — <Name>

...continue for each phase...

## Guidelines

Strict constraints, do's and don'ts.

## Commit Convention

(If applicable) How to format commits produced by this playbook.
```

## Design Principles

- Let `artifact-brief` define the operational problem first, and use `target-artifact-type` when the procedure should clearly serve one governed artifact family rather than staying generic.
- **Phases, not flat steps.** Group related steps into named phases with clear entry/exit criteria.
- **Quality gates.** Each phase should end with a validation step (lint, test, review).
- **Explicit permissions.** Declare what the playbook can touch — this is a governance contract.
- **deny_write as guardrails.** Protect files the playbook should never modify (tests, other artifacts, AGENTS.md).
- **Scripts over prose.** When a step involves commands, provide the exact shell commands in fenced blocks.
- **Agent decision points.** Clearly state where the agent must make a judgment call vs. follow a deterministic path.

## Permissions Guide

| Scenario | Recommended Permissions |
| --- | --- |
| Read-only analysis | `files.read` only |
| Code generation | `files.write` + `deny_write` for protected paths |
| Dependency management | `shell: true` + `network.allow` for registries |
| GitHub operations | `shell: true` + `network.allow: ["api.github.com"]` |

## Naming Convention

- File: `.agents/skills/playbook-{name}/{name}.playbook.md` (kebab-case).
- Frontmatter `name`: Same kebab-case identifier.
- Package: `@schafe-vorm-fenster/playbook-{name}`.
- Name from consumer perspective: what procedure does this execute for me?
- If leafcutter-os-specific, prefix with `leafcutter-os-` (e.g., `leafcutter-os-intake`).

## Quality Checklist

- [ ] Frontmatter passes `pnpm lint:artifacts`.
- [ ] Phases are ordered and named.
- [ ] Each phase ends with a quality gate or checkpoint.
- [ ] Permissions are minimal and justified.
- [ ] `deny_write` protects sensitive paths.
- [ ] Shell commands are exact and copy-pasteable.
- [ ] No overlap with existing playbooks (check `packages/playbooks/`).
