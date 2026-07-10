/**
 * Tests for scripts/lib/cursor-agent-names.js
 *
 * Run with: node tests/lib/cursor-agent-names.test.js
 */

const assert = require('assert');
const path = require('path');

const {
  toCursorAgentFileName,
  toCursorAgentRelativePath,
} = require('../../scripts/lib/cursor-agent-names');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

function runTests() {
  console.log('\n=== Testing cursor-agent-names.js ===\n');

  let passed = 0;
  let failed = 0;

  console.log('toCursorAgentFileName:');

  if (test('prefixes a plain file name with ecc-', () => {
    assert.strictEqual(toCursorAgentFileName('agent.md'), 'ecc-agent.md');
  })) passed++; else failed++;

  if (test('leaves a name already prefixed with ecc- unchanged', () => {
    assert.strictEqual(toCursorAgentFileName('ecc-agent.md'), 'ecc-agent.md');
  })) passed++; else failed++;

  if (test('the ecc- prefix check is case-sensitive (ECC- is not treated as already prefixed)', () => {
    assert.strictEqual(toCursorAgentFileName('ECC-agent.md'), 'ecc-ECC-agent.md');
  })) passed++; else failed++;

  if (test('does not sanitize spaces, case, or special characters — only prefixes', () => {
    assert.strictEqual(toCursorAgentFileName('My Agent.md'), 'ecc-My Agent.md');
    assert.strictEqual(toCursorAgentFileName('weird!@#.md'), 'ecc-weird!@#.md');
    assert.strictEqual(toCursorAgentFileName('a b.md'), 'ecc-a b.md');
  })) passed++; else failed++;

  if (test('preserves the file extension as part of the untouched suffix', () => {
    assert.strictEqual(toCursorAgentFileName('planner.md'), 'ecc-planner.md');
    assert.strictEqual(toCursorAgentFileName('planner.yaml'), 'ecc-planner.yaml');
    assert.strictEqual(toCursorAgentFileName('noextension'), 'ecc-noextension');
  })) passed++; else failed++;

  if (test('treats the bare literal "ecc-" as already prefixed (startsWith match)', () => {
    assert.strictEqual(toCursorAgentFileName('ecc-'), 'ecc-');
  })) passed++; else failed++;

  if (test('returns falsy input unchanged (no prefix applied)', () => {
    assert.strictEqual(toCursorAgentFileName(''), '');
    assert.strictEqual(toCursorAgentFileName(null), null);
    assert.strictEqual(toCursorAgentFileName(undefined), undefined);
  })) passed++; else failed++;

  console.log('\ntoCursorAgentRelativePath:');

  if (test('prefixes only the final path segment, preserving directory segments', () => {
    const result = toCursorAgentRelativePath('agents/foo.md');
    assert.strictEqual(result, path.join('agents', 'ecc-foo.md'));
  })) passed++; else failed++;

  if (test('handles a bare file name with no directory segments', () => {
    assert.strictEqual(toCursorAgentRelativePath('foo.md'), 'ecc-foo.md');
  })) passed++; else failed++;

  if (test('normalizes native backslash separators to the platform separator via path.join', () => {
    const backslashPath = ['agents', 'foo.md'].join(String.fromCharCode(92));
    const result = toCursorAgentRelativePath(backslashPath);
    assert.strictEqual(result, path.join('agents', 'ecc-foo.md'));
  })) passed++; else failed++;

  if (test('normalizes mixed forward and backslash separators', () => {
    const mixedPath = 'a/b' + String.fromCharCode(92) + 'c.md';
    const result = toCursorAgentRelativePath(mixedPath);
    assert.strictEqual(result, path.join('a', 'b', 'ecc-c.md'));
  })) passed++; else failed++;

  if (test('collapses consecutive/duplicate separators when splitting segments', () => {
    const result = toCursorAgentRelativePath('a//b/foo.md');
    assert.strictEqual(result, path.join('a', 'b', 'ecc-foo.md'));
  })) passed++; else failed++;

  if (test('drops a leading separator (no empty leading segment)', () => {
    const result = toCursorAgentRelativePath('/leading/slash/foo.md');
    assert.strictEqual(result, path.join('leading', 'slash', 'ecc-foo.md'));
  })) passed++; else failed++;

  if (test('treats a trailing separator segment as absent — last real segment gets prefixed', () => {
    const result = toCursorAgentRelativePath('trailing/slash/');
    assert.strictEqual(result, path.join('trailing', 'ecc-slash'));
  })) passed++; else failed++;

  if (test('preserves nested directories three levels deep', () => {
    const result = toCursorAgentRelativePath('a/b/c/ecc-foo.md');
    // Already-prefixed file name is left untouched by toCursorAgentFileName.
    assert.strictEqual(result, path.join('a', 'b', 'c', 'ecc-foo.md'));
  })) passed++; else failed++;

  if (test('returns falsy/empty input unchanged (no segments to prefix)', () => {
    assert.strictEqual(toCursorAgentRelativePath(''), '');
    assert.strictEqual(toCursorAgentRelativePath(null), null);
    assert.strictEqual(toCursorAgentRelativePath(undefined), undefined);
  })) passed++; else failed++;

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
