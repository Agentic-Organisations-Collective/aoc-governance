---
name: text-to-feature
description: Transform rough product or stakeholder input into buildable feature specifications for engineering teams.
layer: global
tags:
  - product-management
  - requirements
interfaces:
  - id: source-text
    description: Product request or stakeholder input.
    required: true
  - id: business-context
    description: Strategic or technical constraints.
    required: false
  - id: output-template
    description: Optional feature specification template preference.
    required: false
---

# Text to Feature

Transform rough notes, requests, or stakeholder input into a structured feature specification that engineering teams can implement with fewer follow-up questions.

This skill builds on [../text-to-structure/text-to-structure.skill.md](../text-to-structure/text-to-structure.skill.md): first impose clarity and order, then apply a requirements lens that separates user need, scope, constraints, and open questions.

Treat `source-text` as the raw requirement signal, weave in `business-context` where it affects scope or constraints, and shape the result toward any requested `output-template` without inventing unsupported requirements.

## Workflow

1. Read the full `source-text` and identify the core problem, target user, expected outcome, and relevant `business-context`.
2. Use the text-to-structure baseline to group the input into coherent themes before deriving requirements.
3. Extract feature-specific semantics: user stories, scope boundaries, constraints, data needs, external dependencies, and edge cases.
4. Separate what must be true from how it might be implemented. Keep architecture, tooling, and code choices out of the specification unless they are fixed constraints.
5. Convert implied expectations into explicit acceptance criteria where the source supports them.
6. Surface unresolved assumptions as open questions instead of silently filling the gaps.

## Templates / Examples

Use a structure like this for the output, adapting it to `output-template` when one is provided:

```md
# Feature: <Feature Name>

## User Story

As a <persona>, I want <capability> so that <benefit>.

## Scope

* In scope: <included behavior>
* Out of scope: <excluded behavior>

## Requirements

### User Interactions

* Requirement one
* Requirement two

### Data and Integrations

* Data requirement
* Integration requirement

## Acceptance Criteria

* Criterion one
* Criterion two

## Edge Cases and Constraints

* Edge case
* Constraint

## Open Questions

* Question one
* Question two
```

## Guidelines

- Write for engineering teams that need a clear source of truth for the feature.
- Prefer short, explicit statements over narrative explanation.
- Call out user interactions, user-generated content, third-party APIs, and database implications when the source mentions them or strongly implies them.
- Do not drift into solution design, implementation patterns, or code examples.
- Preserve traceability to the source input by keeping derived requirements grounded in stated needs.
- If the input is too ambiguous for a reliable feature spec, return a structured draft plus open questions instead of pretending the requirements are complete.
