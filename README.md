# aoc-governance

Public legal and constitutional documents of the Agentic Organisations
Collective, kept in a strictly versioned, public-read repository.

It is the canonical source for the collective's formal, legally relevant texts
and their release history.

## Packages

- `statutes` — canonical editable text of the collective's statutes
- `bylaws` — subordinate rule sets that operationalize the statutes
- `resolutions` — official adopted decisions, stored append-only
- `public-minutes` — minutes intended for public visibility
- `releases` — frozen, tagged publication snapshots

## Governance

Public read, maintainer write. Every change to a legally relevant document runs
through review and produces an immutable, tagged release.

## Languages

The governed German documents are the only **legally binding** texts. Each one
carries a **non-binding** English translation alongside it (e.g.
`statutes.en.md`) for members and interested persons. Translations are kept in
sync with the originals and frozen per version; the German text always prevails.
See [VERSIONING.md](./VERSIONING.md#translations).

## Tasks

**To-dos are GitHub issues in this repository** — not markdown checklists, not an
external to-do app. Board resolution of 2026-08-26.

Belongs here: statutes, bylaws, resolutions and public minutes — the wording of the
governed texts and their releases. Administration and the founding procedure go to
`aoc-board`; outward-facing communication about a change goes to `aoc-communications`.

An issue names the occasion, the concrete task and its preconditions. Assign whoever
took the task on; where that is unclear, prefer no assignee over the wrong one. Tasks
from a meeting carry a `sitzung:<YYYY-MM-DD>` label and cite the minutes in a footer.
