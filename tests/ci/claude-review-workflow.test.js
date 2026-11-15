#!/usr/bin/env node
/**
 * Validate the Claude pull-request review workflow contract.
 *
 * The workflow hands pull-request content to a model that holds a token able
 * to comment on the PR, so the properties that keep it harmless are pinned
 * here: unprivileged trigger, minimal permissions, pinned actions, a strict
 * comment-only tool list, and a clean skip when no credential is configured.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(
  __dirname,
  '..',
  '..',
  '.github',
  'workflows',
  'claude-review.yml',
);

const CREDENTIAL_GATE = "if: steps.creds.outputs.available == 'true'";

// Every ${{ }} expression the workflow may contain. Anything else, such as a
// pull-request title or branch name, is text the PR author controls.
const ALLOWED_EXPRESSIONS = new Set([
  'github.workflow',
  'github.event.pull_request.number',
  'github.repository',
  "secrets.CLAUDE_CODE_OAUTH_TOKEN != ''",
  "secrets.ANTHROPIC_API_KEY != ''",
  'secrets.CLAUDE_CODE_OAUTH_TOKEN',
  'secrets.ANTHROPIC_API_KEY',
  'secrets.GITHUB_TOKEN',
]);

const ALLOWED_TOOLS = [
  'mcp__github_inline_comment__create_inline_comment',
  'Bash(gh pr comment:*)',
  'Bash(gh pr diff:*)',
  'Bash(gh pr view:*)',
];

const REQUIRED_DENIED_TOOLS = [
  'WebFetch',
  'WebSearch',
  'Write',
  'Edit',
  'NotebookEdit',
  'Read(//proc/**)',
  'Read(//home/runner/work/_temp/**)',
];

// Inputs and flags that would widen what the reviewer can do or who can
// reach it. None of them belongs in this workflow.
const FORBIDDEN_SETTINGS = [
  '--dangerously-skip-permissions',
  '--mcp-config',
  'bypassPermissions',
  'allowed_non_write_users',
  'allowed_bots',
  'show_full_output',
  'additional_permissions',
];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function getToolList(source, flag) {
  const matches = [...source.matchAll(new RegExp(`${flag} "([^"]+)"`, 'g'))];
  assert.strictEqual(matches.length, 1, `expected exactly one ${flag} list, found ${matches.length}`);
  return matches[0][1].split(',').map(tool => tool.trim());
}

function getRunBlocks(source) {
  const lines = source.split(/\r?\n/);
  const blocks = [];
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/^(\s*)run: \|/);
    if (!match) continue;
    const indent = match[1].length;
    const body = [];
    for (let next = index + 1; next < lines.length; next++) {
      const line = lines[next];
      if (line.trim() !== '' && line.search(/\S/) <= indent) break;
      body.push(line);
    }
    blocks.push(body.join('\n'));
  }
  return blocks;
}

function run() {
  console.log('\n=== Testing Claude PR review workflow ===\n');

  const source = fs.readFileSync(WORKFLOW_PATH, 'utf8');
  let passed = 0;
  let failed = 0;

  if (test('runs on pull requests into main and never on privileged PR events', () => {
    assert.ok(/^on:\r?\n\s+pull_request:\r?\n\s+branches: \[main\]/m.test(source), 'trigger must be pull_request into main');
    assert.ok(!source.includes('pull_request_target'), 'pull_request_target is not allowed');
    assert.ok(!source.includes('workflow_run'), 'workflow_run is not allowed');
  })) passed++; else failed++;

  if (test('grants only pull-request write on top of read-only contents', () => {
    const writeScopes = [...source.matchAll(/^\s+([a-z-]+):\s*write\b/gm)].map(match => match[1]);
    assert.deepStrictEqual(writeScopes, ['pull-requests']);
    assert.ok(/^permissions:\r?\n\s+contents: read/m.test(source), 'workflow-level permissions must be contents: read');
    assert.ok(!source.includes('id-token:'), 'id-token is not needed and must stay out');
    assert.ok(!source.includes('write-all'), 'write-all is not allowed');
  })) passed++; else failed++;

  if (test('pins every action to a commit SHA and does not persist checkout credentials', () => {
    const usesLines = source.split(/\r?\n/).filter(line => /^\s+uses:/.test(line));
    assert.strictEqual(usesLines.length, 2, 'expected exactly the checkout and review actions');
    for (const line of usesLines) {
      assert.ok(/uses: [\w./-]+@[0-9a-f]{40} # v\d/.test(line), `action is not pinned to a SHA: ${line.trim()}`);
    }
    assert.ok(source.includes('uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd'), 'checkout must use the repo-wide pinned SHA');
    assert.ok(/uses: anthropics\/claude-code-action@[0-9a-f]{40}/.test(source), 'review action must be pinned');
    assert.ok(source.includes('persist-credentials: false'), 'checkout must not persist credentials');
  })) passed++; else failed++;

  if (test('skips drafts and fork branches, and bounds the job time', () => {
    assert.ok(source.includes('github.event.pull_request.draft == false'), 'drafts must be skipped');
    assert.ok(source.includes('github.event.pull_request.head.repo.full_name == github.repository'), 'fork branches must be skipped');
    assert.ok(/^\s+timeout-minutes: \d+$/m.test(source), 'the job needs a timeout');
  })) passed++; else failed++;

  if (test('skips cleanly when no credential secret is configured', () => {
    assert.ok(source.includes("HAS_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN != '' }}"), 'OAuth token presence check missing');
    assert.ok(source.includes("HAS_API_KEY: ${{ secrets.ANTHROPIC_API_KEY != '' }}"), 'API key presence check missing');
    assert.ok(source.includes('::notice title=Claude review skipped::'), 'skip notice missing');
    const gatedSteps = source.split(CREDENTIAL_GATE).length - 1;
    assert.strictEqual(gatedSteps, 2, 'checkout and review must both wait for the credential check');
  })) passed++; else failed++;

  if (test('limits the reviewer to commenting, with a strict permission mode', () => {
    assert.deepStrictEqual(getToolList(source, '--allowedTools'), ALLOWED_TOOLS);
    assert.ok(source.includes('--permission-mode default'), 'the allow list is only strict under --permission-mode default');
    assert.ok(/--max-turns \d+/.test(source), 'the session needs a turn limit');
    assert.ok(source.includes('github_token: ${{ secrets.GITHUB_TOKEN }}'), 'comments must use the workflow token');
  })) passed++; else failed++;

  if (test('denies network, file-writing and runner-secret reads outright', () => {
    const denied = getToolList(source, '--disallowedTools');
    for (const tool of REQUIRED_DENIED_TOOLS) {
      assert.ok(denied.includes(tool), `--disallowedTools must include ${tool}`);
    }
  })) passed++; else failed++;

  if (test('uses none of the settings that widen access', () => {
    for (const setting of FORBIDDEN_SETTINGS) {
      assert.ok(!source.includes(setting), `${setting} must not appear in the workflow`);
    }
  })) passed++; else failed++;

  if (test('interpolates only known, author-independent expressions', () => {
    const expressions = [...source.matchAll(/\$\{\{\s*(.*?)\s*\}\}/g)].map(match => match[1]);
    assert.ok(expressions.length > 0, 'expected the workflow to contain expressions');
    for (const expression of expressions) {
      assert.ok(ALLOWED_EXPRESSIONS.has(expression), `unexpected expression: \${{ ${expression} }}`);
    }
    for (const block of getRunBlocks(source)) {
      assert.ok(!block.includes('${{'), 'run blocks must read values from env, never interpolate expressions');
    }
  })) passed++; else failed++;

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

run();
