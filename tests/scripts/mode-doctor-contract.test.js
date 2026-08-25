/**
 * Mode Doctor Contract tests (HELIOS Roadmap M3).
 *
 * The Chief Orchestrator reads mission telemetry exclusively through the two
 * doctor CLIs (`night-shift-doctor`, `orchestrator-doctor`) as JSON. This
 * suite pins that read surface — the Mode Doctor Contract — using the real
 * outputs captured during the first supervised mission (M2), stored in
 * tests/fixtures/mode-doctor-captures/. The fixtures are the contract's
 * ground truth: field sets, field types, exit codes, and failure text all
 * derive from them, and live doctor runs are compared back against them so
 * schema drift fails loudly here before it breaks the control plane.
 *
 * Run with: node tests/scripts/mode-doctor-contract.test.js
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const FIXTURES_DIR = path.join(REPO_ROOT, 'tests', 'fixtures', 'mode-doctor-captures');
const NIGHT_SHIFT_DOCTOR = path.join(REPO_ROOT, 'scripts', 'night-shift-doctor.js');
const ORCHESTRATOR_DOCTOR = path.join(REPO_ROOT, 'scripts', 'orchestrator-doctor.js');

// ---------------------------------------------------------------------------
// Fixture loading (captures are verbatim CLI output; JSON ones may carry a BOM)
// ---------------------------------------------------------------------------

function loadRaw(name) {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf8').replace(/^\uFEFF/, '');
}

function loadJson(name) {
  return JSON.parse(loadRaw(name));
}

// ---------------------------------------------------------------------------
// Contract checker: required fields + types, derived from the M2 captures.
// Type names: 'string' | 'number' | 'boolean' | 'array' | 'object' | unions
// via '|' (e.g. 'string|null') where both variants were observed or the
// doctor legitimately emits null for a missing optional (lastReport).
// ---------------------------------------------------------------------------

function typeName(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function checkContract(payload, contract, prefix = '') {
  const errors = [];
  for (const [field, expected] of Object.entries(contract)) {
    const label = prefix ? `${prefix}.${field}` : field;
    if (!(field in payload)) {
      errors.push(`missing required field: ${label}`);
      continue;
    }
    const value = payload[field];
    if (typeof expected === 'object') {
      if (typeName(value) !== 'object') {
        errors.push(`${label}: expected object, got ${typeName(value)}`);
      } else {
        errors.push(...checkContract(value, expected, label));
      }
    } else if (!expected.split('|').includes(typeName(value))) {
      errors.push(`${label}: expected ${expected}, got ${typeName(value)}`);
    }
  }
  for (const field of Object.keys(payload)) {
    if (!(field in contract)) {
      const label = prefix ? `${prefix}.${field}` : field;
      errors.push(`unexpected field not in contract: ${label}`);
    }
  }
  return errors;
}

function assertContract(payload, contract, what) {
  const errors = checkContract(payload, contract);
  assert.strictEqual(errors.length, 0, `${what} violates contract: ${errors.join('; ')}`);
}

// The Mode Doctor Contract, field by field, as captured in M2.
const NIGHTSHIFT_STATUS_CONTRACT = {
  goal: 'string',
  phase: 'string',
  cycles: 'number',
  lastCycle: { name: 'string', verdict: 'string' },
  openCycle: 'boolean',
  backlog: 'number',
  blocked: 'number',
  needsHuman: 'number',
  overall: { baseline: 'number|null', now: 'number|null' },
};

const NIGHTSHIFT_METRICS_CONTRACT = {
  cycles: 'number',
  closedCycles: 'number',
  kept: 'number',
  reverted: 'number',
  completionRate: 'number',
  overallDelta: 'number|null',
  improvementPerCycle: 'number|null',
  avgCycleMinutes: 'number|null',
  flatTrailingCycles: 'number',
  needsHumanQueued: 'number',
};

const VALIDATE_CONTRACT = {
  ok: 'boolean',
  problems: 'array',
};

const PROBLEM_CONTRACT = {
  severity: 'string',
  code: 'string',
  message: 'string',
};

const ORCHESTRATOR_STATUS_CONTRACT = {
  activeSession: 'string',
  updated: 'string',
  objectives: 'number',
  missions: 'number',
  running: 'number',
  blocked: 'number',
  needsHuman: 'number',
  lastReport: 'string|null',
};

// Failure text observed in the M2 absent-state captures.
const NIGHTSHIFT_NOSTATE_PATTERN = /^No \.night-shift state found under /;
const ORCHESTRATOR_ABSENT_PATTERN = /^No orchestrator state found at /;

// ---------------------------------------------------------------------------
// Live-run helpers and synthetic states (mirrors the doctors' own test
// fixtures, which are the known-healthy minimal states)
// ---------------------------------------------------------------------------

function runCli(script, args) {
  return spawnSync('node', [script, ...args], { encoding: 'utf8', timeout: 15000 });
}

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function writeNightShiftState(root) {
  const stateDir = path.join(root, '.night-shift');
  fs.mkdirSync(path.join(stateDir, 'journal'), { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'mission.md'), [
    '# Night Shift Mission',
    '',
    '**Goal:** production-harden the API',
    '**Current phase:** stabilize',
    '',
    '## Backlog (impact-ranked)',
    '- [ ] P1 fix checkout crash',
    '',
    '## Completed',
    '- [x] cycle 001 — KEPT — fixed race — commit abc',
    '',
    '## Blocked',
    '',
    '## Needs Human',
    '- STRIPE_TEST_KEY missing',
    '',
  ].join('\n'), 'utf8');
  const categories = [
    'Architecture', 'Code quality', 'Testing', 'Documentation', 'Performance',
    'Security', 'Reliability', 'Maintainability', 'Scalability',
    'Developer experience', 'User experience', 'UI consistency', 'Accessibility',
  ];
  fs.writeFileSync(path.join(stateDir, 'scorecard.md'), [
    '# Scorecard',
    '',
    '| Category | Baseline | Last audit (c001) | Now | Evidence (latest) |',
    '|----------|---------:|------------------:|----:|-------------------|',
    ...categories.map(name => `| ${name} | 40 | 45 | 50 | evidence |`),
    '| **Overall (mean)** | 40 | 45 | 50 | |',
    '',
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(stateDir, 'journal', 'cycle-001.md'), [
    '# Cycle 001',
    '',
    '**Started:** 2026-07-07T22:00:00Z',
    '**Selected:** P1 fix crash',
    '',
    '## Contract',
    '- Change: something',
    '',
    '## Verdict: KEPT',
    'Score deltas: reliability 41→49',
    '**Finished:** 2026-07-07T22:30:00Z',
    '',
  ].join('\n'), 'utf8');
  return root;
}

function orchestratorMissionFile(overrides = {}) {
  const values = Object.assign({
    id: 'helios--night-shift--2026-07-08',
    objective: 'OBJ-001',
    project: 'C:\\dev\\helios',
    state: 'active',
    outcome: '',
  }, overrides);
  return [
    `# Mission ${values.id}`,
    '',
    `**Objective:** ${values.objective}`,
    `**Project:** ${values.project}`,
    '**Mode:** night-shift',
    `**State:** ${values.state}`,
    '**Chartered:** 2026-07-07',
    '',
    '## Charter',
    '- Goal: production-harden the API',
    '- Budget: max-cycles 20',
    '',
    '## Dispatch',
    '- Command: /night-shift "production-harden the API" --project C:\\dev\\helios --max-cycles 20',
    '',
    '## Supervision Log',
    '- 2026-07-08T02:00:00Z — doctor: cycles=4 kept=4 flat=0 needsHuman=1 — health: OK — action: none',
    '',
    '## Outcome',
    values.outcome,
    '',
  ].join('\n');
}

function writeOrchestratorState(root, { missions } = {}) {
  fs.mkdirSync(path.join(root, 'missions'), { recursive: true });
  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(root, 'portfolio.md'), [
    '# Portfolio',
    '',
    '**Owner:** viren',
    '**Updated:** 2026-07-07T22:00:00Z',
    '**Active session:** none',
    '',
    '## Objectives',
    '- [ ] OBJ-001 production-harden helios — status: active — missions: helios--night-shift--2026-07-08',
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
  ].join('\n'), 'utf8');
  const missionEntries = missions === undefined
    ? { 'helios--night-shift--2026-07-08.md': orchestratorMissionFile() }
    : missions;
  for (const [name, content] of Object.entries(missionEntries || {})) {
    fs.writeFileSync(path.join(root, 'missions', name), content, 'utf8');
  }
  return root;
}

// ---------------------------------------------------------------------------
// Test harness (sibling idiom)
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    failed += 1;
  }
}

console.log('\n=== Mode Doctor Contract (M2 captures vs live doctors) ===\n');

// --- Section 1: the captured fixtures define and satisfy the contract -------

console.log('Captured fixtures satisfy the contract:');

test('night-shift status healthy capture has every contract field, correctly typed', () => {
  const payload = loadJson('2026-07-10-nightshift-status-healthy.json');
  assertContract(payload, NIGHTSHIFT_STATUS_CONTRACT, 'status capture');
  assert.ok(payload.cycles >= 0, 'cycles is non-negative');
  assert.ok(['KEPT', 'REVERTED'].includes(payload.lastCycle.verdict), 'verdict is a closed-cycle verdict');
});

test('night-shift metrics healthy capture has every contract field, correctly typed', () => {
  const payload = loadJson('2026-07-10-nightshift-metrics-healthy.json');
  assertContract(payload, NIGHTSHIFT_METRICS_CONTRACT, 'metrics capture');
  assert.ok(payload.completionRate >= 0 && payload.completionRate <= 1, 'completionRate in [0,1]');
  assert.strictEqual(payload.closedCycles, payload.kept + payload.reverted, 'closedCycles = kept + reverted');
});

test('night-shift validate healthy capture is { ok: true, problems: [] }', () => {
  const payload = loadJson('2026-07-10-nightshift-validate-healthy.json');
  assertContract(payload, VALIDATE_CONTRACT, 'validate capture');
  assert.strictEqual(payload.ok, true);
  assert.strictEqual(payload.problems.length, 0, 'ok:true implies zero problems');
});

test('orchestrator validate healthy capture is { ok: true, problems: [] }', () => {
  const payload = loadJson('2026-07-09-orchestrator-validate-healthy.json');
  assertContract(payload, VALIDATE_CONTRACT, 'validate capture');
  assert.strictEqual(payload.ok, true);
  assert.strictEqual(payload.problems.length, 0);
});

test('orchestrator validate integrity-error capture: ok false, typed problems, E_ code', () => {
  const payload = loadJson('2026-07-09-orchestrator-validate-fresh.json');
  assertContract(payload, VALIDATE_CONTRACT, 'validate capture');
  assert.strictEqual(payload.ok, false);
  assert.ok(payload.problems.length > 0, 'ok:false implies at least one problem');
  for (const problem of payload.problems) {
    assertContract(problem, PROBLEM_CONTRACT, 'problem entry');
    assert.match(problem.code, /^E_[A-Z_]+$/, 'problem code is an E_ constant');
  }
  assert.strictEqual(payload.problems[0].code, 'E_MISSION_FILE_MISSING');
});

test('orchestrator status healthy capture has every contract field, correctly typed', () => {
  const payload = loadJson('2026-07-09-orchestrator-status-healthy.json');
  assertContract(payload, ORCHESTRATOR_STATUS_CONTRACT, 'status capture');
});

test('night-shift absent-state capture is the documented non-JSON failure text', () => {
  const raw = loadRaw('2026-07-09-nightshift-status-nostate.json').trim();
  assert.match(raw, NIGHTSHIFT_NOSTATE_PATTERN);
  assert.throws(() => JSON.parse(raw), 'absent-state output is not JSON — consumers must branch on exit code first');
});

test('orchestrator absent-state capture is the documented non-JSON failure text', () => {
  const raw = loadRaw('2026-07-09-orchestrator-validate-absent.json').trim();
  assert.match(raw, ORCHESTRATOR_ABSENT_PATTERN);
  assert.throws(() => JSON.parse(raw), 'absent-state output is not JSON');
});

// --- Section 2: the contract checker itself can fail (guard proven) ---------

console.log('\nContract checker rejects violations:');

test('checker flags a missing required field', () => {
  const mutated = loadJson('2026-07-10-nightshift-status-healthy.json');
  delete mutated.cycles;
  const errors = checkContract(mutated, NIGHTSHIFT_STATUS_CONTRACT);
  assert.ok(errors.some(e => e.includes('missing required field: cycles')), errors.join('; '));
});

test('checker flags a wrong-typed field', () => {
  const mutated = loadJson('2026-07-10-nightshift-metrics-healthy.json');
  mutated.completionRate = '1';
  const errors = checkContract(mutated, NIGHTSHIFT_METRICS_CONTRACT);
  assert.ok(errors.some(e => e.includes('completionRate: expected number, got string')), errors.join('; '));
});

test('checker flags a field added outside the contract (schema growth is a contract change)', () => {
  const mutated = loadJson('2026-07-10-nightshift-status-healthy.json');
  mutated.surprise = true;
  const errors = checkContract(mutated, NIGHTSHIFT_STATUS_CONTRACT);
  assert.ok(errors.some(e => e.includes('unexpected field not in contract: surprise')), errors.join('; '));
});

// --- Section 3: today's doctors still honor the captured contract -----------

console.log('\nLive night-shift-doctor honors the contract (synthetic healthy state):');

const nsRoot = createTempDir('mode-doctor-contract-ns-');
try {
  writeNightShiftState(nsRoot);

  test('validate --json exits 0 with the validate contract shape', () => {
    const proc = runCli(NIGHT_SHIFT_DOCTOR, ['validate', '--dir', nsRoot, '--json']);
    assert.strictEqual(proc.status, 0, proc.stderr || proc.stdout);
    const payload = JSON.parse(proc.stdout);
    assertContract(payload, VALIDATE_CONTRACT, 'live validate');
    assert.strictEqual(payload.ok, true, JSON.stringify(payload.problems));
  });

  test('status --json exits 0 and matches the captured status schema field-for-field', () => {
    const proc = runCli(NIGHT_SHIFT_DOCTOR, ['status', '--dir', nsRoot, '--json']);
    assert.strictEqual(proc.status, 0, proc.stderr || proc.stdout);
    assertContract(JSON.parse(proc.stdout), NIGHTSHIFT_STATUS_CONTRACT, 'live status');
  });

  test('metrics --json exits 0 and matches the captured metrics schema field-for-field', () => {
    const proc = runCli(NIGHT_SHIFT_DOCTOR, ['metrics', '--dir', nsRoot, '--json']);
    assert.strictEqual(proc.status, 0, proc.stderr || proc.stdout);
    assertContract(JSON.parse(proc.stdout), NIGHTSHIFT_METRICS_CONTRACT, 'live metrics');
  });
} finally {
  cleanup(nsRoot);
}

test('status against a dir with no .night-shift exits 1 with the captured failure text', () => {
  const emptyRoot = createTempDir('mode-doctor-contract-ns-empty-');
  try {
    const proc = runCli(NIGHT_SHIFT_DOCTOR, ['status', '--dir', emptyRoot, '--json']);
    assert.strictEqual(proc.status, 1, `expected exit 1, got ${proc.status}`);
    const output = (proc.stderr + proc.stdout).trim();
    assert.match(output, NIGHTSHIFT_NOSTATE_PATTERN);
  } finally {
    cleanup(emptyRoot);
  }
});

console.log('\nLive orchestrator-doctor honors the contract (synthetic states):');

test('validate --json on healthy state exits 0 with { ok: true, problems: [] }', () => {
  const root = createTempDir('mode-doctor-contract-oc-');
  try {
    writeOrchestratorState(root);
    const proc = runCli(ORCHESTRATOR_DOCTOR, ['validate', '--dir', root, '--json']);
    assert.strictEqual(proc.status, 0, proc.stderr || proc.stdout);
    const payload = JSON.parse(proc.stdout);
    assertContract(payload, VALIDATE_CONTRACT, 'live validate');
    assert.strictEqual(payload.ok, true, JSON.stringify(payload.problems));
    assert.strictEqual(payload.problems.length, 0);
  } finally {
    cleanup(root);
  }
});

test('status --json on healthy state exits 0 and matches the captured status schema', () => {
  const root = createTempDir('mode-doctor-contract-oc-');
  try {
    writeOrchestratorState(root);
    const proc = runCli(ORCHESTRATOR_DOCTOR, ['status', '--dir', root, '--json']);
    assert.strictEqual(proc.status, 0, proc.stderr || proc.stdout);
    assertContract(JSON.parse(proc.stdout), ORCHESTRATOR_STATUS_CONTRACT, 'live status');
  } finally {
    cleanup(root);
  }
});

test('validate --json on the captured integrity scenario exits 2 with E_MISSION_FILE_MISSING', () => {
  const root = createTempDir('mode-doctor-contract-oc-');
  try {
    writeOrchestratorState(root, { missions: {} }); // portfolio references a mission file that does not exist
    const proc = runCli(ORCHESTRATOR_DOCTOR, ['validate', '--dir', root, '--json']);
    assert.strictEqual(proc.status, 2, `expected exit 2, got ${proc.status}: ${proc.stderr || proc.stdout}`);
    const payload = JSON.parse(proc.stdout);
    assertContract(payload, VALIDATE_CONTRACT, 'live validate');
    assert.strictEqual(payload.ok, false);
    for (const problem of payload.problems) {
      assertContract(problem, PROBLEM_CONTRACT, 'live problem entry');
    }
    assert.ok(
      payload.problems.some(p => p.code === 'E_MISSION_FILE_MISSING'),
      `expected E_MISSION_FILE_MISSING among: ${payload.problems.map(p => p.code).join(', ')}`,
    );
  } finally {
    cleanup(root);
  }
});

test('validate against a missing state dir exits 1 with the captured failure text', () => {
  const parent = createTempDir('mode-doctor-contract-oc-empty-');
  try {
    const missing = path.join(parent, 'nope');
    const proc = runCli(ORCHESTRATOR_DOCTOR, ['validate', '--dir', missing, '--json']);
    assert.strictEqual(proc.status, 1, `expected exit 1, got ${proc.status}`);
    const output = (proc.stderr + proc.stdout).trim();
    assert.match(output, ORCHESTRATOR_ABSENT_PATTERN);
  } finally {
    cleanup(parent);
  }
});

console.log('\n=== Test Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}\n`);

if (failed > 0) {
  process.exitCode = 1;
}
