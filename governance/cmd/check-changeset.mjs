#!/usr/bin/env node

/**
 * check-changeset.mjs — pre-commit / CI guard.
 *
 * Fails if a governed document under packages/* is staged for commit without an
 * accompanying changeset. Bookkeeping files (package.json, CHANGELOG.md,
 * history.json, README.md, and anything under archive/) are exempt.
 *
 * The GOVERNANCE_RELEASE env var bypasses the check so the automated release
 * commit (which consumes changesets rather than adding them) can proceed.
 *
 * Usage:
 *   node governance/cmd/check-changeset.mjs
 *   node governance/cmd/check-changeset.mjs --help
 */

import { execFileSync } from 'node:child_process';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(
    'Usage: node governance/cmd/check-changeset.mjs\n\n' +
      'Fails when a governed document is staged without a changeset.\n'
  );
  process.exit(0);
}

const unknown = process.argv.slice(2).filter((a) => a !== '--help' && a !== '-h');
if (unknown.length > 0) {
  console.error(`Unknown option: ${unknown[0]}`);
  console.error('Usage: node governance/cmd/check-changeset.mjs');
  process.exit(2);
}

if (process.env.GOVERNANCE_RELEASE) process.exit(0);

const staged = execFileSync(
  'git',
  ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
  { encoding: 'utf8' }
)
  .split('\n')
  .filter(Boolean);

const BOOKKEEPING = new Set([
  'package.json',
  'CHANGELOG.md',
  'history.json',
  'README.md',
]);
const isBookkeeping = (p) =>
  BOOKKEEPING.has(p.split('/').pop()) || p.includes('/archive/');
// Translations (e.g. `*.en.md`) are non-binding copies, not governed source;
// they ride along with the canonical document and need no changeset of their own.
const isTranslation = (p) => /\.[a-z]{2}\.md$/.test(p);

const content = staged.filter(
  (p) => p.startsWith('packages/') && !isBookkeeping(p) && !isTranslation(p)
);
const changesets = staged.filter(
  (p) =>
    p.startsWith('.changeset/') &&
    p.endsWith('.md') &&
    p.split('/').pop().toLowerCase() !== 'readme.md'
);

if (content.length > 0 && changesets.length === 0) {
  console.error('\n\u2716 Governed document change detected without a changeset:\n');
  for (const f of content) console.error('   - ' + f);
  console.error('\nEvery change to a governed document must be versioned.');
  console.error('Create a changeset, stage it, and commit again:\n');
  console.error('   pnpm changeset\n');
  process.exit(1);
}

process.exit(0);
