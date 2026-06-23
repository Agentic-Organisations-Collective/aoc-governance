---
name: leafcutter-os-intake
description: Transform raw input content into governed leafcutter-os artifacts through analysis, deduplication, creation, and review.
layer: company
tags:
  - leafcutter-os
permissions:
  files:
    read: ["inbox/**", "packages/**", "handbook/**", "governance/**"]
    write: ["packages/**"]
    deny_write: ["governance/**", "handbook/**", "AGENTS.md"]
interfaces:
  - id: artifact-classification-skill
    description: Classification capability for routing the raw input.
    required: true
  - id: writing-skills
    description: Writing or conversion skills relevant to the target artifact type.
    required: true
  - id: file-context
    description: Writable intake and artifact target locations.
    required: true
---

# Leafcutter-OS Intake

Transform raw input content (notes, sketches, documentation, prompts) into governed leafcutter-os artifacts. This playbook defines the end-to-end workflow from receiving new content to validated, interlinked artifacts in the `packages/` tree.

It assumes a working `file-context`, routes the intake through an available `artifact-classification-skill`, and then hands confirmed targets to the appropriate `writing-skills`.

## Prerequisites

- Input content is placed in `inbox/` or provided directly through the available `file-context`.
- The Curator agent (or human) orchestrates this playbook.
- The `artifact-classification-skill` is available.
- The relevant `writing-skills` are available.

## Guidelines

- Never create artifacts without running through the overlap check.
- Always validate against governance schemas before committing.
- Prefer extending existing artifacts over creating near-duplicates.
- Tag leafcutter-os-specific artifacts with `tags: ["leafcutter-os"]` in frontmatter.

## Workflow

### Phase 1 — Analyse Input

Use the `artifact-classification-skill` to:

1. **Identify content type(s):** instruction, knowledge, rule, role, principle, process, integration, or a mix.
2. **Map to artifact type(s):** agent, skill, adapter, playbook, foundation — one input may yield multiple artifacts.
3. **Extract key metadata:** proposed name, layer, description, tags.

Output: A classification report listing each proposed artifact with type, name, and rationale.

### Phase 2 — Overlap & Deduplication Check

Scan existing artifacts for overlap:

1. Search `packages/` for artifacts with similar names, descriptions, or coverage.
2. Produce an overlap matrix: `{ existing_artifact, overlap_degree: full|partial|none, recommendation }`.

Recommendations per overlap case:

- **Full overlap** → Skip creation; reference existing artifact.
- **Partial overlap** → Propose extending the existing artifact OR creating a new one with explicit cross-references.
- **No overlap** → Proceed to creation.

Present the overlap report and await confirmation before proceeding.

### Phase 3 — Define Target Artifacts

For each confirmed new artifact:

1. Select the appropriate `writing-skills` entry (`agent-writing`, `skill-writing`, `playbook-writing`, `adapter-writing`, or `foundation-writing`).
2. Define the target path: `packages/{type}/{name}/{name}.{type}.md`.
3. Define the `package.json` metadata.
4. List dependencies on other artifacts (if any).

### Phase 4 — Create & Validate

For each target artifact:

1. Invoke the corresponding writing skill.
2. Generate the artifact file with correct frontmatter and content.
3. Generate the `package.json`.
4. Interlink artifacts if multiple were created (cross-references in body, dependencies in package.json).
5. Validate frontmatter against governance schemas.

Quality gate: Run `pnpm lint:artifacts` to confirm all new artifacts pass schema validation.

### Phase 5 — Review & Governance Check

1. Review the final result for:
   - Correct and complete frontmatter metadata.
   - Naming follows the consumer-perspective convention (see naming rules below).
   - No duplications or circular dependencies.
   - Content is coherent and actionable.
2. Run full quality suite: `pnpm check`.
3. Present the review summary for human approval.

### Phase 6 — Finalize

1. Commit new artifacts with conventional commit: `feat(intake): add {artifact-names}`.
2. Remove the processed file from `inbox/` (if sourced from there).

## Naming Convention

Artifact names are chosen from the **package consumer's perspective**:

- The name must be meaningful and unambiguous when read as `@schafe-vorm-fenster/{type}-{name}`.
- Avoid internal jargon that only makes sense inside this repository.
- If the artifact is specifically about leafcutter-os itself, prefix with `leafcutter-os-` (e.g., `leafcutter-os-intake`).
- If the artifact is a general-purpose capability, use a descriptive domain name (e.g., `github-issues`, `optimize-media-image`).
