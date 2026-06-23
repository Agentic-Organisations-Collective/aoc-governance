---
name: dependency-update
description: Safely update project dependencies (minor/patch) using pnpm. Enforces a "Safe-by-Default" workflow with deterministic scripts, CVE-aware prioritization, and incremental updates with quality gates.
layer: company
permissions:
  shell: true
  files:
    write: ["package.json", "pnpm-lock.yaml", "Dockerfile.ci", ".github/workflows/**"]
    deny_write: ["AGENTS.md", "packages/agents/**", ".agents/skills/adapter-**/*.md", ".agents/skills/skill-**/*.md", ".agents/skills/playbook-**/*.md", "src/**/*.test.*", "e2e/**"]
  network:
    allow: ["registry.npmjs.org", "api.github.com"]
interfaces:
  - id: pnpm-environment
    description: pnpm workspace and lockfile context.
    required: true
  - id: package-registry
    description: Registry access for dependency resolution.
    required: true
  - id: git-context
    description: Git repository and branch state.
    required: true
---

# Dependency Updater

Safely update project dependencies (minor/patch) using pnpm. Uses deterministic scripts for discovery and updates, leverages the `trivy-cli` adapter for CVE-aware prioritization, and enforces incremental updates with quality gates.

This playbook expects a healthy `pnpm-environment`, reachable `package-registry` access, and a usable `git-context` before any update is attempted.

## Prerequisites

- A working `pnpm-environment` exists with installable workspace dependencies.
- The `package-registry` is reachable for metadata lookups and package downloads.
- The active `git-context` is clean enough to isolate and commit incremental update clusters.

## Available Commands

- **[cmd/discover.mjs](cmd/discover.mjs)** — Discover outdated packages, categorize by semver type, merge CVE data
- **[cmd/update-package.mjs](cmd/update-package.mjs)** — Update one package or group, run the quality gate, and report the result
- **[cmd/sync-tooling.mjs](cmd/sync-tooling.mjs)** — Detect version drift between `package.json` and `Dockerfile.ci`

## Adapter Dependencies

- **trivy-cli** — Used for vulnerability scanning and CVE-aware prioritization. The `discover.mjs` command composes this adapter internally.

## Guidelines

### Strict Constraints

- **No Manual Edits:** Use pnpm CLI for all manifest changes. Never edit pnpm-lock.yaml manually.
- **Lockfile Hygiene:** Always commit pnpm-lock.yaml alongside version bumps. Run `pnpm install --frozen-lockfile` to verify lockfile integrity before committing.
- **Compatible Only:** Never run `pnpm update --latest` globally. Use `pnpm update <package>` (respects semver ranges in package.json) to avoid unauthorized Major jumps.
- **Atomicity:** Commit after each successful update cluster or individual package.
- **Post-Update Audit:** Re-run discovery after all updates to confirm no new vulnerabilities were introduced.
- **No Test Modifications:** Never modify test assertions, test expectations, or e2e specs.
- **No Skill Modifications:** Never modify files in `packages/agents/`, `packages/adapters/`, `packages/skills/`, `packages/playbooks/`, or `AGENTS.md`.

### Priority Order

1. Packages with CRITICAL/HIGH CVE fixes (`vulnerabilities` from discover output)
2. Patch updates (lowest risk)
3. Minor updates (medium risk)
4. Tooling drift fixes

## Workflow

### 1. Discovery & Analysis

Run the discovery script to get a structured overview:

```bash
node cmd/discover.mjs
```

Output categories:

- `patches` — Safe to apply immediately
- `minors` — Apply with quality gate
- `majors` — Do NOT update; create GitHub issues
- `vulnerabilities` — CVE-affected packages (prioritize these)

This discovery step relies on a healthy `pnpm-environment` and active `package-registry` access before any package decisions are made, and the resulting changes must still fit the current `git-context`.

Review the `prioritized` list: packages with known CVE fixes are ranked first.

### 2. Security Baseline

Before applying updates, capture the current vulnerability state by running discovery with CVE data. The `discover.mjs` command already integrates vulnerability scanning via the `trivy-cli` adapter:

```bash
node cmd/discover.mjs
```

