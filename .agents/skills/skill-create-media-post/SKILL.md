---
name: create-media-post
description: Canonical skill id for creating channel-fit posts and short news/blog updates from source material and injected context.
layer: global
tags:
  - marketing
  - writing
  - editorial
interfaces:
  - id: post-topic
    description: Main subject or thought for concise social-style outputs.
    required: false
  - id: source-material
    description: Raw notes, announcements, or background context for news-style outputs.
    required: false
  - id: voice-profile
    description: Optional voice and perspective context.
    required: false
  - id: audience-profile
    description: Optional audience framing constraints.
    required: false
  - id: channel-spec
    description: Optional channel-level language and formatting constraints.
    required: false
  - id: target-languages
    description: Optional publication language list for multilingual output variants.
    required: false
  - id: publication-date
    description: Optional publication date in ISO 8601 format.
    required: false
  - id: variant-count
    description: Optional number of requested output variants.
    required: false
---

# Create Media Post

Create channel-fit post copy and short news/blog updates from source input plus injected context.

Use this skill for concise social-style posts and short editorial updates where channel constraints and audience framing should be injected through context interfaces instead of being hardcoded in the skill body.

Use [../../methods/variant-optioning/variant-optioning.method.md](../../methods/variant-optioning/variant-optioning.method.md) for variant generation, ranking, and top recommendation behavior.
Use [../../../.github/instructions/foundation-factual-integrity.instructions.md](../../../.github/instructions/foundation-factual-integrity.instructions.md) as mandatory policy for factual grounding.

This skill is text-only. For image, slide, or video outputs, use the corresponding media creation skills.
When applying `variant-optioning` from this skill, treat `media-type` as fixed to `text`.

## Inputs

- At least one of `post-topic` or `source-material` is required.
- `post-topic` provides the primary subject for concise social-style drafts.
- `source-material` provides the factual basis for news or short blog updates.
- `voice-profile` adjusts perspective, tone, and phrasing style when available.
- `audience-profile` adds audience-specific framing constraints when provided.
- `channel-spec` applies channel-level rules such as length and formatting.
- `target-languages` optionally requests multilingual output variants.
- `publication-date` optionally sets publication timing references.
- `variant-count` optionally requests a fixed number of text variants; fallback behavior follows the text branch in `variant-optioning`.

## Output

Return one or more channel-fit variants that are audience-aware, factually grounded, and aligned with the requested communication intent.

## Workflow

1. Determine source mode from inputs: concise mode from `post-topic`, editorial mode from `source-material`, or combined mode when both are provided.
2. In editorial mode, extract verified facts from `source-material` and remove speculation.
3. Derive audience relevance from `audience-profile` when available. If absent, use a broadly professional framing.
4. Apply perspective and style constraints from `voice-profile`.
5. Enforce structural and formatting constraints from `channel-spec`.
6. Draft with fit-for-purpose structure: in concise mode use opening claim, short development, decisive close; in editorial mode use title, framing intro, structured body, concise close.
7. If `target-languages` is provided, produce language variants with stable factual core.
8. If `publication-date` is provided, include publication timing references in the requested output format.
9. Apply variant behavior via `variant-optioning` using `variant-count` when supplied; otherwise apply text fallback count.
10. Keep factual core stable across variants and surface one top recommendation when ranking is requested.

## Writing Rules

- Lead with the subject, not with meta commentary about writing.
- Prefer high-signal wording over generic inspiration language.
- Keep sentences active and concrete; include one or two factual anchors when possible.
- Default to plain-text paragraph structure unless `channel-spec` requires another format.
- Do not add citations, external links, or hashtags unless explicitly required by `channel-spec`.
- Never add email-like sign-offs.
- Never invent facts that are not present in `source-material`.

## Variants

When `channel-spec` or task context asks for profile variants, produce separate outputs with distinct framing while preserving the same factual kernel.
