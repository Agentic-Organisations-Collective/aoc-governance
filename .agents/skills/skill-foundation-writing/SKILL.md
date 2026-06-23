---
name: foundation-writing
description: Create well-formed foundation artifacts with enduring organizational guidance.
layer: company
tags:
  - leafcutter-os
interfaces:
  - id: foundation-brief
    description: Desired organizational guidance and editorial scope.
    required: true
  - id: source-principles
    description: Optional reference principles or source material.
    required: false
---

# Foundation Writing

Create foundation artifacts (`*.foundation.md`) that conform to the leafcutter-os governance schema. A foundation captures enduring organizational guidance — values, principles, tone, policies — that informs all other artifacts. Start from a `foundation-brief`, and incorporate `source-principles` when the guidance should be grounded in existing value statements or reference material.

## Required Frontmatter

```yaml
---
name: <foundation-name>        # kebab-case identifier
description: <one-liner>       # Consumer-facing summary of the guidance
layer: company                 # ALWAYS company — foundations are org-level by definition
tags:
  - <category tags>
---
```

## Frontmatter Rules

- `name`: Required. Use kebab-case (e.g., `culture-values`, `tone-of-voice`).
- `description`: Required. One sentence answering "What organizational guidance does this provide?"
- `layer`: Required. **Must always be `company`** — this is enforced by the governance schema.
- `tags`: Optional but recommended.
- Foundations have **no permissions** block — they are pure prose guidance, not executable.

## Content Structure

```markdown
# <Foundation Display Name>

## Purpose

One paragraph: what guidance this provides and who benefits.

## <Topic Section 1>

### <Subtopic>

Prose guidance. Write as principles, not rules.
Use concrete examples where helpful.

## <Topic Section 2>

...continue for each major topic...
```

## Design Principles

- Let `foundation-brief` define the durable guidance problem first, and use `source-principles` only to ground or sharpen that guidance rather than to copy source text wholesale.
- **Enduring over ephemeral.** Foundations should remain valid for years. If it changes quarterly, it's not a foundation.
- **Principles over rules.** Express intent and reasoning, not just commands. This allows interpretation in new contexts.
- **Prose over structure.** Unlike skills (tables, commands) or playbooks (phases, gates), foundations are narrative.
- **Actionable guidance.** Each section should help an agent or human make better decisions.
- **No implementation details.** Foundations say "what we value" not "how to build it."

## When Content is NOT a Foundation

| Signal | Actual Type |
| --- | --- |
| Has CLI commands or tool references | Skill or Adapter |
| Has ordered steps with checkpoints | Playbook |
| Defines a persona or role | Agent |
| Changes frequently | Not a foundation — consider a skill or config |
| Is project-specific | Not a foundation — use `layer: project` on another type |

## Naming Convention

- File: `packages/foundations/{name}/{name}.foundation.md` (kebab-case).
- Frontmatter `name`: Same kebab-case identifier.
- Package: `@schafe-vorm-fenster/foundation-{name}`.
- Name from consumer perspective: what organizational guidance does this encode?

## Quality Checklist

- [ ] Frontmatter passes `pnpm lint:artifacts`.
- [ ] `layer` is `company` (mandatory for foundations).
- [ ] Content is enduring — would still be valid in 2+ years.
- [ ] Written as principles, not implementation instructions.
- [ ] No overlap with existing foundations (check `packages/foundations/`).
- [ ] No CLI commands, tool references, or step-by-step procedures.
