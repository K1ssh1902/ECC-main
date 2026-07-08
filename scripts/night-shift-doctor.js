#!/usr/bin/env node
/**
 * Night Shift doctor — deterministic integrity, status, and metrics for a
 * `.night-shift/` mission state directory (see skills/night-shift/SKILL.md).
 *
 * Usage:
 *   node scripts/night-shift-doctor.js validate [--dir <projectRoot>] [--json]
 *   node scripts/night-shift-doctor.js status   [--dir <projectRoot>] [--json]
 *   node scripts/night-shift-doctor.js metrics  [--dir <projectRoot>] [--json]
 *
 * Exit codes: 0 = ok, 1 = state unreadable, 2 = validation problems found.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const STATE_DIR_NAME = '.night-shift';
const EXPECTED_CATEGORY_COUNT = 13;
const MISSION_SECTIONS = ['## Backlog', '## Completed', '## Blocked', '## Needs Human'];
const CLOSED_VERDICTS = ['KEPT', 'REVERTED'];

function resolveStateDir(dirOption) {
  const base = path.resolve(dirOption || process.cwd());
  return path.basename(base) === STATE_DIR_NAME ? base : path.join(base, STATE_DIR_NAME);
}

function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_error) {
    return null;
  }
}

function matchesHeader(line, header) {
  const trimmed = line.trim();
  if (trimmed === header) {
    return true;
  }
  // Accept suffixed forms like "## Backlog (impact-ranked)".
  return trimmed.startsWith(`${header} `);
}

function getSection(markdown, header) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex(line => matchesHeader(line, header));
  if (start === -1) {
    return null;
  }

  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) {
      break;
    }
    body.push(line);
  }
  return body.join('\n');
}

function countListItems(sectionBody) {
  if (!sectionBody) {
    return 0;
  }
  return sectionBody.split(/\r?\n/).filter(line => /^\s*-\s+\S/.test(line)).length;
}

function parseMission(raw) {
  const goal = raw.match(/^\*\*Goal:\*\*\s*(.+)$/m);
  const phase = raw.match(/^\*\*Current phase:\*\*\s*(.+)$/m);

  return {
    goal: goal ? goal[1].trim() : null,
    phase: phase ? phase[1].trim() : null,
    missingSections: MISSION_SECTIONS.filter(header => getSection(raw, header) === null),
    backlogCount: countListItems(getSection(raw, '## Backlog')),
    blockedCount: countListItems(getSection(raw, '## Blocked')),
    needsHumanCount: countListItems(getSection(raw, '## Needs Human')),
  };
}

function parseScoreCell(cell) {
  const value = cell.trim();
  if (value === '' || value.toLowerCase() === 'n/a') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function parseScorecard(raw) {
  const rows = [];

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) {
      continue;
    }
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length < 4) {
      continue;
    }
    const name = cells[0].replace(/\*/g, '').trim();
    if (!name || name === 'Category' || /^[-:\s]+$/.test(cells[1])) {
      continue;
    }

    rows.push({
      category: name,
      baseline: parseScoreCell(cells[1]),
      lastAudit: parseScoreCell(cells[2]),
      now: parseScoreCell(cells[3]),
      isOverall: /overall/i.test(name),
    });
  }

  return {
    categories: rows.filter(row => !row.isOverall),
    overall: rows.find(row => row.isOverall) || null,
  };
}

