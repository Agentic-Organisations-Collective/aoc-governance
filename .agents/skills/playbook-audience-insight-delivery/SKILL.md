---
name: audience-insight-delivery
description: Turn a development into audience-relevant communication across a primary channel and a condensed companion channel.
layer: company
tags:
  - marketing
  - communication
interfaces:
  - id: channel-profiles
    description: Primary and companion channel targets.
    required: true
  - id: audience-context
    description: Specific audience segment and messaging goals.
    required: true
  - id: communication-skills
    description: Relevant writing or analysis skills for the target channels.
    required: true
---

# Audience Insight Delivery

Turn a product, technical, or business development into communication that matters to a specific audience, then package it for both a primary channel and a condensed companion channel.

Use this playbook when the task requires more than drafting a single post. It is for cases where the work includes `audience-context` checking, `channel-profiles` selection, and multi-channel delivery through the relevant `communication-skills`. For one-off channel writing, use the relevant writing skill directly instead.

## Prerequisites

- A concrete development, update, or announcement exists.
- The intended audience is known or can be inferred.
- The `audience-context` is specific enough to guide framing choices and message depth.
- At least one primary channel is known through available `channel-profiles`.
- Any durable tone or value guidance is available.
- The relevant `communication-skills` are available for the selected channel mix.

## Guidelines

- Keep client-, project-, and person-specific voice rules in an add-on layer rather than in the core playbook.
- Do not invent evidence, outcomes, or certainty that the source material does not support.
- Prefer a paired delivery model only when the audience and workflow benefit from it. If the task is truly single-channel, use the channel skill instead of this playbook.
- Reference prior updates only when they add clarity or continuity.
- Keep the audience problem visible throughout the workflow; do not let internal process language become the message.

## Workflow

### Phase 1 — Confirm the Core Signal

- Read the full source material and separate the real update from side notes, draft chatter, or generic framing.
- Identify what changed, why it matters, and what evidence supports the message.
- Note any missing facts that would make the communication unreliable.

Quality gate: you can state the development and its significance in one short paragraph without guessing.

### Phase 2 — Check Context and Continuity

- Review prior communication history or archives when they are available.
- Decide whether the update is new, a continuation of an earlier thread, or too repetitive to send unchanged.
- Identify any earlier success story, prior update, or contextual reference that adds useful continuity.

Quality gate: you know whether the message should stand alone, reference a prior update, or be withheld until it becomes substantively new.

### Phase 3 — Frame the Audience Problem

- Start from the `audience-context` situation, friction, or question rather than from internal excitement.
- Choose the most useful angle: benefit, risk, tradeoff, progress update, or practical implication.
- Select the primary and secondary `channel-profiles` for the full message and the condensed follow-up.

Quality gate: you can explain why this audience should care and what framing best fits the selected channels.

### Phase 4 — Draft the Channel Outputs

- Draft the primary channel version first.
- Use [../skill-create-media-post/SKILL.md](../skill-create-media-post/SKILL.md) as one of the `communication-skills` for both concise social posts and short news/blog outputs.
- Create the condensed companion version after the primary version so both outputs stay aligned in facts and emphasis.
- Adapt length, structure, and tone to the channel without changing the core message.

Quality gate: the primary and condensed versions tell the same story, but each feels native to its channel.

### Phase 5 — Review and Handoff

- Verify factual alignment with the source material.
- Check tone against [../../../.github/instructions/foundation-tone-of-voice.instructions.md](../../../.github/instructions/foundation-tone-of-voice.instructions.md) and value framing against [../../../.github/instructions/foundation-culture-values.instructions.md](../../../.github/instructions/foundation-culture-values.instructions.md).
- Surface open questions, missing approvals, or unresolved dependencies before publication.

Quality gate: the final package is channel-fit, factually grounded, and ready for review or publishing.
