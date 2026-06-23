---
name: folder-index
description: Generate and validate schema-driven INDEX.yaml manifests for content folders so agents can discover folder contents without loading every file.
layer: global
tags:
  - index
  - schema
  - manifest
  - governance
interfaces:
  - id: folder-path
    description: Directory to index.
    required: true
  - id: output-path
    description: Destination path for the generated index file.
    required: true
  - id: schema-version
    description: Optional schema version preference.
    required: false
---

# Folder Index

Generate and validate machine-readable `INDEX.yaml` manifests for content-heavy folders. The index gives agents and scripts a cheap way to discover, triage, and deduplicate folder contents without loading every source file.

Use this skill when the task is to create, regenerate, or validate a folder index. The pattern is content-type agnostic and works for any `folder-path` whose files follow a declared schema, writes the manifest to `output-path`, and can honor a specific `schema-version` when multiple index contracts coexist.

## Core Concept

Each indexed `folder-path` owns a canonical `INDEX.yaml`.

- `INDEX.yaml` at `output-path` is the single source of truth for the folder manifest.
- The index is generated deterministically from validated content files plus their schema metadata.
- The content schema declares which fields are index-relevant.

## Design Principles

1. No guessing. The generator must not infer meaning from field names, wording, or heuristics.
2. No duplicate business logic. The index is a projection of schema-relevant data, not a second content model.
3. No artificial identifiers unless the content type already defines a natural one.
4. The file path is the canonical locator for an entry.
5. Index scope is folder-local. A subfolder can be indexed independently from its parent.
6. Every indexed entry must be traceable back to the source file.
7. Generation must be reproducible from schema plus files alone.

## Folder Contract

Each indexed folder declares its content schemas in its README:

```yaml
schemas:
  - <schema-module-path>
```

- `schemas` lists the modules that export Zod schemas for files in this folder.
- Paths are relative to the repository root or a package name that resolves via the module system.
- Most folders will have exactly one schema. Multiple schemas are allowed when a folder contains different content types.
- `scope` is implicit: the declaration covers the folder where the README lives. Subfolders (e.g. yearly archives) inherit the parent schemas unless they declare their own.

The index generator uses the first schema from the list by default. Pass `--schema` explicitly when a folder has multiple schemas and `schema-version` or another contract choice requires indexing against a specific one.

Schema files live where the content type is defined, not inside every indexed folder. This keeps year folders, archive folders, and planning folders aligned without duplicating schema code.

### Subfolder Inheritance

When a parent folder declares `schemas`, child folders are indexed automatically unless they opt out with `index: false` in their own README. A child folder may override by declaring its own `schemas`.

## Schema Annotation for Index Relevance

The content schema explicitly marks which fields belong in the index using a standardized metadata contract.

Each index-relevant field carries:

| Property | Purpose |
| --- | --- |
| `include` | Whether the field appears in the index |
| `key` | Output key in the index entry |
| `label` | Human-readable label for table or list rendering |
| `kind` | Field kind for rendering and validation |
| `order` | Stable column or display order |

Supported `kind` values: `text`, `date`, `datetime`, `url`, `tags`, `number`, `boolean`, `list`, `object`.

### Annotation Example

```ts
const indexField = (schema, spec) => schema.meta({ folderIndex: spec });

export const postSchema = z.object({
  title: indexField(z.string().min(1), {
    include: true,
    key: "title",
    label: "Title",
    kind: "text",
    order: 1,
  }),
  published: indexField(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), {
    include: true,
    key: "published",
    label: "Published",
    kind: "date",
    order: 2,
  }),
  tags: indexField(z.array(z.string()), {
    include: true,
    key: "tags",
    label: "Tags",
    kind: "tags",
    order: 3,
  }),
});
```

The annotation helper should be a single shared function so all schemas annotate fields the same way.

## Canonical Locator

Use `path` as the canonical entry reference in the index.

- Many folders do not have a natural ID.
- The path already disambiguates entries.
- The path is directly useful for agents, scripts, and link resolution.

