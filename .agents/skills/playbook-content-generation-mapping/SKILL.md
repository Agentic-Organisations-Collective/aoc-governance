---
name: content-generation-mapping
description: "[DEPRECATED] Use content-creation-from-plan for plan-driven workflows or create-content for single-entry creation."
layer: company
status: deprecated
deprecated_by: content-creation-from-plan
tags:
  - marketing
  - content
  - automation
  - end-to-end
  - deprecated
interfaces:
  - id: source-thought
    description: Raw thought or intake note to transform.
    required: true
  - id: strategic-plan-context
    description: Strategic content plan with themes and audiences.
    required: true
  - id: communication-strategy
    description: Tone, value framing, and brand guidance.
    required: true
  - id: visual-designer-agent
    description: Visual design orchestration capability.
    required: true
  - id: communication-planning-playbook
    description: Strategic planning playbook for mapping inputs to audiences, surfaces, and publication windows.
    required: true
---

# Content Generation and Mapping

Transform a raw thought (audio recording or text note) into one or more complete content proposals, each containing finalized post text and an appropriate visual asset, mapped to the strategic content plan.

Use this playbook when a new thought enters the system and needs to move through the full pipeline: transcription, strategic mapping, post writing, visual creation, and proposal assembly. For individual steps in isolation, use the corresponding skill or agent directly. Then hand off to [publishing-execution](../publishing-execution/publishing-execution.playbook.md) for publication management.

## Prerequisites

- A `source-thought` exists: either an audio file or a text note.
- A `strategic-plan-context` with strategic themes and target audiences is accessible.
- `communication-strategy` and CI/CD guidelines are available as context.
- The `communication-planning-playbook` is available and can be invoked for strategic mapping decisions.
- The `visual-designer-agent` is available to orchestrate media generation and escalation.
- Tone and value foundations are available.

## Guidelines

- Process every thought, even if the strategic fit is imperfect. Cadence matters more than perfection.
- Do not skip the mapping phase. Every post must have a deliberate strategic placement.
- Differentiate variants meaningfully. If a thought only supports one good post, do not force a weaker second variant.
- Keep proposals self-contained. A reviewer should understand the post without reading the source thought.
- Reference but do not duplicate strategic documents. Link to the content plan and guidelines rather than copying them into the proposal.
- If any phase produces a quality concern (weak fit, unclear audience, missing CI/CD), note it in the proposal metadata rather than silently proceeding.

## Workflow

### Phase 1 — Intake and Transcription

- If the `source-thought` is an audio file, transcribe it using [audio-to-text](../skill-audio-to-text/SKILL.md).
- Clean the transcript: remove filler, correct spelling, preserve substantive content.
- Save the resulting thought as a structured text artifact.

Quality gate: a clean, readable text document exists that captures the full substance of the original input.

### Phase 2 — Strategic Mapping

- Review the current `strategic-plan-context`: recent publications, scheduled topics, identified gaps.
- Execute the `communication-planning-playbook` to evaluate the thought against defined strategic themes and target audiences.
- Determine whether the thought maps to one post or multiple posts (e.g., personal + company profile variants).
- Assign each planned post a target profile, theme, and tentative calendar week.
- The [communication-planning](../communication-planning/communication-planning.playbook.md) playbook owns the mapping logic for this phase.

Quality gate: every resulting post entry has a clear audience, profile, theme assignment, and planned publication window.

### Phase 3 — Post Writing

- For each planned post entry, generate the LinkedIn post text.
- Use [create-media-post](../skill-create-media-post/SKILL.md) with the appropriate perspective (personal profile voice or company page voice).
- Apply the required `communication-strategy` through tone guidance from [tone-of-voice](../../../.github/instructions/foundation-tone-of-voice.instructions.md) and value framing from [culture-values](../../../.github/instructions/foundation-culture-values.instructions.md).
- If multiple variants exist, ensure they are genuinely differentiated — not the same post with minor rewording.

Quality gate: each post reads as channel-fit, audience-relevant LinkedIn copy with a clear hook and conclusion.

### Phase 4 — Visual Asset Creation

- For each post, determine the optimal media format using [select-media-format](../skill-select-media-format/SKILL.md).
- Produce the visual asset based on the selected format:
  - Photo/Image → [optimize-media-image](../skill-optimize-media-image/SKILL.md)
  - PDF Carousel → [create-media-slides](../skill-create-media-slides/SKILL.md)
  - Infographic → image generation with CI/CD compliance
- Apply brand guidelines (colors, fonts, dimensions) throughout.
- Use the Visual Designer agent as the `visual-designer-agent` to orchestrate this phase and keep media execution aligned with the selected format.

Quality gate: a production-ready media file exists for each post, matching the content in tone and subject.

The `visual-designer-agent` owns escalation when the selected format cannot be produced cleanly within the available templates or brand rules.

### Phase 5 — Proposal Assembly

- Combine post text and visual asset into a complete content proposal.
- Add metadata: target profile, planned publication date, strategic theme, source thought reference.
- Set proposal status to "awaiting review".
- Store the proposal in the designated proposal location within the consuming workspace.

Quality gate: a self-contained proposal document exists that a reviewer can approve without needing additional context.

## Output Format

For each generated proposal:

```yaml
proposal:
  title: "<Post headline or working title>"
  target_profile: personal | company
  planned_date: "YYYY-MM-DD"
  theme: "<strategic theme>"
  source_thought: "<path to source thought>"
  post_text: |
    <Full LinkedIn post text>
  media:
    format: photo | infographic | pdf-carousel
    path: "<path to media file>"
  status: awaiting-review
```
