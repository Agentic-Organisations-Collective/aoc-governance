---
name: artifact-classification
description: Classify raw input content and determine which leafcutter-os artifact type(s) it maps to.
layer: company
tags:
  - leafcutter-os
interfaces:
  - id: input-content
    description: Raw text or notes to classify.
    required: true
  - id: layer-preference
    description: Preferred artifact layer.
    required: false
---

# Artifact Classification

Analyse `input-content` and determine which leafcutter-os artifact type(s) it should become. This skill provides the decision framework for the first phase of the `leafcutter-os-intake` playbook and can honor a `layer-preference` when the caller already knows the intended scope.

## Input Content Categories

Classify the input into one or more of these categories:

| Category | Description | Examples |
| --- | --- | --- |
| **Role / Persona** | Defines who an agent is, its responsibilities, behavior | Job description, persona brief, agent spec |
| **Capability / How-to** | Describes a reusable skill or technique | Tool usage guide, API pattern, CLI workflow |
| **Process / Procedure** | Step-by-step operational workflow with gates | Runbook, SOP, deployment checklist |
| **Integration / Adapter** | Connects to an external tool or service | CLI wrapper, API connector, MCP bridge |
| **Principle / Value / Policy** | Enduring organizational guidance | Culture doc, design principles, tone guide |
| **Knowledge / Reference** | Factual information or domain context | Architecture docs, domain glossary |

## Mapping to Artifact Types

| Category | Primary Artifact Type | Notes |
| --- | --- | --- |
| Role / Persona | `agent` | One agent per distinct role/persona |
| Capability / How-to | `skill` | Reusable across agents |
| Process / Procedure | `playbook` | Repeatable, has steps and gates |
| Integration / Adapter | `adapter` | External tool connection |
| Principle / Value / Policy | `foundation` | Always `layer: company` |
| Knowledge / Reference | `foundation` or handbook entry | Depends on durability and audience |

## Multi-Artifact Detection

A single input often maps to multiple artifacts. Indicators:

- Input describes both a **role** AND **processes** that role follows → agent + playbook(s)
- Input describes a **capability** that requires an **external tool** → skill + adapter
- Input mixes **principles** with **operational procedures** → foundation + playbook
- Input defines a **role** with **unique capabilities** → agent + skill(s)

## Classification Procedure

1. Read the full input content.
2. Identify all content categories present in `input-content` (may be multiple).
3. For each category, determine the target artifact type.
4. Propose a `name` for each artifact (following the consumer-perspective naming convention).
5. Propose a `layer` for each artifact, honoring `layer-preference` when the caller already constrained the target scope:
   - `global` — universally applicable, not org-specific
   - `company` — org-specific defaults (most common)
   - `project` — project-scoped override
   - `person` — individual preference
6. Propose `tags` for categorization.
7. Output the classification report.

## Output Format

```yaml
classification:
  - artifact_type: skill
    name: proposed-name
    layer: company
    tags: ["leafcutter-os"]
    rationale: "Brief explanation of why this portion maps to this type."
    source_sections: ["Section heading or line range from input"]
  - artifact_type: agent
    name: proposed-name
    layer: company
    tags: ["leafcutter-os"]
    rationale: "..."
    source_sections: ["..."]
```

## Decision Heuristics

- If unsure between `skill` and `playbook`: Does it have ordered steps with gates/checkpoints? → playbook. Is it a reusable capability without strict ordering? → skill.
- If unsure between `foundation` and `skill`: Is it prose guidance about values/principles? → foundation. Is it an executable technique or tool usage? → skill.
- If unsure between `agent` and `skill`: Does it define a persona with decision-making authority? → agent. Is it a capability any agent could use? → skill.
- If content is purely reference/architecture documentation → it may belong in `handbook/` rather than `packages/`. Flag for human decision.
