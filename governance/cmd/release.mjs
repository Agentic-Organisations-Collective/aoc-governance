#!/usr/bin/env node

/**
 * release.mjs — strict-versioning release orchestrator for aoc-governance.
 *
 * For every package whose version is bumped by pending changesets, this script:
 *   1. runs `changeset version` (bumps package.json + writes CHANGELOG.md),
 *   2. archives the PREVIOUS released version's full content into
 *      packages/<pkg>/archive/v<old>/ with a cross-referencing manifest.json,
 *   3. appends an entry to the append-only packages/<pkg>/history.json ledger,
 *   4. commits the result and creates a git tag `<pkg>-v<version>`.
 *
 * Cross-references captured per version:
 *   - createdCommit:       the commit that established the version (content commit)
 *   - supersededByCommit:  the commit that made the version outdated
 *   - changesets:          the changeset ids that produced the version
 *
 * The release commit and tags are NOT pushed; CI (or the operator) pushes with
 *   git push --follow-tags origin main
 *
 * Usage:
 *   node governance/cmd/release.mjs
 *   node governance/cmd/release.mjs --help
 */

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { join, dirname } from 'node:path';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(
    'Usage: node governance/cmd/release.mjs\n\n' +
      'Versions packages with pending changesets, archives superseded\n' +
      'versions, updates history ledgers, commits, and tags.\n'
  );
  process.exit(0);
}

const unknown = process.argv.slice(2).filter((a) => a !== '--help' && a !== '-h');
if (unknown.length > 0) {
  console.error(`Unknown option: ${unknown[0]}`);
  console.error('Usage: node governance/cmd/release.mjs');
  process.exit(2);
}

