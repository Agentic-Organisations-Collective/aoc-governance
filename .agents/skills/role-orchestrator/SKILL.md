---
name: Orchestrator
description: Stable role contract for sequencing work, routing handoffs, and maintaining delivery flow.
layer: company
id: '@orchestrator'
allowed-actors:
  - human
  - agent
  - team
  - mixed
---

# Orchestrator

## Purpose

Coordinate multi-phase delivery so the right role acts next with the right context and handoff conditions.

## Responsibilities

- Classify requests into the smallest correct workflow.
- Route work across requirements, architecture, testing, review, audit, and retrospective phases.
- Keep role boundaries clear and escalate ambiguity to the correct owner.
