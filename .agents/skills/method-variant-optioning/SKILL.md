---
name: variant-optioning
description: Generate, evaluate, rank, and recommend bounded alternatives from the same input objective.
method-class: evaluation
layer: global
tags:
  - method
  - variants
  - recommendation
interfaces:
  - id: objective
    description: Target outcome used to evaluate alternatives.
    required: true
  - id: source-input
    description: Verified input basis used to derive proposals.
    required: true
  - id: media-type
    description: Output medium such as text, image, video, slide, or email.
    required: true
  - id: variant-count
    description: Requested number of variants.
    required: false
  - id: complexity-level
    description: Complexity marker used for fallback behavior.
    required: false
  - id: execution-policy
    description: Optional policy for proactive execution of the top recommendation.
    required: false
  - id: evaluation-criteria
    description: Optional weighted criteria for scoring and ranking.
    required: false
---

# Variant Optioning

Apply this method whenever multiple options should be produced from one shared input and one recommendation should be made transparently.

Use [../../../.github/instructions/foundation-factual-integrity.instructions.md](../../../.github/instructions/foundation-factual-integrity.instructions.md) as a mandatory policy baseline during generation and evaluation.
Use [../option-scoring/option-scoring.method.md](../option-scoring/option-scoring.method.md) for scoring and ranking once variants are generated.

## Inputs

- `objective` defines what success means.
- `source-input` is the only allowed factual basis for generated options and tradeoff reasoning.
- `media-type` activates output fallback behavior.
- `variant-count` requests explicit output count.
- `complexity-level` adjusts execution depth for expensive media.
- `execution-policy` controls whether the top recommendation may be proactively executed.
- `evaluation-criteria` defines weighted ranking criteria.

## Output Contract

Return a variant package with this structure:

1. Variant list (`n` entries) with concise rationale per variant.
2. Per-variant pro and contra grounded in `source-input` and `objective`.
3. Ranked order with explicit score explanation.
4. Top recommendation with one-paragraph why.
5. Optional proactive execution artifact if `execution-policy` allows.

## Workflow

1. Parse `objective` and normalize it into measurable evaluation signals.
2. Extract grounded evidence from `source-input` and mark unknowns explicitly.
3. Resolve target count using `variant-count` or fallback rules by `media-type` and `complexity-level`.
4. Generate candidate variants with shared factual core and distinct strategic angle.
5. Score and rank candidates via `option-scoring` using `objective`, `source-input`, and `evaluation-criteria`.
6. Use score outputs to publish ranked options and one top recommendation.
7. If `execution-policy` permits proactive action, create the implementation artifact for rank 1 and keep non-selected variants as alternatives.

## Fallback Policy

- If `variant-count` is provided, it has highest priority.
- Otherwise, resolve count and production depth from caller policy keyed by `media-type` and `complexity-level`.
- If no caller policy exists, default to 2 conceptual variants with at most 1 fully produced artifact and keep remaining variants as structured descriptions.

## Guardrails

- Do not create claims without support in `source-input`.
- Every pro and contra statement must reference at least one concrete input signal.
- Keep recommendation quality auditable: if criteria changed ranking, state that explicitly.
