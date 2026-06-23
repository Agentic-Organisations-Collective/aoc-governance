---
name: engineering-v-model-delivery
description: Coordinate a seven-step V-model delivery flow across the existing engineering roles from requirements through retrospective.
layer: company
tags:
  - engineering
  - delivery
interfaces:
  - id: orchestrator-role
    description: Orchestrator role coordinating phase transitions and handoffs.
    required: true
  - id: specialist-roles
    description: Specialist roles available for requirements, architecture, testing, review, audit, and supervision.
    required: true
  - id: feature-scope-context
    description: Concrete feature request with clear scope.
    required: true
---

# Engineering V-Model Delivery

Coordinate a structured seven-step delivery flow across the existing engineering roles from requirements through retrospective. Use this playbook when a feature needs explicit handoffs, traceability, and post-delivery process learning rather than an improvised sequence.

[@orchestrator](../role-orchestrator/SKILL.md) owns the sequence as the `orchestrator-role`. The `specialist-roles` stay specialized. Implementation happens in the active coding runtime or with a human engineer, and the whole run is anchored in a concrete `feature-scope-context`. This playbook intentionally does not define or require a repository-owned generic Coding Agent artifact.

## Prerequisites

- A concrete `feature-scope-context` exists as a feature request, user story, or delivery objective.
- [@orchestrator](../role-orchestrator/SKILL.md) has enough context as the `orchestrator-role` to identify the intended scope and affected system area.
- The [@requirements-engineer](../role-requirements-engineer/SKILL.md), [@architect](../role-architect/SKILL.md), [@test-engineer](../role-test-engineer/SKILL.md), [@code-reviewer](../role-code-reviewer/SKILL.md), [@requirements-auditor](../role-requirements-auditor/SKILL.md), and [@supervisor](../role-supervisor/SKILL.md) roles are available as the required `specialist-roles`.
- The implementation owner is known: either the active coding environment or the responsible engineer.

## Guidelines

- Use this playbook for feature delivery workflows, not for single-agent analysis requests.
- Keep role boundaries crisp. Requirements, architecture, testing, review, audit, and retrospective stay separate on purpose.
- Prefer the existing engineering roles instead of creating renamed duplicates.
- Treat a generic Coding Agent as intentionally out of scope for the governed repository package set.
- When the workflow reveals durable process improvements, update the relevant agent or playbook artifact rather than burying the learning in an inbox note.

## Workflow

### Phase 1 — Requirements Shaping

Assign the request to [@requirements-engineer](../role-requirements-engineer/SKILL.md).

The `@requirements-engineer` role should:

1. Clarify the user story, scope, and acceptance criteria.
2. Surface missing assumptions, edge cases, and constraints.
3. Record open questions that must be answered before design begins.

Quality gate: the work has a scoped requirement set with acceptance criteria, relevant context, and explicit open questions.

### Phase 2 — Architecture Mapping

Assign the shaped requirements to [@architect](../role-architect/SKILL.md).

The `@architect` role should:

1. Map the requirements into the current system structure.
2. Identify affected modules, interfaces, and integration points.
3. Provide at least two design options when architectural choice is involved.
4. Surface architectural gaps, tradeoffs, and recommendations.

Quality gate: the implementation path is architecturally mapped, unresolved design decisions are explicit, and the recommended option is clear.

### Phase 3 — Test Design

Assign the requirements and architecture output to [@test-engineer](../role-test-engineer/SKILL.md).

The `@test-engineer` role should:

1. Define the test strategy across unit, integration, and end-to-end levels.
2. Translate acceptance criteria into verification coverage.
3. Draft Gherkin-oriented scenarios or equivalent structured test outlines.
4. Flag any design intent still needed from `@architect`.

Quality gate: every acceptance criterion has a planned verification path and the test depth matches the feature surface.

### Phase 4 — Implementation

Hand off the requirements, architecture guidance, and test design to the implementation owner.

The implementation owner should:

1. Build the requested behavior within the approved architectural constraints.
2. Add or update tests according to the agreed test strategy.
3. Keep implementation scope aligned to the shaped requirements.

Implementation is a runtime execution responsibility, not a governed repository-owned agent artifact. Do not create or route to a durable generic Coding Agent package for this phase.

Quality gate: the requested behavior exists, the planned verification is implemented, and the change is ready for technical review.

### Phase 5 — Technical Review

Assign the implementation result to [@code-reviewer](../role-code-reviewer/SKILL.md).

The `@code-reviewer` role should:

1. Review code against architecture, project standards, and implementation guidance.
2. Classify blockers, concerns, and suggestions.
3. Return concrete findings with file-level evidence.

Quality gate: blockers are either resolved or explicitly sent back to implementation with the correct escalation path.

### Phase 6 — Requirements Audit

Assign the reviewed implementation to [@requirements-auditor](../role-requirements-auditor/SKILL.md).

The `@requirements-auditor` role should:

1. Verify that each acceptance criterion is implemented.
2. Verify that each criterion and edge case is appropriately tested.
3. Detect scope creep, missing verification, or incomplete delivery.

Quality gate: requirements traceability is complete enough for sign-off or the missing elements are explicitly returned to the responsible upstream phase.

### Phase 7 — Process Retrospective

Assign the completed delivery record to [@supervisor](../role-supervisor/SKILL.md).

The `@supervisor` role should:

1. Review the full sequence for roundtrips, ambiguity, and handoff friction.
2. Identify gaps in instructions, documents, or sequencing.
3. Recommend improvements for the next run.

Quality gate: concrete process learnings are captured for reuse, and recurring friction is turned into an improvement proposal.

## Handoff Rules

- Do not start Phase 2 until the requirement scope and open questions are explicit enough to design against.
- Do not start Phase 3 until the architecture recommendation is clear enough to test against.
- Do not start Phase 4 until requirements, architecture, and test strategy exist in a form the implementation owner can execute.
- If `@architect` raises unresolved feasibility issues, route back to `@requirements-engineer` or the user before implementation.
- If `@test-engineer` needs design intent, route back to `@architect` rather than guessing in implementation.
- If `@code-reviewer` finds blockers, send the work back to implementation and involve `@architect` when the issue is structural.
- If `@requirements-auditor` finds unmet criteria or missing tests, route the work back to the phase that owns the defect instead of forcing closure.
- Run the retrospective after delivery decisions are complete so it improves the next iteration rather than interrupts the current one.
