---
name: create-media-article
description: Create structured long-form article drafts from source material and injected context.
layer: global
tags:
  - marketing
  - writing
  - editorial
interfaces:
  - id: source-material
    description: Core source notes, facts, and argument material.
    required: true
  - id: channel-spec
    description: Channel constraints such as article length, structure, and editorial style.
    required: true
  - id: audience-profile
    description: Audience context for explanation depth, framing, and terminology.
    required: false
  - id: voice-profile
    description: Optional author or brand voice constraints.
    required: false
  - id: publication-date
    description: Optional publication date reference in ISO 8601 format.
    required: false
---

# Create Media Article

Create long-form article drafts that are channel-fit, audience-aware, and fact-grounded.

Use this skill when the output is an article rather than a short social post.

## Inputs

- `source-material` provides the factual basis and argument chain.
- `channel-spec` defines article structure and editorial constraints.
- `audience-profile` tunes terminology, examples, and explanation depth.
- `voice-profile` adds stylistic and perspective constraints.
- `publication-date` sets temporal references when required.

## Workflow

1. Distill the central claim from `source-material` and list supporting evidence.
2. Build an article outline according to `channel-spec`.
3. Adapt framing and readability to `audience-profile` when available.
4. Apply style and perspective constraints from `voice-profile`.
5. Draft section by section with clear transitions and concrete examples.
6. Insert or format date references from `publication-date` when needed.

## Output

Return a publication-ready article draft with clear heading structure, coherent narrative flow, and explicit factual grounding.
