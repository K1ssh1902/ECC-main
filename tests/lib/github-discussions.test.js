/**
 * Tests for scripts/lib/github-discussions.js
 *
 * Run with: node tests/lib/github-discussions.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const gh = require('../../scripts/lib/github-discussions');

// Test helper (mirrors tests/lib/utils.test.js idiom)
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

// gh shim helpers (mirrors tests/scripts/discussion-audit.test.js idiom)
function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function discussionGhKey(owner, name, first = 100) {
  return `api graphql -f owner=${owner} -f name=${name} -F first=${first} -f query=${gh.DISCUSSION_QUERY}`;
}

function discussionEnabledGhKey(owner, name) {
  return `api graphql -f owner=${owner} -f name=${name} -f query=${gh.DISCUSSION_ENABLED_QUERY}`;
}

function writeGhShim(rootDir, responses) {
  const shimPath = path.join(rootDir, 'gh-shim.js');
  fs.writeFileSync(shimPath, `
const responses = ${JSON.stringify(responses)};
const args = process.argv.slice(2);
const key = args.join(' ');
if (process.env.GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN should be unset by default');
  process.exit(42);
}
if (!Object.prototype.hasOwnProperty.call(responses, key)) {
  console.error('Unexpected gh args: ' + key);
  process.exit(3);
}
process.stdout.write(JSON.stringify(responses[key]));
`);
  return shimPath;
}

// Run fetchDiscussionSummary in a subprocess so ECC_GH_SHIM/env changes never
// leak into this test process or interfere with parallel test runs.
function fetchViaShim(repo, options, shimPath, extraEnv = {}) {
  const script = `
    const gh = require(${JSON.stringify(path.join(__dirname, '..', '..', 'scripts', 'lib', 'github-discussions'))});
    try {
      const result = gh.fetchDiscussionSummary(${JSON.stringify(repo)}, ${JSON.stringify(options)});
      process.stdout.write(JSON.stringify({ ok: true, result }));
    } catch (error) {
      process.stdout.write(JSON.stringify({ ok: false, message: error.message }));
    }
  `;
  const env = { ...process.env, ECC_GH_SHIM: shimPath, ...extraEnv };
  const stdout = execFileSync('node', ['-e', script], {
    encoding: 'utf8',
    timeout: 10000,
    env
  });
  return JSON.parse(stdout);
}

function runTests() {
  console.log('\n=== Testing github-discussions.js ===\n');

  let passed = 0;
  let failed = 0;

  // ── Constants ──
  console.log('Constants:');

  if (test('DEFAULT_DISCUSSION_FIRST is 100', () => {
    assert.strictEqual(gh.DEFAULT_DISCUSSION_FIRST, 100);
  })) passed++; else failed++;

  if (test('MAINTAINER_ASSOCIATIONS is a Set with exactly OWNER/MEMBER/COLLABORATOR', () => {
    assert.ok(gh.MAINTAINER_ASSOCIATIONS instanceof Set);
    assert.strictEqual(gh.MAINTAINER_ASSOCIATIONS.size, 3);
    assert.strictEqual(gh.MAINTAINER_ASSOCIATIONS.has('OWNER'), true);
    assert.strictEqual(gh.MAINTAINER_ASSOCIATIONS.has('MEMBER'), true);
    assert.strictEqual(gh.MAINTAINER_ASSOCIATIONS.has('COLLABORATOR'), true);
  })) passed++; else failed++;

  if (test('DISCUSSION_ENABLED_QUERY is a non-empty string containing hasDiscussionsEnabled', () => {
    assert.strictEqual(typeof gh.DISCUSSION_ENABLED_QUERY, 'string');
    assert.ok(gh.DISCUSSION_ENABLED_QUERY.length > 0);
    assert.ok(gh.DISCUSSION_ENABLED_QUERY.includes('hasDiscussionsEnabled'));
  })) passed++; else failed++;

  if (test('DISCUSSION_QUERY is a non-empty string containing hasDiscussionsEnabled', () => {
    assert.strictEqual(typeof gh.DISCUSSION_QUERY, 'string');
    assert.ok(gh.DISCUSSION_QUERY.length > 0);
    assert.ok(gh.DISCUSSION_QUERY.includes('hasDiscussionsEnabled'));
  })) passed++; else failed++;

  // ── splitRepo ──
  console.log('\nsplitRepo:');

  if (test('splits a valid "owner/name" string', () => {
    assert.deepStrictEqual(gh.splitRepo('owner/name'), { owner: 'owner', name: 'name' });
  })) passed++; else failed++;

  if (test('throws on missing slash', () => {
    assert.throws(() => gh.splitRepo('ownername'), /Invalid repo: ownername/);
  })) passed++; else failed++;

  if (test('throws on empty string', () => {
    assert.throws(() => gh.splitRepo(''), /Invalid repo: /);
  })) passed++; else failed++;

  if (test('throws on null', () => {
    assert.throws(() => gh.splitRepo(null), /Invalid repo: null/);
  })) passed++; else failed++;

  if (test('throws on undefined', () => {
    assert.throws(() => gh.splitRepo(undefined), /Invalid repo: undefined/);
  })) passed++; else failed++;

  if (test('throws on "owner/" (empty name)', () => {
    assert.throws(() => gh.splitRepo('owner/'), /Invalid repo: owner\//);
  })) passed++; else failed++;

  if (test('throws on "/name" (empty owner)', () => {
    assert.throws(() => gh.splitRepo('/name'), /Invalid repo: \/name/);
  })) passed++; else failed++;

  if (test('CHARACTERIZATION: extra path segments are silently dropped ("a/b/c" -> owner "a", name "b")', () => {
    // split('/') on 'a/b/c' yields ['a','b','c']; destructuring only takes the
    // first two, so the third segment is discarded rather than causing a throw.
    assert.deepStrictEqual(gh.splitRepo('a/b/c'), { owner: 'a', name: 'b' });
  })) passed++; else failed++;

  // ── discussionNeedsMaintainerTouch ──
  console.log('\ndiscussionNeedsMaintainerTouch:');

  if (test('returns false when author is OWNER', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'OWNER',
      comments: { nodes: [] }
    }), false);
  })) passed++; else failed++;

  if (test('returns false when author is MEMBER', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'MEMBER',
      comments: { nodes: [] }
    }), false);
  })) passed++; else failed++;

  if (test('returns false when author is COLLABORATOR', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'COLLABORATOR',
      comments: { nodes: [] }
    }), false);
  })) passed++; else failed++;

  if (test('returns false when the accepted answer is maintainer-authored', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'NONE',
      answer: { authorAssociation: 'OWNER' },
      comments: { nodes: [] }
    }), false);
  })) passed++; else failed++;

  if (test('returns false when a maintainer comment is present', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'NONE',
      comments: { nodes: [{ authorAssociation: 'CONTRIBUTOR' }, { authorAssociation: 'MEMBER' }] }
    }), false);
  })) passed++; else failed++;

  if (test('returns true when author, answer, and comments are all non-maintainer', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'NONE',
      answer: { authorAssociation: 'CONTRIBUTOR' },
      comments: { nodes: [{ authorAssociation: 'NONE' }] }
    }), true);
  })) passed++; else failed++;

  if (test('returns true when comments field is missing entirely', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'NONE'
    }), true);
  })) passed++; else failed++;

  if (test('returns true when comments.nodes is null/None', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'NONE',
      comments: { nodes: null }
    }), true);
  })) passed++; else failed++;

  if (test('returns true when comments is present but comments.nodes is missing', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'NONE',
      comments: {}
    }), true);
  })) passed++; else failed++;

  if (test('returns true when comments array is empty', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'NONE',
      comments: { nodes: [] }
    }), true);
  })) passed++; else failed++;

  if (test('CHARACTERIZATION: lowercase "owner" association does NOT count as maintainer (case-sensitive Set lookup)', () => {
    assert.strictEqual(gh.discussionNeedsMaintainerTouch({
      authorAssociation: 'owner',
      comments: { nodes: [] }
    }), true);
  })) passed++; else failed++;

  // ── discussionNeedsAcceptedAnswer ──
  console.log('\ndiscussionNeedsAcceptedAnswer:');

  if (test('returns true for an answerable category without an answer', () => {
    assert.strictEqual(gh.discussionNeedsAcceptedAnswer({
      category: { name: 'Q&A', isAnswerable: true },
      answer: null
    }), true);
  })) passed++; else failed++;

  if (test('returns false for an answerable category with an answer', () => {
    assert.strictEqual(gh.discussionNeedsAcceptedAnswer({
      category: { name: 'Q&A', isAnswerable: true },
      answer: { url: 'https://example.com/answer' }
    }), false);
  })) passed++; else failed++;

  if (test('returns false for a non-answerable category (even without an answer)', () => {
    assert.strictEqual(gh.discussionNeedsAcceptedAnswer({
      category: { name: 'General', isAnswerable: false },
      answer: null
    }), false);
  })) passed++; else failed++;

  if (test('returns false when category is null', () => {
    assert.strictEqual(gh.discussionNeedsAcceptedAnswer({
      category: null,
      answer: null
    }), false);
  })) passed++; else failed++;

  if (test('returns false when category is missing entirely', () => {
    assert.strictEqual(gh.discussionNeedsAcceptedAnswer({ answer: null }), false);
  })) passed++; else failed++;

  if (test('CHARACTERIZATION: returns false (does not throw) for a null discussion', () => {
    // discussion && discussion.category short-circuits before touching .category
    // on null, so this resolves to false rather than throwing.
    assert.strictEqual(gh.discussionNeedsAcceptedAnswer(null), false);
  })) passed++; else failed++;

  // ── summarizeDiscussion ──
  console.log('\nsummarizeDiscussion:');

  if (test('maps the full discussion object shape', () => {
    const summary = gh.summarizeDiscussion({
      number: 42,
      title: 'Example title',
      url: 'https://github.com/example/discussions/42',
      updatedAt: '2026-01-01T00:00:00Z',
      category: { name: 'Q&A', isAnswerable: true },
      authorAssociation: 'NONE',
      answer: null,
      comments: { nodes: [] }
    });
    assert.deepStrictEqual(summary, {
      number: 42,
      title: 'Example title',
      url: 'https://github.com/example/discussions/42',
      updatedAt: '2026-01-01T00:00:00Z',
      category: 'Q&A'
    });
  })) passed++; else failed++;

  if (test('category is null when discussion.category is null', () => {
    const summary = gh.summarizeDiscussion({
      number: 7,
      title: 'No category',
      url: 'https://github.com/example/discussions/7',
      updatedAt: '2026-01-02T00:00:00Z',
      category: null
    });
    assert.strictEqual(summary.category, null);
  })) passed++; else failed++;

  // ── emptyDiscussionSummary ──
  console.log('\nemptyDiscussionSummary:');

  if (test('returns the exact empty summary shape', () => {
    assert.deepStrictEqual(gh.emptyDiscussionSummary(), {
      enabled: false,
      totalCount: 0,
      sampledCount: 0,
      needingMaintainerTouch: [],
      answerableWithoutAcceptedAnswer: []
    });
  })) passed++; else failed++;

  if (test('returns a fresh object/array set on each call (no shared references)', () => {
    const first = gh.emptyDiscussionSummary();
    const second = gh.emptyDiscussionSummary();
    assert.notStrictEqual(first, second);
    assert.notStrictEqual(first.needingMaintainerTouch, second.needingMaintainerTouch);
  })) passed++; else failed++;

  // ── fetchDiscussionSummary (via ECC_GH_SHIM) ──
  console.log('\nfetchDiscussionSummary (via ECC_GH_SHIM):');

  if (test('invalid repo string throws before any shell-out', () => {
    // No shim configured at all — if this reached runGhJson it would fail to
    // spawn `gh`. splitRepo must throw first.
    assert.throws(() => gh.fetchDiscussionSummary('not-a-valid-repo'), /Invalid repo: not-a-valid-repo/);
  })) passed++; else failed++;

  if (test('discussions disabled: returns emptyDiscussionSummary() shape and makes only the enabled query', () => {
    const rootDir = createTempDir('gh-discussions-disabled-');
    try {
      const shimPath = writeGhShim(rootDir, {
        [discussionEnabledGhKey('acme', 'widgets')]: {
          data: { repository: { hasDiscussionsEnabled: false } }
        }
        // Deliberately no entry for discussionGhKey — if the module shells out
        // to the heavy query anyway, the shim exits 3 and this test fails.
      });

      const outcome = fetchViaShim('acme/widgets', {}, shimPath);
      assert.strictEqual(outcome.ok, true, outcome.message);
      assert.deepStrictEqual(outcome.result, gh.emptyDiscussionSummary());
    } finally {
      cleanup(rootDir);
    }
  })) passed++; else failed++;

  if (test('enabled with a mix of discussion nodes: correct totals and filtering', () => {
    const rootDir = createTempDir('gh-discussions-mixed-');
    try {
      const needsTouchNode = {
        number: 1,
        title: 'Needs a maintainer',
        url: 'https://github.com/acme/widgets/discussions/1',
        updatedAt: '2026-01-01T00:00:00Z',
        authorAssociation: 'NONE',
        category: { name: 'General', isAnswerable: false },
        answer: null,
        comments: { nodes: [{ authorAssociation: 'NONE' }] }
      };
      const needsAnswerNode = {
        number: 2,
        title: 'Needs an accepted answer',
        url: 'https://github.com/acme/widgets/discussions/2',
        updatedAt: '2026-01-02T00:00:00Z',
        authorAssociation: 'MEMBER',
        category: { name: 'Q&A', isAnswerable: true },
        answer: null,
        comments: { nodes: [] }
      };
      const healthyNode = {
        number: 3,
        title: 'All good',
        url: 'https://github.com/acme/widgets/discussions/3',
        updatedAt: '2026-01-03T00:00:00Z',
        authorAssociation: 'OWNER',
        category: { name: 'Q&A', isAnswerable: true },
        answer: { url: 'https://github.com/acme/widgets/discussions/3#answer', authorAssociation: 'OWNER' },
        comments: { nodes: [] }
      };

      const shimPath = writeGhShim(rootDir, {
        [discussionEnabledGhKey('acme', 'widgets')]: {
          data: { repository: { hasDiscussionsEnabled: true } }
        },
        [discussionGhKey('acme', 'widgets')]: {
          data: {
            repository: {
              hasDiscussionsEnabled: true,
              discussions: {
                totalCount: 30,
                nodes: [needsTouchNode, needsAnswerNode, healthyNode]
              }
            }
          }
        }
      });

      const outcome = fetchViaShim('acme/widgets', {}, shimPath);
      assert.strictEqual(outcome.ok, true, outcome.message);
      const result = outcome.result;
      assert.strictEqual(result.enabled, true);
      assert.strictEqual(result.totalCount, 30);
      assert.strictEqual(result.sampledCount, 3);
      assert.strictEqual(result.needingMaintainerTouch.length, 1);
      assert.deepStrictEqual(result.needingMaintainerTouch[0], gh.summarizeDiscussion(needsTouchNode));
      assert.strictEqual(result.answerableWithoutAcceptedAnswer.length, 1);
      assert.deepStrictEqual(result.answerableWithoutAcceptedAnswer[0], gh.summarizeDiscussion(needsAnswerNode));
    } finally {
      cleanup(rootDir);
    }
  })) passed++; else failed++;

  if (test('options.first is honored in the -F first= arg', () => {
    const rootDir = createTempDir('gh-discussions-first-');
    try {
      const shimPath = writeGhShim(rootDir, {
        [discussionEnabledGhKey('acme', 'widgets')]: {
          data: { repository: { hasDiscussionsEnabled: true } }
        },
        [discussionGhKey('acme', 'widgets', 5)]: {
          data: {
            repository: {
              hasDiscussionsEnabled: true,
              discussions: { totalCount: 5, nodes: [] }
            }
          }
        }
        // No entry keyed on the default first=100 — proves options.first=5
        // actually changed the shelled-out command rather than being ignored.
      });

      const outcome = fetchViaShim('acme/widgets', { first: 5 }, shimPath);
      assert.strictEqual(outcome.ok, true, outcome.message);
      assert.strictEqual(outcome.result.totalCount, 5);
      assert.strictEqual(outcome.result.sampledCount, 0);
    } finally {
      cleanup(rootDir);
    }
  })) passed++; else failed++;

  if (test('GITHUB_TOKEN is stripped from the shim environment by default', () => {
    const rootDir = createTempDir('gh-discussions-token-');
    try {
      const shimPath = writeGhShim(rootDir, {
        [discussionEnabledGhKey('acme', 'widgets')]: {
          data: { repository: { hasDiscussionsEnabled: false } }
        }
      });

      const outcome = fetchViaShim('acme/widgets', {}, shimPath, { GITHUB_TOKEN: 'must-be-removed' });
      assert.strictEqual(outcome.ok, true, outcome.message);
      assert.deepStrictEqual(outcome.result, gh.emptyDiscussionSummary());
    } finally {
      cleanup(rootDir);
    }
  })) passed++; else failed++;

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exitCode = failed > 0 ? 1 : 0;
}

runTests();
