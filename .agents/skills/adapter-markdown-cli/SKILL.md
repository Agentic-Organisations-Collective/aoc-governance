---
name: markdown-cli
description: CLI wrapper around markdownlint-cli2 for automated markdown linting and fixing. Companion adapter to the markdown-formatting skill.
layer: global
interfaces:
  - id: file-paths
    description: Markdown files to lint or fix.
    required: true
    type: array
    examples: ['docs/**/*.md', README.md]
  - id: config-file
    description: Optional markdownlint-cli2 config path.
    required: false
    type: string
    examples: [.markdownlint.jsonc, config/markdownlint.jsonc]
  - id: fix-mode
    description: Optional boolean flag to enable fix mode.
    required: false
    type: boolean
    examples: [true, false]
---

# Markdown CLI Adapter

## Purpose

This adapter provides an executable CLI for markdown lint enforcement powered by [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2). While the `markdown-formatting` skill defines the heuristics (what good markdown looks like), this
adapter provides the **tool** that applies those rules programmatically.

Use this adapter when:

- Batch-processing markdown `file-paths` (CI pipelines, pre-commit hooks)
- Post-processing Google Doc exports
- Normalizing AI-generated markdown before committing
- Enforcing consistent formatting across a repository

Use `config-file` when the default markdownlint rules are not enough, and flip `fix-mode` on when the adapter should rewrite files instead of only reporting violations.

## Available Commands

### `cmd/lint.mjs`

Lint the selected `file-paths` using markdownlint-cli2 rules.

```bash
# Lint a single file
node cmd/lint.mjs path/to/file.md

# Fix violations in place
node cmd/lint.mjs --fix path/to/file.md

# Lint all markdown files in a directory
node cmd/lint.mjs --fix "docs/**/*.md"

# Wrap long prose lines (>250 chars) before linting
node cmd/lint.mjs --wrap --fix "docs/**/*.md"

# Wrap with custom threshold (e.g. 150 chars)
node cmd/lint.mjs --wrap 150 --fix "docs/**/*.md"

# Use a custom config file
node cmd/lint.mjs --config .markdownlint.jsonc "**/*.md"
```

### Options

| Flag | Default | Description |
| --- | --- | --- |
| `--fix` | false | Enable `fix-mode` to fix violations in place |
| `--wrap [threshold]` | off (250) | Wrap prose lines exceeding threshold chars before linting |
| `--config <path>` | — | Path to the markdownlint `config-file` |
| `--check` | true | Exit with code 1 if violations found (default behavior) |
| `--help` | — | Show usage information |

### Wrap Behavior

The `--wrap` option performs markdown-aware line wrapping **before** linting. It only wraps plain prose paragraphs and preserves:

- Code blocks (fenced and indented)
- Tables
- Headings
- Blockquotes
- List items
- Frontmatter
- Lines dominated by long URLs
- Markdown links `[text](url)` and inline code as atomic units

### Exit Codes

| Code | Meaning |
| --- | --- |
| 0 | No violations found (or all fixed with `--fix`) |
| 1 | Violations found |
| 2 | Script error (file not found, invalid arguments) |

## Configuration

Rules are configured via standard markdownlint config files (`.markdownlint.jsonc`, `.markdownlint.yaml`, `.markdownlint-cli2.jsonc`). See [markdownlint-cli2 docs](https://github.com/DavidAnson/markdownlint-cli2#configuration) for details.

### Default Configuration

This adapter ships with a `.markdownlint-cli2.jsonc` that maps the heuristics from `@schafe-vorm-fenster/skill-markdown-formatting` to concrete markdownlint rules. Consumer repositories can use this config directly:

```bash
# Use the bundled config (resolves from the adapter package)
node cmd/lint.mjs --config node_modules/@schafe-vorm-fenster/adapter-markdown-cli/.markdownlint-cli2.jsonc "**/*.md"
```

Or copy/extend it in their own repository root:

```bash
cp node_modules/@schafe-vorm-fenster/adapter-markdown-cli/.markdownlint-cli2.jsonc .markdownlint-cli2.jsonc
```

### Skill-Adapter Relationship

| Layer | Package | Responsibility |
| --- | --- | --- |
| Heuristics (what) | `@schafe-vorm-fenster/skill-markdown-formatting` | Defines formatting rules in human-readable prose |
| Config (mapping) | `.markdownlint-cli2.jsonc` in this adapter | Translates heuristics to markdownlint rule IDs |
| Tool (how) | `@schafe-vorm-fenster/adapter-markdown-cli` | Executes linting via markdownlint-cli2 |

Consumer repos need all three layers to work together:

1. The **skill** tells agents what well-formatted markdown looks like
2. The **config** maps those rules to machine-enforceable checks
3. The **adapter** runs the checks and optionally auto-fixes

## Integration Pattern

### In a publishing pipeline

```bash
# After Google Doc download, lint before committing
node cmd/lint.mjs --fix "publishing/pipeline/**/*.md"
```

### As a pre-commit check

```bash
# CI: fail if any markdown file has violations
node cmd/lint.mjs "**/*.md"
```

### Combined with Google Docs adapter

The `google-cli-docs` adapter produces markdown from Google Docs. Pipe through this adapter for final linting:

```bash
# Download and lint in sequence
google-cli-docs download <doc-id> --format md --output draft.md
node cmd/lint.mjs --fix draft.md
```

## Dependencies

- [`markdownlint-cli2`](https://github.com/DavidAnson/markdownlint-cli2) — the underlying lint engine

## Skill Reference

This adapter implements the executable counterpart of:

- **Skill**: `@schafe-vorm-fenster/skill-markdown-formatting`

The skill provides the heuristics (what and why). This adapter provides the tool (how).

## External References

- [markdownlint-cli2 — GitHub](https://github.com/DavidAnson/markdownlint-cli2)
- [markdownlint rules reference](https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md)
