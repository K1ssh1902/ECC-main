/**
 * Tests for scripts/lib/shell-substitution.js
 *
 * Run with: node tests/lib/shell-substitution.test.js
 *
 * shell-substitution.js is a pure shell-string parser consumed by two
 * PreToolUse security hooks:
 *   - scripts/hooks/pre-bash-dev-server-block.js (extractCommandSubstitutions,
 *     extractSubshellGroups) — expands `$(npm run dev)` / `(npm run dev)`
 *     wrappers so the dev-server blocker sees the real leading command.
 *   - scripts/hooks/gateguard-fact-force.js (all three exports, via
 *     collectExecutableBodies) — expands `$(...)`, backticks, `(...)`, and
 *     `{ ...; }` bodies so the destructive-command gate cannot be dodged by
 *     hiding `rm -rf` / `git reset --hard` inside a substitution or group.
 *
 * These tests are characterization tests: every expected value below was
 * obtained by running the module directly (not guessed from reading the
 * source), because this module guards security-sensitive hooks and the
 * only trustworthy spec is its observed behavior.
 */

const assert = require('assert');
const {
  extractCommandSubstitutions,
  extractSubshellGroups,
  extractBraceGroups
} = require('../../scripts/lib/shell-substitution');

// Test helper — mirrors tests/lib/utils.test.js's harness shape.
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
  console.log('\n=== Testing shell-substitution.js ===\n');

  let passed = 0;
  let failed = 0;

  // ── extractCommandSubstitutions: common cases ──
  console.log('extractCommandSubstitutions (common cases):');

  if (test('returns [] for empty string', () => {
    assert.deepStrictEqual(extractCommandSubstitutions(''), []);
  })) passed++; else failed++;

  if (test('returns [] when no backtick or $(...) is present', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo hi'), []);
  })) passed++; else failed++;

  if (test('extracts a backtick substitution body', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo `date`'), ['date']);
  })) passed++; else failed++;

  if (test('extracts a $(...) substitution body', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo $(date)'), ['date']);
  })) passed++; else failed++;

  if (test('recurses into nested $(...) and returns outer then inner body', () => {
    assert.deepStrictEqual(
      extractCommandSubstitutions('echo $(echo $(date))'),
      ['echo $(date)', 'date']
    );
  })) passed++; else failed++;

  if (test('recurses through a double-quoted nested $(...) inside $(...)', () => {
    assert.deepStrictEqual(
      extractCommandSubstitutions('echo $(foo "$(bar)")'),
      ['foo "$(bar)"', 'bar']
    );
  })) passed++; else failed++;

  if (test('recurses through a nested backtick substitution inside $(...)', () => {
    assert.deepStrictEqual(
      extractCommandSubstitutions('echo $(foo `bar`)'),
      ['foo `bar`', 'bar']
    );
  })) passed++; else failed++;

  // ── extractCommandSubstitutions: quoting semantics ──
  console.log('\nextractCommandSubstitutions (quoting semantics):');

  if (test('single-quoted $(...) is literal and ignored', () => {
    assert.deepStrictEqual(extractCommandSubstitutions("echo '$(date)'"), []);
  })) passed++; else failed++;

  if (test('single-quoted $(...) and backtick together are both ignored', () => {
    assert.deepStrictEqual(extractCommandSubstitutions("echo '$(date) `date`'"), []);
  })) passed++; else failed++;

  if (test('double-quoted $(...) is still extracted (bash allows substitution in double quotes)', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo "$(date)"'), ['date']);
  })) passed++; else failed++;

  if (test('apostrophe inside a double-quoted string does not break $(...) extraction', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo "it\'s $(date)"'), ['date']);
  })) passed++; else failed++;

  if (test('${...} parameter expansion is not treated as a command substitution', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo ${HOME}'), []);
    assert.deepStrictEqual(extractCommandSubstitutions('echo ${HOME}/$(date)'), ['date']);
  })) passed++; else failed++;

  // ── extractCommandSubstitutions: escapes and malformed input ──
  console.log('\nextractCommandSubstitutions (escapes and malformed input):');

  if (test('escaped backticks outside quotes produce no substitution', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo \\`not a sub\\`'), []);
  })) passed++; else failed++;

  if (test('an escaped nested backtick is kept literal in the body and not re-expanded', () => {
    // Real bash nesting requires escaping the inner backtick pair; the escaped
    // pair is preserved verbatim in the extracted body and the recursive scan
    // of that body finds no further substitution (both backticks are escaped).
    assert.deepStrictEqual(
      extractCommandSubstitutions('echo `echo \\`date\\``'),
      ['echo \\`date\\`']
    );
  })) passed++; else failed++;

  if (test('unterminated $(...) still extracts to end of string', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo $(date'), ['date']);
  })) passed++; else failed++;

  if (test('unterminated backtick still extracts to end of string', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo `date'), ['date']);
  })) passed++; else failed++;

  if (test('empty $() and empty backtick pair produce no entries', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo $()'), []);
    assert.deepStrictEqual(extractCommandSubstitutions('echo ``'), []);
  })) passed++; else failed++;

  if (test('a dangling $( or backtick at end of string (empty body) produces no entries', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo $('), []);
    assert.deepStrictEqual(extractCommandSubstitutions('echo `'), []);
  })) passed++; else failed++;

  // ── extractCommandSubstitutions: hostile / adversarial input ──
  console.log('\nextractCommandSubstitutions (hostile input & consumer call patterns):');

  if (test('a destructive rm -rf hidden inside $(...) is extracted verbatim', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo $(rm -rf /tmp)'), ['rm -rf /tmp']);
  })) passed++; else failed++;

  if (test('a destructive rm -rf hidden inside backticks is extracted verbatim', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo `rm -rf /tmp`'), ['rm -rf /tmp']);
  })) passed++; else failed++;

  if (test('a dev-server command wrapped in $(...) is extracted (pre-bash-dev-server-block.js pattern)', () => {
    assert.deepStrictEqual(extractCommandSubstitutions('echo $(npm run dev)'), ['npm run dev']);
  })) passed++; else failed++;

  if (test('an extremely long substitution body is extracted in full without truncation', () => {
    const longBody = 'x'.repeat(5000);
    const result = extractCommandSubstitutions(`echo $(${longBody})`);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], longBody);
  })) passed++; else failed++;

  if (test('non-string inputs (null, number) coerce to empty array without throwing', () => {
    assert.deepStrictEqual(extractCommandSubstitutions(null), []);
    assert.deepStrictEqual(extractCommandSubstitutions(123), []);
  })) passed++; else failed++;

  // ── extractSubshellGroups: common cases ──
  console.log('\nextractSubshellGroups (common cases):');

  if (test('returns [] for empty string', () => {
    assert.deepStrictEqual(extractSubshellGroups(''), []);
  })) passed++; else failed++;

  if (test('returns [] when no parens are present', () => {
    assert.deepStrictEqual(extractSubshellGroups('npm run dev'), []);
  })) passed++; else failed++;

  if (test('extracts a simple (...) group body', () => {
    assert.deepStrictEqual(extractSubshellGroups('(npm run dev)'), ['npm run dev']);
  })) passed++; else failed++;

  if (test('recurses into a nested (...) group and returns outer then inner body', () => {
    assert.deepStrictEqual(
      extractSubshellGroups('(echo (npm run dev))'),
      ['echo (npm run dev)', 'npm run dev']
    );
  })) passed++; else failed++;

  if (test('a group appearing after a ; segment separator is still found', () => {
    assert.deepStrictEqual(extractSubshellGroups('echo hi; (npm run dev)'), ['npm run dev']);
  })) passed++; else failed++;

  if (test('a compound command inside the group is preserved verbatim', () => {
    assert.deepStrictEqual(
      extractSubshellGroups('(cd /app && npm run dev)'),
      ['cd /app && npm run dev']
    );
  })) passed++; else failed++;

  // ── extractSubshellGroups: quoting semantics ──
  console.log('\nextractSubshellGroups (quoting semantics):');

  if (test('single-quoted (...) is literal and ignored', () => {
    assert.deepStrictEqual(extractSubshellGroups("echo '(npm run dev)'"), []);
  })) passed++; else failed++;

  if (test('double-quoted (...) is literal and ignored (parens have no meaning in double quotes)', () => {
    assert.deepStrictEqual(extractSubshellGroups('echo "(npm run dev)"'), []);
    assert.deepStrictEqual(extractSubshellGroups('echo "it\'s (x)"'), []);
  })) passed++; else failed++;

  if (test('an unterminated double quote inside a group consumes the closing paren', () => {
    // Characterization: once bodyInDouble flips true, ')' no longer decrements
    // depth, so the group runs to end of string with the stray quote intact.
    assert.deepStrictEqual(extractSubshellGroups('(foo "bar)'), ['foo "bar)']);
  })) passed++; else failed++;

  // ── extractSubshellGroups: cross-syntax non-interference ──
  console.log('\nextractSubshellGroups (cross-syntax non-interference):');

  if (test('a $(...) inside a group is kept as literal text, not separately descended into', () => {
    assert.deepStrictEqual(
      extractSubshellGroups('(echo $(rm -rf /tmp))'),
      ['echo $(rm -rf /tmp)']
    );
  })) passed++; else failed++;

  if (test('a backtick substitution inside a group is kept as literal text, not separately descended into', () => {
    assert.deepStrictEqual(
      extractSubshellGroups('(echo `rm -rf /tmp`)'),
      ['echo `rm -rf /tmp`']
    );
  })) passed++; else failed++;

  // ── extractSubshellGroups: malformed / hostile input ──
  console.log('\nextractSubshellGroups (hostile input & consumer call patterns):');

  if (test('unterminated group runs to end of string', () => {
    assert.deepStrictEqual(extractSubshellGroups('(npm run dev'), ['npm run dev']);
  })) passed++; else failed++;

  if (test('an empty group produces no entries', () => {
    assert.deepStrictEqual(extractSubshellGroups('()'), []);
  })) passed++; else failed++;

  if (test('a destructive rm -rf inside a subshell group is extracted verbatim (gateguard-fact-force.js pattern)', () => {
    assert.deepStrictEqual(extractSubshellGroups('(rm -rf /tmp)'), ['rm -rf /tmp']);
  })) passed++; else failed++;

  if (test('an extremely long group body is extracted in full without truncation', () => {
    const longBody = 'x'.repeat(5000);
    const result = extractSubshellGroups(`(${longBody})`);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], longBody);
  })) passed++; else failed++;

  if (test('non-string inputs (null, number) coerce to empty array without throwing', () => {
    assert.deepStrictEqual(extractSubshellGroups(null), []);
    assert.deepStrictEqual(extractSubshellGroups(123), []);
  })) passed++; else failed++;

  // ── extractBraceGroups: common cases ──
  console.log('\nextractBraceGroups (common cases):');

  if (test('returns [] for empty string', () => {
    assert.deepStrictEqual(extractBraceGroups(''), []);
  })) passed++; else failed++;

  if (test('returns [] when no braces are present', () => {
    assert.deepStrictEqual(extractBraceGroups('npm run dev'), []);
  })) passed++; else failed++;

  if (test('extracts a simple { ...; } group, preserving surrounding whitespace', () => {
    assert.deepStrictEqual(extractBraceGroups('{ npm run dev; }'), [' npm run dev; ']);
  })) passed++; else failed++;

  if (test('recurses into a nested brace group and returns outer then inner body', () => {
    assert.deepStrictEqual(
      extractBraceGroups('{ echo hi; { rm -rf /tmp; }; }'),
      [' echo hi; { rm -rf /tmp; }; ', ' rm -rf /tmp; ']
    );
  })) passed++; else failed++;

  // ── extractBraceGroups: reserved-word boundary rules ──
  console.log('\nextractBraceGroups (reserved-word boundary rules):');

  if (test('{ not followed by whitespace is not a group opener (single token, not a brace group)', () => {
    assert.deepStrictEqual(extractBraceGroups('{npm run dev}'), []);
  })) passed++; else failed++;

  if (test('{ not preceded by a boundary character is not a group opener', () => {
    assert.deepStrictEqual(extractBraceGroups('foo{ bar; }'), []);
  })) passed++; else failed++;

  if (test('{ preceded by ; | or & (a shell operator) IS a valid group opener', () => {
    assert.deepStrictEqual(extractBraceGroups('; { npm run dev; }'), [' npm run dev; ']);
    assert.deepStrictEqual(extractBraceGroups('| { npm run dev; }'), [' npm run dev; ']);
    assert.deepStrictEqual(extractBraceGroups('& { npm run dev; }'), [' npm run dev; ']);
  })) passed++; else failed++;

  if (test('a } not preceded by ; or whitespace does not close the group', () => {
    assert.deepStrictEqual(extractBraceGroups('{ foo}bar; }'), [' foo}bar; ']);
  })) passed++; else failed++;

  // ── extractBraceGroups: quoting and cross-syntax non-interference ──
  console.log('\nextractBraceGroups (quoting and cross-syntax non-interference):');

  if (test('single-quoted brace text is literal and ignored', () => {
    assert.deepStrictEqual(extractBraceGroups("echo '{ rm -rf /tmp; }'"), []);
  })) passed++; else failed++;

  if (test('a } embedded inside a $(...) body does not prematurely close the outer group', () => {
    // Hostile input: an attacker-controlled substitution body containing a
    // stray '}' must not truncate the fact-forcing gate's brace-group scan.
    assert.deepStrictEqual(
      extractBraceGroups('{ x=$(echo }); npm run dev; }'),
      [' x=$(echo }); npm run dev; ']
    );
  })) passed++; else failed++;

  if (test('a bare (...) subshell at the top level is not descended into by extractBraceGroups', () => {
    // Cross-syntax discovery is the consuming hook's job (collectExecutableBodies
    // BFS over all three extractors), not any single extractor's.
    assert.deepStrictEqual(extractBraceGroups('( { npm run dev; } )'), []);
  })) passed++; else failed++;

  // ── extractBraceGroups: malformed / hostile input ──
  console.log('\nextractBraceGroups (hostile input & consumer call patterns):');

  if (test('unterminated brace group runs to end of string', () => {
    assert.deepStrictEqual(extractBraceGroups('{ unterminated; '), [' unterminated; ']);
  })) passed++; else failed++;

  if (test('a lone { with nothing following it produces no entries', () => {
    assert.deepStrictEqual(extractBraceGroups('{'), []);
  })) passed++; else failed++;

  if (test('a destructive rm -rf inside a brace group is extracted verbatim (gateguard-fact-force.js pattern)', () => {
    assert.deepStrictEqual(extractBraceGroups('{ rm -rf /tmp; }'), [' rm -rf /tmp; ']);
  })) passed++; else failed++;

  if (test('non-string inputs (null, number) coerce to empty array without throwing', () => {
    assert.deepStrictEqual(extractBraceGroups(null), []);
    assert.deepStrictEqual(extractBraceGroups(123), []);
  })) passed++; else failed++;

  // ── Module shape ──
  console.log('\nModule shape:');

  if (test('exports exactly the three documented functions', () => {
    assert.deepStrictEqual(
      Object.keys(require('../../scripts/lib/shell-substitution')).sort(),
      ['extractBraceGroups', 'extractCommandSubstitutions', 'extractSubshellGroups']
    );
    assert.strictEqual(typeof extractCommandSubstitutions, 'function');
    assert.strictEqual(typeof extractSubshellGroups, 'function');
    assert.strictEqual(typeof extractBraceGroups, 'function');
  })) passed++; else failed++;

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
