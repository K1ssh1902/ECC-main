'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  ADAPTER_RECORDS,
  COMPLIANCE_STATES,
  MATRIX_BLOCK_END,
  MATRIX_BLOCK_START,
  REQUIRED_FIELDS,
  extractMatrixBlock,
  renderMarkdownTable,
  renderStateTable,
  validateAdapterRecords,
  validateDocumentation,
} = require('../../scripts/lib/harness-adapter-compliance');

const repoRoot = path.resolve(__dirname, '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'harness-adapter-compliance.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    failed++;
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

console.log('\n=== Testing harness adapter compliance docs ===\n');

test('adapter compliance matrix covers the required harness surfaces', () => {
  const source = read('docs/architecture/harness-adapter-compliance.md');
  for (const harness of [
    'Claude Code',
    'Codex',
    'OpenCode',
    'Cursor',
    'Gemini',
    'Zed',
    'dmux',
    'Orca',
    'Superset',
    'Ghast',
    'Terminal-only'
  ]) {
    assert.ok(source.includes(harness), `Expected matrix to include ${harness}`);
  }
});

test('adapter compliance source data validates required evidence fields', () => {
  assert.deepStrictEqual(validateAdapterRecords(), []);

  const zedRecord = ADAPTER_RECORDS.find(record => record.id === 'zed');
  assert.ok(zedRecord, 'Expected Zed adapter record');
  assert.strictEqual(zedRecord.state, 'Adapter-backed');
  assert.ok(
    zedRecord.install_or_onramp.includes('`./install.sh --profile minimal --target zed`'),
    'Expected Zed installer onramp'
  );

  for (const record of ADAPTER_RECORDS) {
    assert.ok(record.install_or_onramp.length > 0, `${record.id} needs an install or onramp`);
    assert.ok(record.verification_commands.length > 0, `${record.id} needs verification commands`);
    assert.ok(record.risk_notes.length > 0, `${record.id} needs risk notes`);
    assert.ok(record.source_docs.length > 0, `${record.id} needs source docs`);
  }
});

test('adapter compliance matrix is generated from source data', () => {
  const source = read('docs/architecture/harness-adapter-compliance.md');
  assert.strictEqual(extractMatrixBlock(source), renderMarkdownTable());
});

test('adapter compliance matrix extraction tolerates Windows line endings', () => {
  const source = read('docs/architecture/harness-adapter-compliance.md')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '\r\n');
  assert.strictEqual(extractMatrixBlock(source), renderMarkdownTable());
});

test('adapter compliance matrix includes the required evidence columns', () => {
  const source = read('docs/architecture/harness-adapter-compliance.md');
  for (const heading of [
    'Supported assets',
    'Unsupported or different surfaces',
    'Install or onramp',
    'Verification command',
    'Risk notes'
  ]) {
    assert.ok(source.includes(heading), `Expected matrix to include ${heading}`);
  }
});

test('scorecard onramp names the local verification commands', () => {
  const source = read('docs/architecture/harness-adapter-compliance.md');
  for (const command of [
    'npm run harness:adapters -- --check',
    'npm run harness:audit -- --format json',
    'npm run observability:ready',
    'node scripts/session-inspect.js --list-adapters',
    'node scripts/loop-status.js --json --write-dir .ecc/loop-status'
  ]) {
    assert.ok(source.includes(command), `Expected onramp to include ${command}`);
  }
});

