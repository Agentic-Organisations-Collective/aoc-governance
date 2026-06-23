---
name: option-scoring
description: Score, rank, and recommend externally provided options without generating alternatives.
method-class: selection
layer: global
tags:
  - method
  - scoring
  - ranking
  - recommendation
interfaces:
  - id: objective
    description: Target outcome against which options are evaluated.
    required: true
  - id: options-input
    description: Candidate options provided by upstream systems, tools, or teams.
    required: true
  - id: source-input
    description: Evidence and factual context used to validate claims and tradeoffs.
    required: true
  - id: evaluation-criteria
    description: Weighted criteria used to produce comparable scores.
    required: false
  - id: recommendation-mode
    description: Controls whether output should include only ranking or ranking plus top recommendation.
    required: false
---

# Option Scoring

Use this method when options already exist and only evaluation, ranking, and recommendation are needed.

Use [../../../.github/instructions/foundation-factual-integrity.instructions.md](../../../.github/instructions/foundation-factual-integrity.instructions.md) as mandatory policy for evidence-grounded scoring.

## Inputs

- `objective` defines what winning means.
- `options-input` contains the options to score.
- `source-input` is the factual basis for pro and contra reasoning.
- `evaluation-criteria` can override default scoring dimensions.
- `recommendation-mode` controls recommendation verbosity.

## Output Contract

Return a scoring package with this structure:

1. Structured scorecard per option.
2. Per-option pro and contra grounded in `source-input` and `objective`.
3. Ranked list from strongest to weakest option.
4. Top recommendation summary when `recommendation-mode` requires it.

## Workflow

1. Normalize `objective` into measurable decision signals.
2. Validate that each entry in `options-input` is evaluable against those signals.
3. Resolve `evaluation-criteria` or use default criteria (objective-fit, clarity, expected impact, required effort, risk).
4. Score each option using the same criteria weights.
5. Derive pro and contra statements from `source-input` only.
6. Rank options and surface confidence notes for close scores.
7. Produce a top recommendation when requested by `recommendation-mode`.

## Guardrails

- Do not invent strengths or weaknesses not supported by `source-input`.
- If options are underspecified, return uncertainty notes instead of fabricated precision.
- Keep scoring rationale comparable across all options.
