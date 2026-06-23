---
name: optimize-media-image
description: Canonical skill id for optimizing image assets against quality and layout constraints.
layer: company
tags:
  - marketing
  - visual
interfaces:
  - id: reference-image-path
    description: Path to the source image to refine.
    required: true
  - id: target-constraints
    description: Layout, aspect ratio, and content migration rules.
    required: true
  - id: generation-model
    description: Optional image model preference.
    required: false
---

# Optimize Media Image

Optimize image assets against quality, composition, and format constraints.

Use this skill for post-production or generation-guided refinement of media images.

## Inputs

- `reference-image-path` points to the source image.
- `target-constraints` defines composition and formatting requirements.
- `generation-model` optionally selects the image generation backend.

## Output

Return an optimized image asset with notes about constraint handling and quality decisions.
