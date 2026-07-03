# Contributing to `aoc-governance`

This repository holds the association's **governed** legal and constitutional
documents. Every change is versioned, translated, reviewed, and released. This guide
is the practical workflow; [`VERSIONING.md`](./VERSIONING.md) has the full versioning
and release mechanics.

## TL;DR workflow

1. **Branch off `main`.** `main` is review-only — don't commit to it directly; work on
   a feature branch and open a pull request.
2. **Edit** the German canonical document under `packages/<pkg>/…`.
3. **Update its English translation** (`*.en.md`) in the *same* change.
4. **Add a changeset:** `pnpm changeset` (choose the package, a bump level, and write a
   summary).
5. **Commit** the document, the translation, **and** the changeset together.
6. **Push** the branch and **open a PR.** The `Governance Check` CI enforces the same
   rules as the local hooks.

## Pre-commit hooks — why a commit may be rejected

`.husky/pre-commit` runs two checks on every commit. Both must pass:

- **`check:changeset`** — a change to a governed document (anything under
  `packages/*`) **without a changeset** is rejected.
  _Fix:_ `pnpm changeset` (or hand-author a `.changeset/*.md`), stage it, commit again.
- **`check:translations`** — a change to a canonical (German) document **without
  updating its `*.en.md` translation** is rejected.
  _Fix:_ update the translation in the same commit.

Run them manually any time: `pnpm check:changeset` and `pnpm check:translations`.

> Note: these hooks only fire for **governed documents** under `packages/*`.
> Repository-meta files (this file, `README.md`, CI config) don't need a changeset.

## Changesets

A changeset is a markdown file in `.changeset/` that names the affected package and
the semver bump level:

```markdown
---
"@aoc-governance/bylaws": minor
---

Short summary of the change (this becomes the changelog entry).
```

**Packages** (each versioned independently): `@aoc-governance/statutes`, `…/bylaws`,
`…/resolutions`, `…/public-minutes`, `…/releases`.

**Bump levels** (guideline):

- `patch` — typo, formatting, or non-substantive clarification.
- `minor` — additive change that does not alter existing binding rules (e.g. a new
  bylaw or a new section).
- `major` — substantive change to a binding rule.

## Languages & translations

- The **German** document is the only **legally binding** text. The English `*.en.md`
  is a **non-binding** courtesy translation and must be kept in sync; on any
  discrepancy, the German text prevails.
- Every translation starts with a header comment and a non-binding notice, e.g.:

  ```markdown
  <!-- translation-of: assembly-convocation.md | language: en | binding: false -->
  ```

## Branches, PRs & releases

- `main` is review-only; every change lands via a reviewed PR.
- **Releases are automated** and git-tagged `<pkg>-v<version>`. Do **not** hand-edit
  `package.json` versions, changelogs, `history.json`, or `archive/` — the release
  process generates those from the changesets (see [`VERSIONING.md`](./VERSIONING.md)).

## Drafts

A document may be added with **`Status: draft`** (e.g. a rule pending adoption by the
competent body). Mark the status clearly and leave the entry-into-force clause with a
placeholder date until it is formally adopted.

## See also

- [`VERSIONING.md`](./VERSIONING.md) — full versioning and release process.
- [`README.md`](./README.md) — repository purpose and package overview.