test('adapter compliance CLI check passes against the committed doc', () => {
  const output = execFileSync('node', [scriptPath, '--check'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.ok(output.includes('Harness Adapter Compliance: PASS'));
  assert.ok(output.includes(`Adapters: ${ADAPTER_RECORDS.length}`));
});

test('adapter compliance CLI emits machine-readable scorecard data', () => {
  const output = execFileSync('node', [scriptPath, '--format=json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const parsed = JSON.parse(output);

  assert.strictEqual(parsed.schema_version, 'ecc.harness-adapter-compliance.v1');
  assert.strictEqual(parsed.valid, true);
  assert.strictEqual(parsed.adapter_count, ADAPTER_RECORDS.length);
  assert.ok(parsed.adapters.some(record => record.id === 'terminal-only'));
});

test('cross-harness architecture links to the adapter compliance matrix', () => {
  const source = read('docs/architecture/cross-harness.md');
  assert.ok(source.includes('harness-adapter-compliance.md'));
});

test('GA roadmap records the matrix and validator as current evidence', () => {
  const source = read('docs/ECC-2.0-GA-ROADMAP.md');
  assert.ok(source.includes('docs/architecture/harness-adapter-compliance.md'));
  assert.ok(source.includes('npm run harness:adapters -- --check'));
  assert.ok(source.includes('scripts/lib/harness-adapter-compliance.js'));
});

test('COMPLIANCE_STATES exposes exactly the four documented states, frozen', () => {
  assert.deepStrictEqual(Object.keys(COMPLIANCE_STATES), [
    'Native',
    'Adapter-backed',
    'Instruction-backed',
    'Reference-only',
  ]);
  assert.ok(Object.isFrozen(COMPLIANCE_STATES));
  assert.strictEqual(
    COMPLIANCE_STATES.Native,
    'ECC can install or verify the surface directly for this harness.'
  );
});

test('MATRIX_BLOCK_START and MATRIX_BLOCK_END are HTML comment markers', () => {
  assert.strictEqual(MATRIX_BLOCK_START, '<!-- harness-adapter-compliance:matrix-start -->');
  assert.strictEqual(MATRIX_BLOCK_END, '<!-- harness-adapter-compliance:matrix-end -->');
});

test('REQUIRED_FIELDS lists the eleven evidence fields in declaration order, frozen', () => {
  assert.deepStrictEqual(REQUIRED_FIELDS, [
    'id',
    'harness',
    'state',
    'supported_assets',
    'unsupported_surfaces',
    'install_or_onramp',
    'verification_commands',
    'risk_notes',
    'last_verified_at',
    'owner',
    'source_docs',
  ]);
  assert.ok(Object.isFrozen(REQUIRED_FIELDS));
});

test('renderStateTable renders a markdown table with a row per compliance state', () => {
  const table = renderStateTable();
  const lines = table.split('\n');

  assert.strictEqual(lines[0], '| State | Meaning |');
  assert.strictEqual(lines[1], '| --- | --- |');
  assert.strictEqual(lines.length, 2 + Object.keys(COMPLIANCE_STATES).length);

  for (const state of Object.keys(COMPLIANCE_STATES)) {
    assert.ok(
      lines.some(line => line.startsWith(`| ${state} |`)),
      `Expected a row for state ${state}`
    );
  }
});

test('renderStateTable takes no arguments — it always renders from COMPLIANCE_STATES', () => {
  // renderStateTable() ignores any arguments; it is not parameterized like
  // renderMarkdownTable(records). Passing a synthetic record set has no effect.
  const withoutArgs = renderStateTable();
  const withIgnoredArg = renderStateTable([{ id: 'synthetic' }]);
  assert.strictEqual(withIgnoredArg, withoutArgs);
});

test('validateDocumentation returns an empty array for the committed doc (green path)', () => {
  assert.deepStrictEqual(validateDocumentation(), []);
});

test('validateDocumentation accepts explicit repoRoot/docPath overrides for the same green doc', () => {
  const docPath = path.join(repoRoot, 'docs', 'architecture', 'harness-adapter-compliance.md');
  assert.deepStrictEqual(validateDocumentation({ repoRoot, docPath }), []);
});

test('validateDocumentation reports missing matrix block markers', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hac-test-'));
  try {
    const docPath = path.join(tmpDir, 'no-markers.md');
    fs.writeFileSync(docPath, '# Doc\nSome content with no markers at all.\n');

    const errors = validateDocumentation({ repoRoot: tmpDir, docPath });
    assert.strictEqual(errors.length, 1);
    assert.ok(errors[0].includes('missing matrix block markers'));
    assert.ok(errors[0].includes('no-markers.md'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('validateDocumentation reports a stale matrix block that no longer matches source data', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hac-test-'));
  try {
    const docPath = path.join(tmpDir, 'stale.md');
    fs.writeFileSync(docPath, [
      '# Doc',
      MATRIX_BLOCK_START,
      '| stale | table |',
      '| --- | --- |',
      MATRIX_BLOCK_END,
      '',
    ].join('\n'));

    const errors = validateDocumentation({ repoRoot: tmpDir, docPath });
    assert.strictEqual(errors.length, 1);
    assert.ok(errors[0].includes('is not generated from adapter records'));
    assert.ok(errors[0].includes('stale.md'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('validateDocumentation treats an end-marker-before-start-marker doc as missing markers', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hac-test-'));
  try {
    const docPath = path.join(tmpDir, 'malformed.md');
    fs.writeFileSync(docPath, [MATRIX_BLOCK_END, 'content', MATRIX_BLOCK_START].join('\n'));

    const errors = validateDocumentation({ repoRoot: tmpDir, docPath });
    assert.strictEqual(errors.length, 1);
    assert.ok(errors[0].includes('missing matrix block markers'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('validateDocumentation returns no errors for a synthetic doc whose block matches renderMarkdownTable()', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hac-test-'));
  try {
    const docPath = path.join(tmpDir, 'good.md');
    fs.writeFileSync(docPath, [
      '# Doc',
      MATRIX_BLOCK_START,
      renderMarkdownTable(),
      MATRIX_BLOCK_END,
      '',
    ].join('\n'));

    assert.deepStrictEqual(validateDocumentation({ repoRoot: tmpDir, docPath }), []);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('validateDocumentation throws ENOENT when the doc file does not exist', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hac-test-'));
  try {
    assert.throws(
      () => validateDocumentation({ repoRoot: tmpDir, docPath: path.join(tmpDir, 'nope.md') }),
      err => err.code === 'ENOENT'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

if (failed > 0) {
  console.log(`\nFailed: ${failed}`);
  process.exit(1);
}

console.log(`\nPassed: ${passed}`);
