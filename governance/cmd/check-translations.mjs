#!/usr/bin/env node

/**
 * check-translations.mjs — keeps non-binding translations in sync with the
 * canonical (legally binding) German governed documents.
 *
 * The German document `packages/<pkg>/<name>.md` is the binding source. Each one
 * must have a translation alongside it for every required language, named
 * `packages/<pkg>/<name>.<lang>.md` (e.g. `statutes.en.md`). Whenever a canonical
 * document changes, its translations must change in the SAME change set, so the
 * informational copies never silently drift from the binding text.
 *
 * Modes:
 *   (default)      compare staged files (`git diff --cached`) — used by the
 *                  pre-commit hook.
 *   --base <ref>   compare the merge-base range `<ref>...HEAD` — used in CI on a
 *                  pull request (e.g. `--base origin/main`).
 *
 * The GOVERNANCE_RELEASE env var bypasses the check so the automated release
 * commit (which only touches bookkeeping files) can proceed.
 *
 * Usage:
 *   node governance/cmd/check-translations.mjs
 *   node governance/cmd/check-translations.mjs --base origin/main
 *   node governance/cmd/check-translations.mjs --help
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Languages that must exist (and stay current) for every canonical document.
const REQUIRED_LANGS = ['en'];

const USAGE =
  'Usage: node governance/cmd/check-translations.mjs [--base <ref>]';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(
    USAGE +
      '\n\n' +
      'Fails when a canonical governed document changes without its\n' +
      'translations being updated in the same change set.\n'
  );
  process.exit(0);
}

// Parse arguments: only `--base <ref>` is supported beyond help.
let base = null;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--base') {
    base = args[++i];
    if (!base) {
      console.error('Option --base requires a value');
      console.error(USAGE);
      process.exit(2);
    }
  } else {
    console.error(`Unknown option: ${a}`);
    console.error(USAGE);
    process.exit(2);
  }
}

if (process.env.GOVERNANCE_RELEASE) process.exit(0);

function gitOut(gitArgs) {
  return execFileSync('git', gitArgs, { encoding: 'utf8' }).trim();
}

const changed = (
  base
    ? gitOut(['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`])
    : gitOut(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
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
// A translation file ends with a two-letter language tag, e.g. `.en.md`.
const isTranslation = (p) => /\.[a-z]{2}\.md$/.test(p);
const isCanonicalDoc = (p) =>
  p.startsWith('packages/') &&
  p.endsWith('.md') &&
  !isBookkeeping(p) &&
  !isTranslation(p);

const translationPath = (doc, lang) => doc.replace(/\.md$/, `.${lang}.md`);

const changedSet = new Set(changed);
const problems = [];

for (const doc of changed.filter(isCanonicalDoc)) {
  for (const lang of REQUIRED_LANGS) {
    const tr = translationPath(doc, lang);
    if (!existsSync(tr)) {
      problems.push(
        `   - ${doc} changed, but its ${lang} translation ${tr} is missing.`
      );
    } else if (!changedSet.has(tr)) {
      problems.push(
        `   - ${doc} changed, but its ${lang} translation ${tr} was not updated.`
      );
    }
  }
}

if (problems.length > 0) {
  console.error(
    '\n\u2716 A canonical (legally binding) document changed without its translation:\n'
  );
  for (const line of problems) console.error(line);
  console.error(
    '\nThe German document is binding; the translation is the copy members read.\n' +
      'Update the matching translation file(s) so they stay in sync, then retry.\n'
  );
  process.exit(1);
}

process.exit(0);
