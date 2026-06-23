---
name: markdown-formatting
description: Domain heuristics for normalizing, linting, and improving markdown document quality. Covers heading structure, list formatting, blank line management, frontmatter conventions, and table normalization.
layer: global
interfaces:
  - id: source-markdown
    description: Markdown content to normalize or review.
    required: true
  - id: normalization-target
    description: Target formatting policy, style guide, or consumer preference.
    required: false
---

# Markdown Formatting

## Purpose

This skill defines what well-formatted markdown looks like and when to apply normalization rules. It provides decision heuristics for agents that produce, transform, or review markdown content — whether generated from Google Docs, transcribed from audio, or authored manually. Apply the rules to incoming `source-markdown`, and adapt them to any provided `normalization-target` when a consumer-specific style guide is in play.

Use this skill when:

- Converting external documents into clean `source-markdown` (Google Docs, PDFs, HTML)
- Reviewing or cleaning existing `source-markdown` files
- Post-processing AI-generated markdown output
- Preparing markdown content for publishing pipelines under a specific `normalization-target`

## Formatting Rules

### Blank Line Management

- **Maximum consecutive blank lines**: 2
- After a heading: exactly 1 blank line
- Before a heading: exactly 1 blank line (except when the heading is the first element)
- Between paragraphs: exactly 1 blank line
- Between a paragraph and a list: exactly 1 blank line
- Within a list: no blank lines between list items of the same level

### Heading Normalization

- Headings must use ATX style (`#` prefix), never Setext style (underlines)
- Exactly one space between `#` characters and heading text
- No trailing `#` characters
- Heading hierarchy must not skip levels (no `##` followed directly by `####`)
- Document should start with a single `# H1` (title)
- Never use bold (`**text**`) as a substitute for headings

### List Formatting

- Use `-` for unordered lists (not `*` or `+`)
- Use `1.` for ordered lists (sequential numbering is optional but preferred)
- Indent nested lists with 2 spaces
- No blank lines between items in the same list block
- A blank line before and after the entire list block

### Inline Formatting

- Bold: `**text**` (not `__text__`)
- Italic: `*text*` (not `_text_`)
- Code: backticks for inline code, triple backticks with language identifier for code blocks
- Links: `[text](url)` — never bare URLs in body text
- Strikethrough: `~~text~~`

### Table Formatting

- Header row required with separator row (`| --- |`)
- Pipe characters in cell content must be escaped (`\|`)
- Single-cell tables should be unwrapped into regular content (they are layout boxes, not data tables)
- Align separator pipes for readability when practical

### Frontmatter

- YAML frontmatter enclosed in `---` fences
- Keys in lowercase kebab-case
- String values quoted when they contain special characters
- Date values in ISO 8601 format (`2026-05-19`)
- Arrays in flow style for short lists (`[tag1, tag2]`), block style for longer ones

### Line Endings and Whitespace

- Normalize to LF (`\n`), never CRLF
- No trailing whitespace on lines
- File ends with a single newline character
- No leading blank lines before the first content

### Line Length

- Prose lines should not exceed 250 characters
- Lines exceeding this threshold should be wrapped at word boundaries
- Code blocks, tables, headings, list items, and URLs are exempt from line-length enforcement

## Special Characters

Remove or replace problematic characters during normalization:

- Null bytes and control characters (`\u0000`–`\u001F` except `\n` and `\t`)
- Unicode Private Use Area characters (`\uE000`–`\uF8FF`)
- Zero-width spaces and joiners unless semantically meaningful
- Non-breaking spaces → regular spaces

## Decision Heuristics

### When to normalize aggressively

- Content from external sources (Google Docs, Notion exports, copy-paste)
- Machine-generated content (AI output, transcriptions)
- Content entering a publishing pipeline

### When to normalize conservatively

- Hand-authored documentation with intentional formatting choices
- Code examples where whitespace is semantically significant
- Content with embedded HTML that should be preserved

### When to skip normalization

- Binary files or non-markdown content
- Files explicitly marked with `<!-- no-lint -->` comment
- Vendor-generated files that will be overwritten on next sync

## Integration with Adapters

This skill provides the **rules**. Executable formatting is handled by:

- `adapter-markdown-cli` (recommended companion) — provides `cmd/lint.mjs` for automated enforcement
- `adapter-google-cli-docs` — applies these rules during Google Doc → Markdown conversion

When an agent uses this skill, it should apply these heuristics during content generation or review. When automated enforcement is needed (CI, batch processing), use the companion adapter script.

## References

- Source implementation: `dev-tools/src/lib/transforms/markdown-linter.ts`
- CommonMark specification for baseline markdown syntax
- markdownlint rule set (MD001–MD053) as extended reference
