---
name: communication-planning
description: Build and maintain a conflict-free communication plan by mapping qualified inputs to audiences, surfaces, and publication windows.
layer: company
tags:
  - planning
  - publishing
  - strategy
  - orchestration
interfaces:
  - id: planning-input-items
    description: Qualified planning inputs such as thoughts, developments, ideas, or source notes.
    required: true
  - id: audience-model
    description: Audience segments with communication goals, relevance criteria, and exclusions.
    required: true
  - id: surface-profiles
    description: Available publishing surfaces with purpose, format constraints, and cadence limits.
    required: true
  - id: topic-framework
    description: Active topic clusters, strategic priorities, and optional timing focus.
    required: true
  - id: content-history-index
    description: Historical and already-scheduled content used for duplicate and continuity checks.
    required: true
  - id: planning-calendar
    description: Scheduling horizon, blocked dates, and slot capacity per surface.
    required: false
  - id: planning-policy
    description: Governance rules for tie-breaks, approvals, and acceptable plan adjustments.
    required: true
  - id: planning-output-schema
    description: Optional consumer-provided schema for strict output validation and storage contracts.
    required: false
---

# Communication Planning

Convert qualified planning inputs into a governed communication plan that assigns each selected input to one or more surfaces with clear audience fit, surface-specific focus intent, and scheduling order.

Use this playbook when multiple candidate inputs must be prioritized, de-duplicated, and sequenced into an execution-ready plan.

For single-post drafting tasks, use channel-specific writing skills instead.

## Prerequisites

- `planning-input-items` is available as a normalized list where each item has a stable relative source path and summary.
- `audience-model` defines target segments and what each segment should gain from communication.
- `surface-profiles` defines delivery surfaces and execution constraints for each surface.
- `topic-framework` defines strategic themes and current planning priorities.
- `content-history-index` is current enough to detect near-duplicates and continuity gaps.
- `planning-policy` is available and specifies how to resolve collisions, low-confidence mappings, and rescheduling decisions.
- If provided, `planning-calendar` includes planning horizon, blocked windows, and maximum slot capacity per surface.
- If provided, `planning-output-schema` defines the strict output contract expected by the consuming workspace.

## Guidelines

- Do not force every input into the plan. Unfit or low-confidence inputs should be marked and deferred.
- Maintain one explicit primary audience per planned entry; secondary audiences are optional metadata.
- Allow one input to map to one or many surfaces according to audience communication goals and surface fit.
- Preserve traceability: every planned entry must link back to one or more relative source input paths.
- Prefer continuity over novelty only when continuity serves the current `topic-framework`.
- Never overwrite existing scheduled entries silently. Record all shifts with reason codes.

## Workflow

### Phase 1 - Normalize Inputs and Scope

- Collect all items from `planning-input-items` and validate required metadata (source path, summary).
- Confirm planning scope for this run: horizon, included surfaces, and policy mode from `planning-policy`.

Quality gate: all in-scope items are normalized, path-addressable, and ready for thematic analysis.

### Phase 2 - Thematic and Audience Mapping

- For each in-scope input, determine candidate topics from `topic-framework`.
- Determine the best primary audience using `audience-model` relevance criteria.
- Determine relevant secondary audiences when one input has clear cross-segment communication value.
- Propose one or more candidate surfaces using `surface-profiles` fit rules.
- Record a confidence rating, topic-fit rationale, and perspective rationale for each mapping decision.

Quality gate: each candidate mapping has topic, primary audience, optional secondary audiences, target surface options, confidence rationale, and a documented topic-fit perspective.

### Phase 3 - Duplicate and Continuity Check

- Compare candidate mappings against `content-history-index`.
- Classify each candidate as: duplicate, continuation, adjacent, or new.
- Reject or defer high-duplicate candidates unless `planning-policy` explicitly allows overlap.
- Annotate continuation candidates with the reference they extend.

Quality gate: duplicate risk is explicitly classified and only policy-compliant candidates move forward.

### Phase 4 - Sequencing and Scheduling

- Build a chronological sequence for policy-compliant candidates.
- Apply spacing, capacity, and blackout constraints from `planning-calendar` when available.
- Resolve collisions by policy priority (topic priority, audience urgency, confidence, recency).
- Assign planned date and sequence index per surface.

Quality gate: the plan is conflict-free for the declared horizon and every scheduled entry has a valid slot.

### Phase 5 - Focus Definition per Surface

