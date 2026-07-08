/**
 * Tests for scripts/night-shift-doctor.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'night-shift-doctor.js');
const {
  collectState,
  computeMetrics,
  computeStatus,
  parseArgs,
  validateState,
} = require(SCRIPT);

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

const HEALTHY_MISSION = [
  '# Night Shift Mission',
  '',
  '**Goal:** production-harden the API',
  '**Current phase:** stabilize',
  '',
  '## Backlog (impact-ranked)',
  '- [ ] P1 fix checkout crash',
  '- [ ] P3 parameterize raw SQL',
  '',
  '## Completed',
  '- [x] cycle 001 — KEPT — fixed race — commit abc',
  '',
  '## Blocked',
  '- P2 split server.js — reverted twice',
  '',
  '## Needs Human',
  '- STRIPE_TEST_KEY missing',
  '',
].join('\n');

const HEALTHY_SCORECARD = [
  '# Scorecard',
  '',
  '| Category | Baseline | Last audit (c001) | Now | Evidence (latest) |',
  '|----------|---------:|------------------:|----:|-------------------|',
  ...[
    'Architecture', 'Code quality', 'Testing', 'Documentation', 'Performance',
    'Security', 'Reliability', 'Maintainability', 'Scalability',
    'Developer experience', 'User experience', 'UI consistency', 'Accessibility',
  ].map(name => `| ${name} | 40 | 45 | 50 | evidence |`),
  '| **Overall (mean)** | 40 | 45 | 50 | |',
  '',
].join('\n');

function journalEntry(number, options = {}) {
  const lines = [
    `# Cycle ${String(number).padStart(3, '0')}`,
    '',
    `**Started:** ${options.started || '2026-07-07T22:00:00Z'}`,
    '**Selected:** P1 fix crash',
    '',
    '## Contract',
    '- Change: something',
    '',
  ];
  if (options.verdict !== null) {
    lines.push(`## Verdict: ${options.verdict || 'KEPT'}`);
    lines.push(`Score deltas: ${options.deltas || 'reliability 41→49'}`);
    lines.push(`**Finished:** ${options.finished || '2026-07-07T22:30:00Z'}`);
  }
  return lines.join('\n');
}

function writeState(root, { mission, scorecard, journal } = {}) {
  const stateDir = path.join(root, '.night-shift');
  fs.mkdirSync(path.join(stateDir, 'journal'), { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'mission.md'), mission === undefined ? HEALTHY_MISSION : mission, 'utf8');
  if (scorecard !== null) {
    fs.writeFileSync(path.join(stateDir, 'scorecard.md'), scorecard === undefined ? HEALTHY_SCORECARD : scorecard, 'utf8');
  }
  for (const [name, content] of Object.entries(journal || {})) {
    fs.writeFileSync(path.join(stateDir, 'journal', name), content, 'utf8');
  }
  return stateDir;
}

function runCli(args, cwd) {
  return spawnSync('node', [SCRIPT, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 10000,
  });
}

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

function runTests() {
  console.log('=== Testing night-shift-doctor.js ===\n');
  let passed = 0;
  let failed = 0;

  if (test('healthy state validates with no problems (normal execution)', () => {
    const root = createTempDir('nsd-healthy-');
    try {
      writeState(root, {
        journal: {
          'cycle-001.md': journalEntry(1),
          'cycle-002.md': journalEntry(2, { verdict: 'REVERTED' }),
        },
      });
      const result = validateState(collectState(root));
      assert.strictEqual(result.ok, true, JSON.stringify(result.problems));
      assert.strictEqual(result.problems.length, 0);
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('missing state directory exits 1 (empty repository)', () => {
    const root = createTempDir('nsd-empty-');
    try {
      const proc = runCli(['validate'], root);
      assert.strictEqual(proc.status, 1);
      assert.ok(proc.stderr.includes('.night-shift'));
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('missing mission and scorecard are errors (invalid state)', () => {
    const root = createTempDir('nsd-missing-');
    try {
      const stateDir = writeState(root, { scorecard: null });
      fs.rmSync(path.join(stateDir, 'mission.md'));
      const result = validateState(collectState(root));
      const codes = result.problems.map(problem => problem.code);
      assert.strictEqual(result.ok, false);
      assert.ok(codes.includes('E_NO_MISSION'));
      assert.ok(codes.includes('E_NO_SCORECARD'));
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('journal numbering gap is an error (inconsistent repository)', () => {
    const root = createTempDir('nsd-gap-');
    try {
      writeState(root, {
        journal: {
          'cycle-001.md': journalEntry(1),
          'cycle-003.md': journalEntry(3),
        },
      });
      const result = validateState(collectState(root));
      assert.ok(result.problems.some(problem => problem.code === 'E_JOURNAL_GAP'));
      assert.strictEqual(result.ok, false);
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('open last cycle is a warning, not an error (interrupted execution)', () => {
    const root = createTempDir('nsd-open-');
    try {
      writeState(root, {
        journal: {
          'cycle-001.md': journalEntry(1),
          'cycle-002.md': journalEntry(2, { verdict: null }),
        },
      });
      const result = validateState(collectState(root));
      assert.strictEqual(result.ok, true);
      assert.ok(result.problems.some(problem => problem.code === 'W_OPEN_CYCLE'));
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('missing verdict on a non-last entry is an error (failed execution)', () => {
    const root = createTempDir('nsd-midopen-');
    try {
      writeState(root, {
        journal: {
          'cycle-001.md': journalEntry(1, { verdict: null }),
          'cycle-002.md': journalEntry(2),
        },
      });
      const result = validateState(collectState(root));
      assert.ok(result.problems.some(problem => problem.code === 'E_NO_VERDICT'));
      assert.strictEqual(result.ok, false);
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('out-of-range score is an error', () => {
    const root = createTempDir('nsd-score-');
    try {
      writeState(root, {
        scorecard: HEALTHY_SCORECARD.replace('| Testing | 40 | 45 | 50 |', '| Testing | 40 | 45 | 150 |'),
      });
      const result = validateState(collectState(root));
      assert.ok(result.problems.some(problem => problem.code === 'E_SCORE_RANGE'));
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('status reports goal, phase, counts, and open cycle', () => {
    const root = createTempDir('nsd-status-');
    try {
      writeState(root, {
        journal: {
          'cycle-001.md': journalEntry(1),
          'cycle-002.md': journalEntry(2, { verdict: null }),
        },
      });
      const status = computeStatus(collectState(root));
      assert.strictEqual(status.goal, 'production-harden the API');
      assert.strictEqual(status.phase, 'stabilize');
      assert.strictEqual(status.cycles, 2);
      assert.strictEqual(status.openCycle, true);
      assert.strictEqual(status.blocked, 1);
      assert.strictEqual(status.needsHuman, 1);
      assert.deepStrictEqual(status.overall, { baseline: 40, now: 50 });
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('metrics compute completion rate, duration, and flat streak', () => {
    const root = createTempDir('nsd-metrics-');
    try {
      writeState(root, {
        journal: {
          'cycle-001.md': journalEntry(1, {
            started: '2026-07-07T22:00:00Z',
            finished: '2026-07-07T22:20:00Z',
          }),
          'cycle-002.md': journalEntry(2, {
            verdict: 'REVERTED',
            deltas: 'none',
            started: '2026-07-07T23:00:00Z',
            finished: '2026-07-07T23:40:00Z',
          }),
          'cycle-003.md': journalEntry(3, {
            deltas: 'none',
            started: '2026-07-08T00:00:00Z',
            finished: '2026-07-08T00:30:00Z',
          }),
        },
      });
      const metrics = computeMetrics(collectState(root));
      assert.strictEqual(metrics.closedCycles, 3);
      assert.strictEqual(metrics.kept, 2);
      assert.strictEqual(metrics.reverted, 1);
      assert.strictEqual(metrics.completionRate, 0.67);
      assert.strictEqual(metrics.avgCycleMinutes, 30);
      assert.strictEqual(metrics.flatTrailingCycles, 2);
      assert.strictEqual(metrics.overallDelta, 10);
      assert.strictEqual(metrics.needsHumanQueued, 1);
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('CLI validate exits 2 on inconsistent state and 0 on healthy', () => {
    const broken = createTempDir('nsd-cli-broken-');
    const healthy = createTempDir('nsd-cli-ok-');
    try {
      const stateDir = writeState(broken, {});
      fs.rmSync(path.join(stateDir, 'mission.md'));
      writeState(healthy, { journal: { 'cycle-001.md': journalEntry(1) } });

      const bad = runCli(['validate', '--json'], broken);
      assert.strictEqual(bad.status, 2);
      assert.strictEqual(JSON.parse(bad.stdout).ok, false);

      const good = runCli(['validate', '--json', '--dir', healthy], os.tmpdir());
      assert.strictEqual(good.status, 0, good.stderr);
      assert.strictEqual(JSON.parse(good.stdout).ok, true);
    } finally {
      cleanup(broken);
      cleanup(healthy);
    }
  })) passed++; else failed++;

  if (test('parseArgs rejects unknown arguments and missing command', () => {
    assert.throws(() => parseArgs(['--bogus']), /Unknown argument/);
    assert.throws(() => parseArgs([]), /Usage/);
    assert.throws(() => parseArgs(['validate', '--dir']), /--dir requires/);
    assert.deepStrictEqual(parseArgs(['metrics', '--json']), { command: 'metrics', dir: null, json: true });
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
