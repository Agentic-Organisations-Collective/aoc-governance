---
name: edit-media-slides
description: Canonical skill id for editing and refining existing media slide decks.
layer: company
tags:
  - marketing
  - presentations
interfaces:
  - id: content-outline
    description: Structured content to inject or refine in the deck.
    required: true
  - id: presentation-id
    description: Presentation identifier of the working deck.
    required: true
  - id: master-layout-id
    description: Optional master template layout reference.
    required: false
---

# Edit Media Slides

Edit and refine existing media slide decks with layout and quality controls.

Use this skill when a slide deck already exists and needs structural, semantic, or visual refinement before publication.

## Inputs

- `content-outline` describes what content should be injected or refined.
- `presentation-id` identifies the target deck.
- `master-layout-id` optionally constrains editing to a specific layout set.

## Output

Return an updated deck state summary including key edits and any unresolved layout issues.