- For each scheduled entry, define a surface-specific focus brief derived from the same core input.
- Ensure multi-surface variants are meaningfully distinct in angle, not simple rewordings.
- Capture audience communication goal alignment per entry.

Quality gate: each scheduled entry has a clear, surface-fit focus brief linked to audience goal intent.

### Phase 6 - Plan Finalization and Handoff

- Produce the full planning output package (summary, entry list, deferred list, conflicts).
- Mark plan status as `ready-for-proposal-generation` or `requires-review` according to `planning-policy`.
- Emit explicit handoff data for downstream proposal or asset-generation workflows.

Quality gate: downstream systems can execute without rereading source notes.

## Intermediate Reporting And Final Artifact

To enable transparency, review, and debuggability, planning runs should keep one final machine-readable plan artifact and one cumulative human-readable report. This preserves phase-by-phase traceability without treating each intermediate note as a first-class downstream artifact.

### Output Files

Each planning run should produce exactly these two files:

| File | Purpose | Update Timing |
| --- | --- | --- |
| `planning/[plan-slug].plan.yaml` | **Final output**: Combined summary, entry list, deferred list, handoff data, status | Written at Phase 6 |
| `planning/[plan-slug]_report.md` | Running report with one section per phase, decision notes, quality-gate status, and references to evidence used | Created in Phase 1, extended after every phase |

The `plan-slug` should describe the target planning outcome rather than the execution mechanics, for example `publishing-plan-june-2026.plan.yaml`.

### Report Structure

The report should keep a stable heading structure so humans and downstream agents can inspect one file instead of six separate checkpoints:

- `# Planning Report: <scope>`
- `## Phase 1 - Intake normalization`
- `## Phase 2 - Thematic and audience mapping`
- `## Phase 3 - Duplicate and continuity check`
- `## Phase 4 - Sequencing and scheduling`
- `## Phase 5 - Focus definition per surface`
- `## Phase 6 - Finalization and handoff`

Each phase section should record:

- summary of decisions
- quality-gate outcome
- deferred or blocked items
- references to relevant source files or prior content used for the decision

### Commit Strategy

When executing in a Git-based environment (recommended):

1. After Phase 1: Create or update `[plan-slug]_report.md` with the normalization section
2. After Phase 2: Extend the report with thematic mapping results
3. After Phase 3: Extend the report with duplicate and continuity decisions
4. After Phase 4: Extend the report with sequencing and scheduling decisions
5. After Phase 5: Extend the report with focus-brief summaries
6. After Phase 6: Write `[plan-slug].plan.yaml`, finalize the report, and open or update the pull request

### Pull Request Workflow

A draft PR should be opened after Phase 1 to serve as the tracking vehicle for report updates and the final plan artifact. The PR description should include:

```markdown
## Planning Run: [run-id]

**Scope**: [horizon, surfaces, input count]
**Status**: Phase 1 ✅ | Phase 2 ⏳ | Phase 3 ⏳ | Phase 4 ⏳ | Phase 5 ⏳ | Phase 6 ⏳

### Phase Progress

- Phase 1: X intakes normalized, Y% scope confirmed
- Phase 2: (pending)
- Phase 3: (pending)
- Phase 4: (pending)
- Phase 5: (pending)
- Phase 6: (pending)

### Key Decision Points

(Updated as phases complete)
```

After each phase, update the PR status line and add a summary comment linking to the updated report section or the final plan artifact.

### Checkpoint Inspection Pattern

Between phases, systems or humans can inspect the cumulative report to:

- Verify correctness of prior phase decisions
- Request re-runs of a specific phase without re-executing all prior phases
- Document assumptions and decision rationale for audit trails
- Block handoff to next phase if quality gates are not met

## Output Format

The playbook should produce a machine-readable communication planning package using a generic reference envelope. The template lives in [examples/communication-planning.output.template.yaml](examples/communication-planning.output.template.yaml).

Consumers may enforce stricter validation through `planning-output-schema`. If no stricter schema is injected, the template above acts as the default output contract.

Required output guarantees:

- Every scheduled entry includes `source_inputs`, `surface`, `planned_date`, and `focus_brief`.
- No duplicate `entry_id` values are allowed.
- `status` must be `requires-review` when unresolved conflicts exist.
- Deferred items must include explicit `reason_code` for deterministic follow-up.
- If `planning-output-schema` is provided, the output must validate against that schema before handoff.
