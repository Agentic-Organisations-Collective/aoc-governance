---
name: skill-writing
description: Create well-formed skill artifacts with correct frontmatter and reusable capability documentation.
layer: company
tags:
  - leafcutter-os
interfaces:
  - id: skill-brief
    description: Desired capability, scope, and audience for the skill.
    required: true
  - id: reuse-target
    description: Optional parent domain or package family for the skill.
    required: false
---

# Skill Writing

Create skill artifacts (`*.skill.md`) that conform to the leafcutter-os governance schema. A skill defines a reusable capability that any agent can invoke — tools, workflows, templates, or domain techniques. Start from a `skill-brief`, and use `reuse-target` when the artifact should clearly sit inside an existing domain or package family.

## Required Frontmatter

```yaml
---
name: <skill-name>             # kebab-case identifier
description: <one-liner>       # Consumer-facing summary of the capability
layer: <global|company|project|person>
tags:
  - <category tags>
---
```

## Frontmatter Rules

- `name`: Required. Use kebab-case (e.g., `github-issues`, `artifact-classification`).
- `description`: Required. One sentence answering "What capability does this give me?"
- `layer`: Required. Use `global` for universally applicable skills, `company` for org-specific.
- `tags`: Optional but recommended.
- Skills have **no permissions** block — they describe capabilities, not execute shell commands.

## Content Structure

```markdown
# <Skill Display Name>

One paragraph explaining what this skill enables and when to use it.

## Available Tools / Commands

Table or list of tools, CLI commands, or APIs this skill documents.

## Workflow

Step-by-step guidance for using the skill. Not a strict procedure
(that would be a playbook) but a recommended approach.

## Templates / Examples

(Optional) Reusable templates, output formats, or examples.

## Guidelines

Constraints, best practices, and edge cases.
```

## Differentiating Skills from Other Types

Use `skill-brief` to define the reusable capability, and use `reuse-target` to decide whether the resulting skill should explicitly live under an existing domain or package family.

| If it... | It's a... |
| --- | --- |
| Describes a reusable technique without strict ordering | **Skill** |
| Has ordered phases with quality gates | Playbook |
| Defines a persona with decision authority | Agent |
| Connects to an external CLI/API | Adapter |
| States enduring values or principles | Foundation |

## Naming Convention

- File: `.agents/skills/skill-{name}/{name}.skill.md` (kebab-case).
- Frontmatter `name`: Same kebab-case identifier.
- Package: `@schafe-vorm-fenster/skill-{name}`.
- Name from consumer perspective: what capability does this provide?
- If leafcutter-os-specific, prefix with `leafcutter-os-` or tag with `leafcutter-os`.

## Quality Checklist

- [ ] Frontmatter passes `pnpm lint:artifacts`.
- [ ] Description is consumer-facing (not internal jargon).
- [ ] Content is reusable — not tied to a specific agent.
- [ ] No overlap with existing skills (check `packages/skills/`).
- [ ] Includes concrete tool/command references where applicable.
- [ ] Templates use fenced code blocks with language annotations.
