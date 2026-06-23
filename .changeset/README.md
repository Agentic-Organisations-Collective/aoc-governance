# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

Every change to a governed document in `packages/*` must be accompanied by a
changeset. A changeset is a small markdown file that declares which package
changed and how its version should bump (`major`, `minor`, or `patch`).

Create one with:

```bash
pnpm changeset
```

See [VERSIONING.md](../VERSIONING.md) for the full release process.
