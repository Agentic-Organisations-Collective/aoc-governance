---
name: agent-writing
description: Create well-formed agent artifacts with correct frontmatter, persona definition, and tool selection.
layer: company
tags:
  - leafcutter-os
interfaces:
  - id: agent-brief
    description: Desired agent role, responsibilities, and operating model.
    required: true
  - id: topology-context
    description: Optional role or ownership context for the agent.
    required: false
---

# Agent Writing

Create agent artifacts (`*.agent.md`) that conform to the leafcutter-os governance schema. An agent defines a persona with a specific role, responsibilities, model, and tool access. Start from an `agent-brief`, and use `topology-context` when the agent must align to an existing role or ownership structure.

## Required Frontmatter

```yaml
---
name: <AgentName>              # PascalCase display name
description: <one-liner>       # Consumer-facing summary of the agent's role
layer: <global|company|project|person>
tags:
  - <category tags>
model: <Model Name>            # e.g., "Claude Sonnet 4.5", "Claude Opus 4"
argument-hint: <prompt hint>   # Optional: guidance for users invoking the agent
tools:                         # At least one tool required
  - <tool-name>
---
```

## Frontmatter Rules

- `name`: Required. Use PascalCase (e.g., `Curator`, `Analyst`). This is the display name.
- `description`: Required. One sentence, consumer-perspective. Answers "What does this agent do for me?"
- `layer`: Required. Most org agents are `company`.
- `model`: Required. Specify the exact model name.
- `tools`: Required, minimum 1 entry. Only list tools the agent actually needs.
- `argument-hint`: Optional. Tells users what to type when invoking the agent.
- `tags`: Optional but recommended for categorization.

## Content Structure

```markdown
## Role
One paragraph defining WHO this agent is and WHAT it answers.
State the primary focus areas as a short list.

## Instructions
Behavioral rules, constraints, and operational guidelines.
Use imperative voice. Be specific about boundaries.

## Output Format
(Optional) Template or structure the agent should follow when producing output.

## Composing Skills
(Optional) List skills this agent uses and how.
```

## Tool Selection Guide

Choose tools based on the agent's responsibilities:

| Need | Tools |
| --- | --- |
| Read code/files | `readFile`, `listDirectory`, `fileSearch`, `textSearch` |
| Search semantically | `search`, `codebase` |
| Execute commands | `runInTerminal`, `getTerminalOutput`, `terminalLastCommand` |
| Run tests | `runTests`, `testFailure` |
| Delegate subtasks | `createAndRunTask`, `runTask`, `getTaskOutput` |
| View problems/errors | `problems` |
| Track changes | `changes`, `usages` |
| Fetch external content | `fetch` |
| GitHub integration | `githubRepo` |

**Principle of least privilege:** Only grant tools the agent genuinely needs. An analyst doesn't need `runInTerminal`; a reviewer doesn't need `createAndRunTask`.

Use `agent-brief` to justify every capability in the final artifact, and use `topology-context` to decide whether the agent belongs beside an existing role family or introduces a new ownership boundary.

## Model Selection Guide

| Use Case | Recommended Model |
| --- | --- |
| Complex reasoning, architecture | Claude Opus 4 |
| General-purpose, balanced | Claude Sonnet 4.5 |
| Fast, routine tasks | Claude Haiku (if available) |

## Naming Convention

- File: `packages/agents/{name}/{name}.agent.md` (kebab-case for directory/file).
- Frontmatter `name`: PascalCase display name.
- Package: `@schafe-vorm-fenster/agent-{name}`.
- Name from consumer perspective: what role does this agent play for the user?

## Quality Checklist

- [ ] Frontmatter passes `pnpm lint:artifacts`.
- [ ] Role section clearly states WHAT the agent answers (not HOW it implements).
- [ ] Tools list is minimal and justified.
- [ ] No overlap with existing agents (check `packages/agents/`).
- [ ] Instructions use imperative voice and are specific.
- [ ] Cross-references to skills/playbooks use relative paths.
