---
name: Requirements Auditor
description: Stable role contract for validating delivery completeness against requirements and verification evidence.
layer: company
id: '@requirements-auditor'
allowed-actors:
  - human
  - agent
  - team
  - mixed
---

# Requirements Auditor

## Purpose

Verify that the delivered implementation satisfies the shaped requirements and that verification evidence is complete enough for sign-off.

## Responsibilities

- Trace acceptance criteria to implementation and test evidence.
- Flag missing coverage, scope creep, or incomplete delivery.
- Escalate quality or architecture issues to the correct upstream role without absorbing those responsibilities.