const root = process.cwd();
const PKG_ROOT = 'packages';
const ARCHIVE_EXCLUDE_PREFIX = 'archive/';
const ARCHIVE_EXCLUDE_FILES = new Set(['history.json']);

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: root, ...opts });
}
function gitOut(args) {
  return git(args, { encoding: 'utf8' }).trim();
}
function fail(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

// 1. Require a clean working tree so the content commit is well defined.
if (gitOut(['status', '--porcelain'])) {
  fail(
    'Working tree is not clean.\n' +
      'Commit your document change and its changeset before releasing.',
    2
  );
}
const contentCommit = gitOut(['rev-parse', 'HEAD']);
const today = new Date().toISOString().slice(0, 10);

// 2. Discover packages and their current versions.
const pkgDirs = readdirSync(join(root, PKG_ROOT)).filter((d) =>
  existsSync(join(root, PKG_ROOT, d, 'package.json'))
);
const nameToDir = {};
const dirVersion = {};
for (const d of pkgDirs) {
  const pj = JSON.parse(
    readFileSync(join(root, PKG_ROOT, d, 'package.json'), 'utf8')
  );
  nameToDir[pj.name] = d;
  dirVersion[d] = pj.version;
}

// 3. Parse pending changesets -> map dir -> { ids, summaries }.
function parseChangesets() {
  const dir = join(root, '.changeset');
  if (!existsSync(dir)) return {};
  const files = readdirSync(dir).filter(
    (f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md'
  );
  const map = {};
  for (const f of files) {
    const raw = readFileSync(join(dir, f), 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) continue;
    const id = f.replace(/\.md$/, '');
    const summary = m[2].trim();
    for (const line of m[1].split('\n')) {
      const lm = line.match(
        /^\s*["']?(@?[^"':]+)["']?\s*:\s*(major|minor|patch)\s*$/
      );
      if (!lm) continue;
      const d = nameToDir[lm[1].trim()];
      if (!d) continue;
      (map[d] ||= { ids: new Set(), summaries: [] }).ids.add(id);
      if (summary) map[d].summaries.push(summary);
    }
  }
  return map;
}
const pending = parseChangesets();
if (Object.keys(pending).length === 0) {
  console.log('No pending changesets for any package. Nothing to release.');
  process.exit(0);
}

// 4. Run `changeset version` (prefer local bin, fall back to npx).
const localBin = join(root, 'node_modules', '.bin', 'changeset');
function changeset(args) {
  if (existsSync(localBin)) {
    return execFileSync(localBin, args, { cwd: root, stdio: 'inherit' });
  }
  return execFileSync('npx', ['--yes', '@changesets/cli@^2', ...args], {
    cwd: root,
    stdio: 'inherit',
  });
}
changeset(['version']);

// 5. Detect packages whose version actually changed.
const changed = [];
for (const d of pkgDirs) {
  const pj = JSON.parse(
    readFileSync(join(root, PKG_ROOT, d, 'package.json'), 'utf8')
  );
  if (pj.version !== dirVersion[d]) {
    changed.push({ dir: d, name: pj.name, version: pj.version, prev: dirVersion[d] });
  }
}
if (changed.length === 0) {
  console.log('Changeset version produced no version changes.');
  process.exit(0);
}

// Copy a package's tree at a git ref into destAbs, excluding bookkeeping.
function archiveAtRef(ref, pkgDir, destAbs) {
  const prefix = `${PKG_ROOT}/${pkgDir}`;
  const files = gitOut(['ls-tree', '-r', '--name-only', ref, '--', prefix])
    .split('\n')
    .filter(Boolean);
  for (const file of files) {
    const rel = file.slice(prefix.length + 1);
    if (!rel || rel.startsWith(ARCHIVE_EXCLUDE_PREFIX)) continue;
    if (ARCHIVE_EXCLUDE_FILES.has(rel)) continue;
    const buf = git(['show', `${ref}:${file}`]); // Buffer (binary-safe)
    const out = join(destAbs, rel);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, buf);
  }
}

// 6. Update history ledgers and archive superseded versions.
for (const c of changed) {
  const pkgAbs = join(root, PKG_ROOT, c.dir);
  const historyPath = join(pkgAbs, 'history.json');
  const history = existsSync(historyPath)
    ? JSON.parse(readFileSync(historyPath, 'utf8'))
    : [];
  const cs = pending[c.dir] || { ids: new Set(), summaries: [] };
  const ids = [...cs.ids];
  const summary = cs.summaries.join('\n');

  if (history.length > 0) {
    const last = history[history.length - 1];
    last.supersededBy = c.version;
    last.supersededByCommit = contentCommit;
    last.supersededDate = today;

    const tag = `${c.dir}-v${last.version}`;
    let ref = tag;
    try {
      gitOut(['rev-parse', '--verify', `${tag}^{commit}`]);
    } catch {
      ref = last.commit; // fall back to the recorded commit if the tag is missing
    }

    const archiveAbs = join(pkgAbs, 'archive', `v${last.version}`);
    archiveAtRef(ref, c.dir, archiveAbs);
    writeFileSync(
      join(archiveAbs, 'manifest.json'),
      JSON.stringify(
        {
          package: c.name,
          version: last.version,
          date: last.date,
          createdCommit: last.commit,
          changesets: last.changesets,
          summary: last.summary,
          supersededBy: c.version,
          supersededByCommit: contentCommit,
          supersededDate: today,
          sourceRef: ref,
        },
        null,
        2
      ) + '\n'
    );
  }

  history.push({
    version: c.version,
    date: today,
    commit: contentCommit,
    changesets: ids,
    summary,
    supersededBy: null,
    supersededByCommit: null,
    supersededDate: null,
  });
  writeFileSync(historyPath, JSON.stringify(history, null, 2) + '\n');
}

// 7. Commit and tag (GOVERNANCE_RELEASE bypasses the changeset pre-commit hook).
git(['add', '-A']);
const message =
  'chore(release): governance documents [skip ci]\n\n' +
  changed.map((c) => `- ${c.name}@${c.version}`).join('\n') +
  '\n';
execFileSync('git', ['commit', '-m', message], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, GOVERNANCE_RELEASE: '1' },
});
for (const c of changed) {
  git(['tag', `${c.dir}-v${c.version}`]);
}

console.log('\nReleased:');
for (const c of changed) {
  console.log(
    `  ${c.name}: ${c.prev} -> ${c.version} (tag ${c.dir}-v${c.version})`
  );
}
console.log('\nNext: git push --follow-tags origin main');
