---
name: select-media-format
description: Canonical skill id for selecting the best-fit communication media format.
layer: global
tags:
  - marketing
  - visual
  - decision-logic
interfaces:
  - id: post-content
    description: Finalized post text or narrative payload.
    required: true
  - id: communication-goal
    description: Optional communication intent such as opinion, tutorial, or announcement.
    required: false
  - id: format-spec
    description: Optional format constraints from injected media-format context.
    required: false
  - id: brand-profile
    description: Optional brand identity constraints for visual feasibility.
    required: false
---

# Select Media Format

Select the best-fit media format for a communication payload.

Use this skill when the next decision is packaging: image, slides/carousel, video, or another supported format according to `format-spec`, `channel-spec`, and `brand-profile` constraints.

## Inputs

- `post-content` is the finalized narrative payload to evaluate.
- `communication-goal` indicates intent such as announcement, tutorial, or opinion.
- `format-spec` provides concrete packaging constraints for allowed output types.
- `brand-profile` contributes visual identity and production limitations.

## Output

Return a primary format recommendation and one fallback recommendation with short rationale.
