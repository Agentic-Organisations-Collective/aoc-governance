---
name: publish-media-post
description: Canonical skill id for publishing approved posts to target surfaces.
layer: global
tags:
  - marketing
  - publishing
  - automation
interfaces:
  - id: content-proposal
    description: Final post text and media metadata to publish.
    required: true
  - id: target-profile
    description: Target profile or target surface context.
    required: true
  - id: scheduled-date
    description: Optional publication timestamp in ISO 8601 format.
    required: false
---

# Publish Media Post

Publish approved media posts to target surfaces.

Use this skill for execution-layer publishing after planning and content creation are complete.

## Inputs

- `content-proposal` contains final copy and media metadata.
- `target-profile` identifies the execution target context.
- `scheduled-date` optionally requests delayed publication timing.

## Output

Return structured execution status including success/failure, timestamp, and post URL when available.
