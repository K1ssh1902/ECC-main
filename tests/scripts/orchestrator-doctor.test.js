/**
 * Tests for scripts/orchestrator-doctor.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'orchestrator-doctor.js');
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

const HEALTHY_PORTFOLIO = [
  '# Portfolio',
  '',
  '**Owner:** viren',
  '**Updated:** 2026-07-07T22:00:00Z',
  '**Active session:** none',
  '',
  '## Objectives',
  '- [ ] OBJ-001 production-harden helios — status: active — missions: helios--night-shift--2026-07-08',
  '- [x] OBJ-002 clean up docs — status: done — missions: docs--night-shift--2026-07-01',
  '',
  '## Repositories',
  '| Repo | Path | Notes | Active mission |',
  '|------|------|-------|----------------|',
  '| helios | C:\\dev\\helios | assistant | helios--night-shift--2026-07-08 |',
  '',
  '## Missions',
  '| ID | Objective | Project | Mode | State | Started | Last check |',
  '|----|-----------|---------|------|-------|---------|------------|',
  '| helios--night-shift--2026-07-08 | OBJ-001 | C:\\dev\\helios | night-shift | active | 2026-07-08 | 2026-07-08T02:00:00Z |',
  '| docs--night-shift--2026-07-01 | OBJ-002 | C:\\dev\\docs | night-shift | done | 2026-07-01 | 2026-07-02T01:00:00Z |',
  '',
  '## Needs Human (aggregated)',
  '- helios--night-shift--2026-07-08: STRIPE_TEST_KEY missing — queued 2026-07-08',
  '',
  '## Risk Register',
  '- R1 helios repo lives under OneDrive — lock contention risk',
  '',
  '## Decision Log',
  '- 2026-07-07: chartered OBJ-001 as a single 20-cycle mission',
  '',
].join('\n');

function missionFile(overrides = {}) {
  const values = Object.assign({
    id: 'helios--night-shift--2026-07-08',
    objective: 'OBJ-001',
    project: 'C:\\dev\\helios',
    mode: 'night-shift',
    state: 'active',
    goal: 'production-harden the API',
    supervision: '- 2026-07-08T02:00:00Z — doctor: cycles=4 kept=4 flat=0 needsHuman=1 — health: OK — action: none',
    outcome: '',
  }, overrides);

  return [
    `# Mission ${values.id}`,
    '',
    `**Objective:** ${values.objective}`,
    `**Project:** ${values.project}`,
    `**Mode:** ${values.mode}`,
    `**State:** ${values.state}`,
    '**Chartered:** 2026-07-07',
    '',
    '## Charter',
    `- Goal: ${values.goal}`,
    '- Budget: max-cycles 20',
    '',
    '## Dispatch',
    '- Command: /night-shift "production-harden the API" --project C:\\dev\\helios --max-cycles 20',
    '',
    '## Supervision Log',
    values.supervision,
    '',
    '## Outcome',
    values.outcome,
    '',
  ].join('\n');
}

function writeState(root, { portfolio, missions, reports } = {}) {
  fs.mkdirSync(path.join(root, 'missions'), { recursive: true });
  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  if (portfolio !== null) {
    fs.writeFileSync(path.join(root, 'portfolio.md'), portfolio === undefined ? HEALTHY_PORTFOLIO : portfolio, 'utf8');
  }
  const missionEntries = missions === undefined
    ? {
        'helios--night-shift--2026-07-08.md': missionFile(),
        'docs--night-shift--2026-07-01.md': missionFile({
          id: 'docs--night-shift--2026-07-01',
          objective: 'OBJ-002',
          project: 'C:\\dev\\docs',
          state: 'done',
          outcome: 'Overall 42→55; 6 kept, 1 reverted. Handoff in .night-shift/mission.md.',
        }),
      }
    : missions;
  for (const [name, content] of Object.entries(missionEntries || {})) {
    fs.writeFileSync(path.join(root, 'missions', name), content, 'utf8');
  }
  for (const [name, content] of Object.entries(reports || {})) {
    fs.writeFileSync(path.join(root, 'reports', name), content, 'utf8');
  }
  return root;
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
  console.log('=== Testing orchestrator-doctor.js ===\n');
  let passed = 0;
  let failed = 0;

  if (test('healthy state validates with no problems (normal execution)', () => {
    const root = createTempDir('ocd-healthy-');
    try {
      writeState(root);
      const result = validateState(collectState(root));
      assert.strictEqual(result.ok, true, JSON.stringify(result.problems));
      assert.strictEqual(result.problems.length, 0);
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('missing state directory exits 1 (fresh machine)', () => {
    const missing = path.join(createTempDir('ocd-empty-'), 'nope');
    try {
      const proc = runCli(['validate', '--dir', missing]);
      assert.strictEqual(proc.status, 1);
      assert.ok(proc.stderr.includes('No orchestrator state'));
    } finally {
      cleanup(path.dirname(missing));
    }
  })) passed++; else failed++;

  if (test('missing portfolio.md is an error (invalid state)', () => {
    const root = createTempDir('ocd-noport-');
    try {
      writeState(root, { portfolio: null });
      const result = validateState(collectState(root));
      assert.strictEqual(result.ok, false);
      assert.ok(result.problems.some(problem => problem.code === 'E_NO_PORTFOLIO'));
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('missing portfolio section is an error (schema drift)', () => {
    const root = createTempDir('ocd-section-');
    try {
      writeState(root, { portfolio: HEALTHY_PORTFOLIO.replace('## Decision Log', '## Notes') });
      const result = validateState(collectState(root));
      assert.ok(result.problems.some(problem =>
        problem.code === 'E_PORTFOLIO_SECTION' && problem.message.includes('Decision Log')));
      assert.strictEqual(result.ok, false);
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('mission in table without a file is an error (broken registry)', () => {
    const root = createTempDir('ocd-nofile-');
    try {
      writeState(root, { missions: { 'docs--night-shift--2026-07-01.md': missionFile({ id: 'docs--night-shift--2026-07-01', project: 'C:\\dev\\docs', state: 'done', outcome: 'done.' }) } });
      const result = validateState(collectState(root));
      assert.ok(result.problems.some(problem => problem.code === 'E_MISSION_FILE_MISSING'));
      assert.strictEqual(result.ok, false);
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('orphan mission file is a warning, not an error', () => {
    const root = createTempDir('ocd-orphan-');
    try {
      writeState(root, {
        missions: {
          'helios--night-shift--2026-07-08.md': missionFile(),
          'docs--night-shift--2026-07-01.md': missionFile({ id: 'docs--night-shift--2026-07-01', project: 'C:\\dev\\docs', state: 'done', outcome: 'done.' }),
          'stray--night-shift--2026-07-02.md': missionFile({ id: 'stray--night-shift--2026-07-02', project: 'C:\\dev\\stray', state: 'chartered' }),
        },
      });
      const result = validateState(collectState(root));
      assert.strictEqual(result.ok, true, JSON.stringify(result.problems));
      assert.ok(result.problems.some(problem => problem.code === 'W_ORPHAN_MISSION'));
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('invalid mission state and missing charter are errors', () => {
    const root = createTempDir('ocd-badmission-');
    try {
      const broken = missionFile().replace('**State:** active', '**State:** running').replace('- Goal: production-harden the API', '');
      writeState(root, {
        missions: {
          'helios--night-shift--2026-07-08.md': broken,
          'docs--night-shift--2026-07-01.md': missionFile({ id: 'docs--night-shift--2026-07-01', project: 'C:\\dev\\docs', state: 'done', outcome: 'done.' }),
        },
      });
      const result = validateState(collectState(root));
      const codes = result.problems.map(problem => problem.code);
      assert.ok(codes.includes('E_MISSION_STATE'));
      assert.ok(codes.includes('E_MISSION_CHARTER'));
      assert.strictEqual(result.ok, false);
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('two running missions on one project is an error (repo conflict)', () => {
    const root = createTempDir('ocd-conflict-');
    try {
      writeState(root, {
        missions: {
          'helios--night-shift--2026-07-08.md': missionFile(),
          'docs--night-shift--2026-07-01.md': missionFile({ id: 'docs--night-shift--2026-07-01', project: 'C:\\dev\\docs', state: 'done', outcome: 'done.' }),
          'helios--night-shift--2026-07-09.md': missionFile({ id: 'helios--night-shift--2026-07-09', state: 'dispatched' }),
        },
      });
      const result = validateState(collectState(root));
      assert.ok(result.problems.some(problem => problem.code === 'E_REPO_CONFLICT'));
      assert.strictEqual(result.ok, false);
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('terminal mission without outcome and running mission without supervision warn', () => {
    const root = createTempDir('ocd-warns-');
    try {
      writeState(root, {
        missions: {
          'helios--night-shift--2026-07-08.md': missionFile({ supervision: '' }),
          'docs--night-shift--2026-07-01.md': missionFile({ id: 'docs--night-shift--2026-07-01', project: 'C:\\dev\\docs', state: 'done', outcome: '' }),
        },
      });
      const result = validateState(collectState(root));
      const codes = result.problems.map(problem => problem.code);
      assert.strictEqual(result.ok, true, JSON.stringify(result.problems));
      assert.ok(codes.includes('W_NO_OUTCOME'));
      assert.ok(codes.includes('W_NO_SUPERVISION'));
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('status reports session, counts, and last report', () => {
    const root = createTempDir('ocd-status-');
    try {
      writeState(root, { reports: { '2026-07-06.md': '# r1', '2026-07-08.md': '# r2' } });
      const status = computeStatus(collectState(root));
      assert.strictEqual(status.activeSession, 'none');
      assert.strictEqual(status.objectives, 2);
      assert.strictEqual(status.missions, 2);
      assert.strictEqual(status.running, 1);
      assert.strictEqual(status.blocked, 0);
      assert.strictEqual(status.needsHuman, 1);
      assert.strictEqual(status.lastReport, '2026-07-08.md');
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('metrics compute state breakdown, completion rate, and supervision totals', () => {
    const root = createTempDir('ocd-metrics-');
    try {
      writeState(root, {
        missions: {
          'helios--night-shift--2026-07-08.md': missionFile(),
          'docs--night-shift--2026-07-01.md': missionFile({ id: 'docs--night-shift--2026-07-01', project: 'C:\\dev\\docs', state: 'done', outcome: 'done.' }),
          'x--night-shift--2026-07-02.md': missionFile({ id: 'x--night-shift--2026-07-02', project: 'C:\\dev\\x', state: 'aborted', outcome: 'killed: thrash.' }),
        },
      });
      const metrics = computeMetrics(collectState(root));
      assert.strictEqual(metrics.objectives, 2);
      assert.strictEqual(metrics.objectivesDone, 1);
      assert.strictEqual(metrics.missions, 3);
      assert.strictEqual(metrics.byState.active, 1);
      assert.strictEqual(metrics.byState.done, 1);
      assert.strictEqual(metrics.byState.aborted, 1);
      assert.strictEqual(metrics.completionRate, 0.5);
      assert.strictEqual(metrics.supervisionEntries, 3);
      assert.strictEqual(metrics.needsHumanQueued, 1);
    } finally {
      cleanup(root);
    }
  })) passed++; else failed++;

  if (test('CLI validate exits 2 on inconsistent state and 0 on healthy', () => {
    const broken = createTempDir('ocd-cli-broken-');
    const healthy = createTempDir('ocd-cli-ok-');
    try {
      writeState(broken, { portfolio: null });
      writeState(healthy);

      const bad = runCli(['validate', '--json', '--dir', broken]);
      assert.strictEqual(bad.status, 2);
      assert.strictEqual(JSON.parse(bad.stdout).ok, false);

      const good = runCli(['validate', '--json', '--dir', healthy]);
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
