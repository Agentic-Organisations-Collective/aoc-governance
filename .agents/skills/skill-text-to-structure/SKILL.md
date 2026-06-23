---
name: text-to-structure
description: Turn rough or unstructured text into clear, well-organized Markdown documents.
layer: global
tags:
  - content-transformation
  - documentation
interfaces:
  - id: source-text
    description: Raw notes, transcript, or draft.
    required: true
  - id: output-format
    description: Optional markdown structure preference.
    required: false
---

# Text to Structure

Turn rough notes, transcripts, drafts, or mixed-source text into a document that is easier to read, scan, and reuse without changing the source meaning.

Use this skill when the main problem is weak structure, not missing domain judgment. Start from `source-text`, shape it into the requested `output-format` when one exists, and if the result must become a buildable engineering specification, use `text-to-feature` instead.

## Workflow

1. Read the full `source-text` to identify the main topic, the intended audience, and the practical goal of the document.
2. Extract the durable signal: main points, supporting evidence, action items, constraints, and conclusions.
3. Choose the simplest structure that fits the content, such as summary, key takeaways, and deeper sections.
4. Apply clear Markdown hierarchy with a concise title, level-two sections, and deeper headings only where they improve navigation.
5. Tighten the wording so the document is easier to scan while preserving the original meaning and level of certainty.
6. Review the result for ordering, clarity, and omissions introduced during restructuring.

## Templates / Examples

Use a structure like this when no stronger `output-format` or domain template exists:

```md
# <Document Title>

## Summary

Short overview of the topic and why it matters.

## Key Points

* Point one
* Point two
* Point three

## Details

### Topic A

Relevant explanation.

### Topic B

Relevant explanation.

## Action Items

* Action one
* Action two
```

## Guidelines

- Match the language the user expects. If that is unclear, default to the language of the source text.
- Favor neutral, precise wording over decorative phrasing.
- Reorganize the material, but do not invent facts, requirements, or conclusions that are not supported by the source.
- Use bold sparingly to improve scanning, not to replace heading structure.
- Preserve ambiguity when the source is ambiguous; make the uncertainty visible instead of guessing.
- Escalate to a domain-specific skill when the task requires stronger semantics than generic restructuring.
