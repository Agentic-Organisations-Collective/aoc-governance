---
name: rebase-on-main
description: Update main/master from origin, rebase the current branch on it, resolve conflicts, and push.
layer: company
interfaces:
  - id: git-repository
    description: Git repository with a main branch and working tree.
    required: true
  - id: branch-context
    description: The feature branch currently checked out.
    required: true
  - id: origin-remote
    description: Configured origin remote that can be fetched.
    required: true
---

# Rebase on Main

Update the active `git-repository` main/master branch from origin, rebase the current branch on it, resolve conflicts, and push.

## Prerequisites

- An accessible `git-repository` exists with `main` or `master` available.
- The active `branch-context` is checked out and ready for rebase.
- The configured `origin-remote` can be fetched and pushed with the required permissions.

## Guidelines

- Always use `--force-with-lease` instead of `--force` for safety.
- When resolving conflicts, prefer preserving functional intent from both sides when possible.
- If a conflict resolution is ambiguous, document the decision rationale in the final summary.
- Keep the working tree clean before starting to reduce rebase failure modes.

## Workflow

- **Identify the `git-repository`:** Check if main or master exists as the default branch.
- **Save current `branch-context`:** Store the current branch name for later.
- **Fetch latest from `origin-remote`:** Run git fetch origin.
- **Update main/master locally:** Checkout main/master and pull latest changes.
- **Return to feature branch:** Checkout the original `branch-context`.
- **Rebase on main/master:** Run git rebase main (or master).
- **Handle conflicts if any:**
  - If conflicts occur, analyze each conflicting file.
  - Read the conflicting files to understand the context.
  - Resolve conflicts intelligently by understanding both changes.
  - Use git add to mark resolved files.
  - Continue rebase with git rebase --continue.
  - Repeat until all conflicts are resolved.
- **Push changes:** Force push the rebased `branch-context` with lease using git push --force-with-lease to the configured `origin-remote`.