function parseJournalEntry(name, raw) {
  const number = name.match(/cycle-(\d+)\.md$/i);
  const verdict = raw.match(/^##\s*Verdict:?\s*([A-Z-]+)/mi);
  const started = raw.match(/^\*\*Started:\*\*\s*(\S+)/m);
  const finished = raw.match(/^\*\*Finished:\*\*\s*(\S+)/m);
  const deltaLine = raw.match(/^Score deltas:\s*(.+)$/mi);

  return {
    name,
    number: number ? Number(number[1]) : null,
    hasContract: /^##\s*Contract/mi.test(raw),
    verdict: verdict ? verdict[1].toUpperCase() : null,
    startedAt: started ? started[1] : null,
    finishedAt: finished ? finished[1] : null,
    scoreMoved: deltaLine ? /→|->/.test(deltaLine[1]) : false,
  };
}

function collectState(dirOption) {
  const stateDir = resolveStateDir(dirOption);
  if (!fs.existsSync(stateDir)) {
    return { stateDir, exists: false };
  }

  const missionRaw = readFileIfExists(path.join(stateDir, 'mission.md'));
  const scorecardRaw = readFileIfExists(path.join(stateDir, 'scorecard.md'));

  const journalDir = path.join(stateDir, 'journal');
  let entries = [];
  if (fs.existsSync(journalDir)) {
    entries = fs.readdirSync(journalDir)
      .filter(name => /^cycle-\d+\.md$/i.test(name))
      .sort()
      .map(name => parseJournalEntry(name, readFileIfExists(path.join(journalDir, name)) || ''));
  }

  return {
    stateDir,
    exists: true,
    mission: missionRaw === null ? null : parseMission(missionRaw),
    scorecard: scorecardRaw === null ? null : parseScorecard(scorecardRaw),
    journal: entries,
  };
}

function validateState(state) {
  const problems = [];
  const problem = (severity, code, message) => problems.push({ severity, code, message });

  if (!state.exists) {
    problem('error', 'E_NO_STATE', `state directory not found: ${state.stateDir}`);
    return { ok: false, problems };
  }

  if (state.mission === null) {
    problem('error', 'E_NO_MISSION', 'mission.md is missing or unreadable');
  } else {
    if (!state.mission.goal) {
      problem('error', 'E_NO_GOAL', 'mission.md has no **Goal:** line');
    }
    for (const header of state.mission.missingSections) {
      problem('error', 'E_MISSION_SECTION', `mission.md is missing the "${header}" section`);
    }
  }

  if (state.scorecard === null) {
    problem('error', 'E_NO_SCORECARD', 'scorecard.md is missing or unreadable');
  } else {
    const count = state.scorecard.categories.length;
    if (count !== EXPECTED_CATEGORY_COUNT) {
      problem('warn', 'W_CATEGORY_COUNT', `scorecard has ${count} category rows, expected ${EXPECTED_CATEGORY_COUNT}`);
    }
    for (const row of state.scorecard.categories) {
      for (const key of ['baseline', 'lastAudit', 'now']) {
        const value = row[key];
        if (value !== null && (Number.isNaN(value) || value < 0 || value > 100)) {
          problem('error', 'E_SCORE_RANGE', `scorecard "${row.category}" ${key} is not 0-100 or n/a`);
        }
      }
    }
  }

  const numbers = state.journal.map(entry => entry.number).filter(number => number !== null);
  if (numbers.length > 0) {
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    if (max - min + 1 !== numbers.length || new Set(numbers).size !== numbers.length) {
      problem('error', 'E_JOURNAL_GAP', `journal numbering is not contiguous (${min}..${max}, ${numbers.length} entries)`);
    }
  }

  state.journal.forEach((entry, index) => {
    const isLast = index === state.journal.length - 1;
    if (!entry.hasContract) {
      problem('warn', 'W_NO_CONTRACT', `${entry.name} has no "## Contract" section`);
    }
    if (entry.verdict === null) {
      problem(
        isLast ? 'warn' : 'error',
        isLast ? 'W_OPEN_CYCLE' : 'E_NO_VERDICT',
        isLast
          ? `${entry.name} has no verdict — interrupted cycle; close it before new work`
          : `${entry.name} has no verdict but is not the latest entry`
      );
    } else if (!CLOSED_VERDICTS.includes(entry.verdict)) {
      problem('warn', 'W_VERDICT_VALUE', `${entry.name} verdict "${entry.verdict}" is not KEPT or REVERTED`);
    }
  });

  return { ok: !problems.some(item => item.severity === 'error'), problems };
}

function computeStatus(state) {
  const last = state.journal[state.journal.length - 1] || null;

  return {
    goal: state.mission ? state.mission.goal : null,
    phase: state.mission ? state.mission.phase : null,
    cycles: state.journal.length,
    lastCycle: last ? { name: last.name, verdict: last.verdict } : null,
    openCycle: Boolean(last && last.verdict === null),
    backlog: state.mission ? state.mission.backlogCount : null,
    blocked: state.mission ? state.mission.blockedCount : null,
    needsHuman: state.mission ? state.mission.needsHumanCount : null,
    overall: state.scorecard && state.scorecard.overall
      ? { baseline: state.scorecard.overall.baseline, now: state.scorecard.overall.now }
      : null,
  };
}

function averageCycleMinutes(entries) {
  const durations = entries
    .map(entry => {
      if (!entry.startedAt || !entry.finishedAt) {
        return null;
      }
      const ms = Date.parse(entry.finishedAt) - Date.parse(entry.startedAt);
      return Number.isFinite(ms) && ms >= 0 ? ms / 60000 : null;
    })
    .filter(minutes => minutes !== null);

  if (durations.length === 0) {
    return null;
  }
  const mean = durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length;
  return Math.round(mean * 10) / 10;
}

function computeMetrics(state) {
  const closed = state.journal.filter(entry => CLOSED_VERDICTS.includes(entry.verdict));
  const kept = closed.filter(entry => entry.verdict === 'KEPT').length;

  let flatTrailing = 0;
  for (let index = closed.length - 1; index >= 0; index -= 1) {
    if (closed[index].scoreMoved) {
      break;
    }
    flatTrailing += 1;
  }

  const overall = state.scorecard ? state.scorecard.overall : null;
  const overallDelta = overall && overall.baseline !== null && overall.now !== null
    ? overall.now - overall.baseline
    : null;

  return {
    cycles: state.journal.length,
    closedCycles: closed.length,
    kept,
    reverted: closed.length - kept,
    completionRate: closed.length > 0 ? Math.round((kept / closed.length) * 100) / 100 : null,
    overallDelta,
    improvementPerCycle: overallDelta !== null && closed.length > 0
      ? Math.round((overallDelta / closed.length) * 100) / 100
      : null,
    avgCycleMinutes: averageCycleMinutes(closed),
    flatTrailingCycles: flatTrailing,
    needsHumanQueued: state.mission ? state.mission.needsHumanCount : null,
  };
}

function parseArgs(argv) {
  const commands = new Set(['validate', 'status', 'metrics']);
  const args = { command: null, dir: null, json: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (commands.has(arg) && args.command === null) {
      args.command = arg;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--dir') {
      index += 1;
      args.dir = argv[index];
      if (args.dir === undefined) {
        throw new Error('--dir requires a path');
      }
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (args.command === null) {
    throw new Error('Usage: night-shift-doctor <validate|status|metrics> [--dir <path>] [--json]');
  }
  return args;
}

function formatValidation(result) {
  if (result.problems.length === 0) {
    return 'Night Shift state is consistent.\n';
  }
  const lines = result.problems.map(item => `${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  lines.push(result.ok ? 'State is usable (warnings only).' : 'State is inconsistent; repair before continuing.');
  return `${lines.join('\n')}\n`;
}

function formatObject(title, data) {
  const lines = [title];
  for (const [key, value] of Object.entries(data)) {
    lines.push(`  ${key}: ${value === null ? '-' : JSON.stringify(value)}`);
  }
  return `${lines.join('\n')}\n`;
}

function run(argv = process.argv.slice(2), options = {}) {
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;

  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return 1;
  }

  const state = collectState(args.dir);
  if (!state.exists) {
    stderr.write(`No ${STATE_DIR_NAME} state found under ${state.stateDir}\n`);
    return 1;
  }

  if (args.command === 'validate') {
    const result = validateState(state);
    stdout.write(args.json ? `${JSON.stringify(result, null, 2)}\n` : formatValidation(result));
    return result.problems.length === 0 ? 0 : result.ok ? 0 : 2;
  }

  const data = args.command === 'status' ? computeStatus(state) : computeMetrics(state);
  stdout.write(args.json
    ? `${JSON.stringify(data, null, 2)}\n`
    : formatObject(`Night Shift ${args.command}:`, data));
  return 0;
}

if (require.main === module) {
  process.exit(run());
}

module.exports = {
  collectState,
  computeMetrics,
  computeStatus,
  getSection,
  parseArgs,
  parseJournalEntry,
  parseMission,
  parseScorecard,
  resolveStateDir,
  run,
  validateState,
};
