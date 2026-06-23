---
name: create-media-slides
description: Canonical skill id for creating promotional slide or carousel assets.
layer: global
tags:
  - marketing
  - visual
  - slides
interfaces:
  - id: content-outline
    description: Structured slide content with points and details.
    required: true
  - id: master-template-id
    description: Optional template identifier for slide rendering.
    required: false
  - id: brand-profile
    description: Optional visual identity constraints.
    required: false
  - id: format-spec
    description: Optional format packaging constraints from injected context.
    required: false
---

# Create Media Slides

Create promotional slide or carousel assets from structured content.

Use this skill when a selected format requires multi-frame storytelling with consistent visual structure and clear progression.

## Inputs

- `content-outline` defines slide-by-slide structure and narrative sequence.
- `master-template-id` optionally pins rendering to a specific template.
- `brand-profile` provides visual style constraints.
- `format-spec` supplies packaging rules such as slide count or aspect requirements.

## Output

Return a ready-to-publish slide or carousel asset with file path and basic production metadata.