Retain the `vulnerabilities` field from the output as the pre-update baseline.

### 3. Tooling Drift Check

Verify infrastructure alignment before making changes:

```bash
node cmd/sync-tooling.mjs
```

If drifts exist, fix them as the first commit before dependency updates.

### 4. Incremental Update & Quality Gate

For each package (ordered by priority from discover output):

```bash
node cmd/update-package.mjs --package <name>
```

For tightly coupled groups:

```bash
node cmd/update-package.mjs --group "react,react-dom,@types/react"
```

The script handles:

- Applying the update via `pnpm update <package>`
- Running the quality gate (`pnpm check` by default, override with `--check-cmd`)
- Reverting on failure
- Returning structured pass/fail JSON

**Agent responsibility after script returns:**

- If `checkPassed: true` and `healingApplied: false` → commit immediately
- If `checkPassed: true` and `healingApplied: true` → review healing, then commit
- If `checkPassed: false` → script already reverted; create/update GitHub issue

### 5. Healing

When `update-package.sh` reports `checkPassed: false`, the agent may attempt manual healing:

1. Re-apply the update inside the same `pnpm-environment`: `pnpm update <package>`
2. Read the error output from the script's `errors` field
3. Apply 1-2 targeted fixes (lint errors, type adjustments, import changes)
4. Run `pnpm check` manually
5. If passing → commit with `fix(deps):` prefix
6. If still failing → `git checkout -- .` and move to Issue Management

**Healing constraints:**

- NEVER modify test assertions or test expectations
- NEVER change functional business logic
- ONLY fix: import paths, type annotations, lint rule compliance, API signature changes

### 6. Post-Update Verification

After all updates are committed, re-run discovery to get the updated vulnerability state:

```bash
node cmd/discover.mjs
```

Compare the `vulnerabilities` list against the baseline captured in step 2. If new CRITICAL or HIGH CVEs appear, revert the offending update.

### 7. Finalization & Tracking

- **Version Bump:** `pnpm version patch`
- **Issue Management:**
  - **Major Updates:** Search for existing issues. If missing, create: `chore(deps): Upgrade [package] to vX (Major Candidate)`
  - **Failed Updates:** Create/update issue with error details from the script output
  - **CVE Tracking:** If a CVE has no `fixedVersion`, create: `security(deps): [package] — [CVE-ID] (no fix available)`
- **Auto-Merge Labeling:** Commit messages with `chore(deps):`, `fix(deps):`, or `chore(release):` prefixes are automatically labeled with `auto-merge` and will merge once all checks pass (via `.github/workflows/auto-merge-label.yml` + `.github/workflows/auto-merge.yml`)

## Commit Convention

| Scenario | Prefix | Example |
| --- | --- | --- |
| Simple version bump | `chore(deps):` | `chore(deps): update eslint to v9.2.0` |
| Update + healing needed | `fix(deps):` | `fix(deps): update eslint to v9.2.0 and fix lint regressions` |
| Tooling sync | `chore(infra):` | `chore(infra): sync node version to 24.x in Dockerfile.ci` |
| Version bump | `chore(release):` | `chore(release): 3.4.3` |

## Examples

### Example: CVE-Prioritized Update

```
1. node cmd/discover.mjs → shows <package>@<version> has CVE-YYYY-XXXXX (HIGH), fixedVersion: <fixed>
2. node cmd/update-package.mjs --package <package> → checkPassed: true
3. Commit: fix(deps): update <package> to v<fixed> (resolves CVE-YYYY-XXXXX)
```

### Example: Successful Healed Update

```
1. node cmd/update-package.mjs --package eslint → checkPassed: false, errors: "2 lint errors"
2. Agent re-applies update, fixes 2 lint errors
3. pnpm check passes
4. Commit: fix(deps): update eslint to v9.2.0 and fix lint regressions
```

### Example: Major Version Handling

```
1. node cmd/discover.mjs → shows next@14.2.0 → latest 15.1.0 (major)
2. Agent searches GitHub issues. No existing issue found.
3. Agent creates issue: chore(deps): Upgrade Next.js to v15 (Major Candidate)
```
