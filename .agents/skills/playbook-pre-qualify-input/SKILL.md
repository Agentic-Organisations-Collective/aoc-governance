---
name: pre-qualify-input
description: Convert unstructured multi-modal input into a pre-qualified intake artifact with deterministic persistence rules.
layer: company
tags:
  - intake
  - qualification
  - multimodal
  - publishing
interfaces:
  - id: raw-input-envelope
    description: Unstructured source input from issue systems, APIs, files, or manual capture.
    required: true
  - id: intake-target-schema
    description: Consumer-provided intake schema that defines required and optional metadata fields.
    required: true
  - id: qualification-policy
    description: Consumer rules for domain/topic classification, confidence thresholds, review-case taxonomy, and status decision logic.
    required: true
  - id: persistence-policy
    description: Consumer rules for where extracted assets and intake files must be persisted.
    required: true
  - id: extraction-capabilities
    description: Available capabilities for transcription, file inspection, and asset preparation.
    required: true
  - id: output-path-context
    description: Writable destination paths for intake markdown and persisted binary assets.
    required: true
  - id: issue-context
    description: Optional issue metadata (type, labels, comments, links) when source is an issue pipeline.
    required: false
---

# Pre-Qualify Input

Convert unstructured input (text, images, audio, video, PDFs, links) into a pre-qualified intake artifact that downstream playbooks can consume deterministically.

Use this playbook when incoming signals must be normalized before planning, routing, or proposal generation.

## Prerequisites

- `raw-input-envelope` includes source payload plus origin metadata.
- `intake-target-schema` is available and can be validated before handoff.
- `qualification-policy` defines domain/topic classification expectations, confidence policy, and review-case decision criteria.
- `persistence-policy` defines asset retention rules for audio, images, video, and PDFs.
- `extraction-capabilities` are available for transcription and asset preparation.
- `output-path-context` points to writable target locations.
- If issue-driven intake is used, `issue-context` contains issue type and current labels.

## Guidelines

- Apply deterministic persistence rules; do not improvise by channel or operator preference.
- Keep source traceability from intake artifact to origin reference (issue id, URL, or file reference).
- Do not persist unqualified binary assets without explicit policy allowance.
- Capture confidence and unresolved ambiguity explicitly instead of hiding uncertainty.
- If required schema fields cannot be resolved, emit `requires-review` and explain the missing fields.

## Workflow

### Phase 1 - Intake Gate and Source Normalization

- Validate source eligibility from `issue-context` when present (for example issue type is `Intake`).
- Ingest all incoming modalities into one normalized internal envelope:
  `text[]`, `images[]`, `audio[]`, `video[]`, `pdf[]`, `links[]`, `origin`.
- Attach stable source identifiers to each asset.

Quality gate: input is normalized and fully addressable by stable ids.

### Phase 2 - Extraction and Enrichment

- Run transcription for audio inputs using available `extraction-capabilities`.
- Build concise technical descriptors for non-text assets (image/video/pdf) without inventing semantic claims.
- Prepare extraction stubs when deep extraction is intentionally deferred by policy.

Quality gate: every asset has either extracted content or an explicit deferred extraction marker.

### Phase 3 - Qualification and Classification

- Apply `qualification-policy` to classify domains, candidate topics, and optional command labels.
- Compute confidence scores and keep rationale for low-confidence decisions according to `qualification-policy`.
- Evaluate review triggers from `qualification-policy` (for example low confidence, classifier conflicts, or missing required fields).
- Resolve conflicts between classifiers by policy priority; otherwise apply review-case status defined by `qualification-policy`.

Quality gate: domain/topic classification and confidence data are present and policy-compliant.

### Phase 4 - Persistence Decision

Apply `persistence-policy` exactly:

- Audio: do not persist binary audio by default; persist transcript in intake markdown.
- Images: persist image files to repository targets; downscale in a later optimization step.
- Video: persist video files to repository targets; transcription can be deferred.
- PDFs: persist PDF files to repository targets; extraction can be deferred.
- Audio quotes (`o-tones`): persist binary clips only when explicitly requested in source instructions.

Quality gate: each asset has a deterministic persistence outcome and destination.

### Phase 5 - Intake Artifact Assembly

- Create one intake markdown artifact following `intake-target-schema`.
- Include required frontmatter and allowed optional fields.
- Include structured chapters in the body for extracted and deferred content.
- Validate against `intake-target-schema` before finalizing.

Quality gate: intake artifact validates and contains required traceability and extraction sections.

### Phase 6 - Handoff Contract

- Emit final status: `qualified` or `requires-review`.
- Return persisted asset map, unresolved items, and next-step command suggestions.
- If issue-driven, write a concise operator summary suitable for issue comments.

Quality gate: downstream playbooks can execute without rereading raw source payloads.

## Output Format

The playbook should produce a machine-readable intake package using a generic reference envelope. The template lives in [examples/pre-qualify-input.output.template.yaml](examples/pre-qualify-input.output.template.yaml).

Consumers may enforce stricter validation through `intake-target-schema` and status/review logic through `qualification-policy`. If no stricter schema is injected, the template above acts as the default reference contract.

Required output guarantees:

- `status` must be policy-derived and set to `requires-review` for policy-defined review cases.
- `classification` must include domain/topic mapping and confidence rationale.
- `persistence` must include deterministic outcomes per asset type according to `persistence-policy`.
- `handoff.unresolved` must contain explicit reason codes for unresolved items.
- If `intake-target-schema` is provided, the output must validate against it before handoff.

Required markdown chapter conventions inside the intake file:

- `## Transcript` (required when audio exists)
- `## Referenced Images` (required when images exist)
- `## Referenced Videos` (required when videos exist)
- `## Referenced Documents` (required when PDFs exist)
- `## Deferred Extraction` (required when extraction is intentionally postponed)

## Policy Notes

- This playbook is generic and must not hardcode repository-specific domains, topics, or folder names.
- Consumer repositories inject concrete classification vocabularies, review-case taxonomy, output schema details, and storage locations through interfaces.
- The output template file is non-normative and documents a reference shape.