Do not require a generic `id` or `status` field in the base index model. If a content type needs those, it adds them in its own schema.

## Generation Flow

1. Resolve the folder's schema from the README `schemas` list or `--schema` flag.
2. Load the schema module and extract `folderIndex` annotations from field metadata.
3. Validate every candidate content file in the folder against that schema.
4. Extract the annotated fields from each validated file.
5. Build `INDEX.yaml` with index metadata and one entry per validated file.
6. Run completeness and link-existence checks.

The generator supports two modes:

- **check**: Fails when generated output differs from the committed index files.
- **write**: Updates `INDEX.yaml` in place.

## INDEX.yaml Structure

```yaml
meta:
  schema: <schema-module-path>
  generated_at: <ISO-8601-timestamp>
entries:
  - path: relative/path/to/file.md
    title: "Entry title"
    published: "2026-05-20"
    tags: ["tag-a", "tag-b"]
```

## Validation Model

The index validator checks:

1. Every content file in the indexed folder matches the declared schema.
2. Every content file has a corresponding entry in `INDEX.yaml`.
3. Every `path` in `INDEX.yaml` points to an existing file.
4. No stale entries remain after file deletions or renames.
5. Every index-relevant field declared by the schema is captured in the index projection.

This makes the index a true inventory, not a partial cache.

## Bundled Scripts

This skill provides a generic generation script in `cmd/`. It works with any schema that follows the annotation contract.

| Script | Purpose |
| --- | --- |
| `cmd/generate.mjs` | Generate or check INDEX.yaml for a given folder |

The script is schema-agnostic: it reads YAML frontmatter from content files, projects the declared fields, and produces a deterministic INDEX.yaml. Consumers do not need to write their own generator — they only need to declare which fields to index.

### Usage

```bash
# Check mode (CI/pre-commit) — fails on drift
node cmd/generate.mjs --check --schema ./schema.mjs path/to/folder

# Write mode — updates INDEX.yaml
node cmd/generate.mjs --write --schema ./schema.mjs path/to/folder

# With explicit field selection
node cmd/generate.mjs --write --fields title,published,tags path/to/folder
```

## ESLint Rules

This skill ships ESLint rules that consumers can include in their config to enforce index governance:

| Rule | What it enforces |
| --- | --- |
| `folder-index/completeness` | Every content file must have a corresponding index entry |
| `folder-index/no-stale-entries` | Every `path` in INDEX.yaml must point to an existing file |
| `folder-index/schema-declared` | Indexed folders must have a schema declared in README frontmatter or INDEX.yaml meta |

Consumer setup:

```js
import folderIndex from "@schafe-vorm-fenster/skill-folder-index/eslint";

export default [
  ...folderIndex.configs.recommended,
];
```

## Governance Enforcement

Index integrity is enforced as a hard failure through the bundled ESLint rules and generation scripts:

- Pre-commit hook: `node cmd/generate.mjs --check .` detects content drift locally.
- CI lint: include the ESLint rules for completeness and stale-entry checks across the repo.
- Drift detection: `generate.mjs --check` exits non-zero when the committed INDEX.yaml differs from what the generator would produce.

## Scope Boundary

This skill defines the generic pattern and domain expertise. It does not own:

- Content-type-specific schemas or profiles (those belong to the consuming repository).
- Folder-level README contracts for specific domains (consumer responsibility).
- The actual generated indexes for specific content folders (consumer output).

## Guidelines

- Always resolve the schema from the declared `schemas` list or `--schema` flag rather than guessing from file content.
- Treat `path` as the canonical locator unless the schema explicitly defines a natural ID.
- Keep `INDEX.yaml` deterministic: sort entries by path, use stable key order.
- Regenerate the index whenever content files change; never rely on manual memory.
- Prefer completeness checks over partial caching. An incomplete index defeats its purpose.

## External References

- [Zod metadata API](https://zod.dev/?id=metadata)
