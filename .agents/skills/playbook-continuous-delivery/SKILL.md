---
name: continuous-delivery
description: Govern the pull request lifecycle from creation through validation, approval, merge, versioning, and package release.
layer: company
tags:
  - delivery
  - ci-cd
  - governance
interfaces:
  - id: git-repository
    description: Git repository with release branches and history.
    required: true
  - id: ci-environment
    description: GitHub Actions or equivalent CI/CD environment.
    required: true
  - id: changeset-tool
    description: Changeset tooling available in the workspace.
    required: true
  - id: npm-registry
    description: Access to the GitHub npm registry for the package scope.
    required: true
---

# Continuous Delivery

Govern the pull request lifecycle from creation through validation, approval, merge, versioning, and package release. Use this playbook when a branch is ready for integration into `main` and needs to pass through the full quality gate sequence before packages are published.

[@orchestrator](../role-orchestrator/SKILL.md) owns the sequence. Validation is automated. Approval is a human gate (required for the first merge, optional for version-packages PRs once trust is established).

All phase transitions assume the active `git-repository`, available `ci-environment`, working `changeset-tool`, and reachable `npm-registry` remain stable throughout the run.

## Prerequisites

- A `git-repository` branch exists with committed changes targeting `main`.
- The branch passes local `pnpm check` before PR creation.
- If package content changed, a `changeset-tool` output file exists (created via `pnpm changeset`).
- The `ci-environment` and target `npm-registry` are reachable for validation and release.

## Guidelines

- Keep pull request scope narrow enough to make review and rollback straightforward.
- Treat CI failures as hard blockers and do not bypass checks for speed.
- Keep changeset intent explicit so version bumps remain predictable.
- Prefer automated release flow over manual publish steps to preserve auditability.
- Keep branch protection and approval policy consistent across feature and release PRs.

## Workflow

### Phase 1 — Pull Request Creation

Create a pull request targeting `main`.

1. Use a conventional commit title: `feat(scope): description`, `fix(scope): description`, or `chore(scope): description`.
2. Reference the originating issue if one exists (e.g. `Closes #42`).
3. Include a changeset file if any files under `packages/` or `governance/eslint-plugin/` changed.

Quality gate: the PR exists with a descriptive title and linked issue.

### Phase 2 — Automated Validation

CI runs automatically on PR creation and on every push.

The `validate` job executes `pnpm check`, which runs:

1. Structure validation — required files and paths exist.
2. Topology validation — `topology.yaml` schema compliance.
3. Version validation — all packages have valid semver versions.
4. Link linting — cross-references in markdown resolve.
5. Artifact linting — frontmatter schema compliance for all asset types.
6. Markdown linting — formatting standards.
7. Shell linting — `shfmt` and `shellcheck` on artifact commands.
8. Workflow linting — `actionlint` on GitHub Actions files.
9. Artifact tests — governance test suite.

The `changeset-check` job verifies that the `changeset-tool` output file is present when package content changed.

Quality gate: both CI jobs pass (green checks).

### Phase 3 — Review and Approval

1. At least one reviewer approves the PR.
2. The reviewer checks for:
   - Scope alignment with the linked issue or stated intent.
   - Naming follows consumer perspective conventions.
   - No unintended side effects on existing packages.
   - Changeset bump level matches the change severity (patch / minor / major).

Quality gate: at least one approval with no unresolved blocking comments.

### Phase 4 — Merge

Once Phase 2 and Phase 3 pass:

1. The PR is squash-merged into `main`.
2. Auto-merge is enabled for PRs with the `auto-merge` label after approval.
3. Version Packages PRs (from changesets) auto-merge after CI passes.

The squash commit message follows the PR title convention.

Quality gate: clean squash merge into `main`.

### Phase 5 — Versioning

On merge to `main`, the release workflow runs:

1. `pnpm check` validates the merged state.
2. Changesets action evaluates pending changeset files:
   - **If changesets exist**: creates or updates a "Version Packages" PR that bumps versions in `package.json` files and generates `CHANGELOG.md` entries.
   - **If the Version Packages PR is merged**: proceeds to publish.

Quality gate: version bumps are correct and changelogs are generated.

### Phase 6 — Publish

When the Version Packages PR merges:

1. Changesets action runs `pnpm changeset publish`.
2. Packages are published to the configured `npm-registry` (`npm.pkg.github.com`).
3. Git tags are created for each published version.

Quality gate: packages are available in the `@schafe-vorm-fenster` scope on GitHub Packages.

## Handoff Rules

- Do not merge a PR until both CI jobs are green.
- Do not merge without at least one approval (enforced by branch protection).
- Do not manually bump versions — let changesets handle versioning.
- If CI fails after merge to main, the release workflow blocks publishing until the issue is resolved.
- Version Packages PRs should merge promptly to avoid changeset accumulation.

## GitHub Configuration Requirements

For full automation, the repository needs:

1. **Branch protection on `main`**: require status checks (`validate`, `changeset-check`), require approvals (≥1), require squash merging.
2. **Auto-merge enabled** in repository settings.
3. **`GITHUB_TOKEN` permissions**: contents write, pull-requests write (configured in workflows).
