#!/usr/bin/env node
/**
 * Chief Orchestrator doctor — deterministic integrity, status, and metrics for a
 * `~/.claude/orchestrator/` portfolio state directory
 * (see skills/chief-orchestrator/SKILL.md and docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md).
 *
 * Usage:
 *   node scripts/orchestrator-doctor.js validate [--dir <stateDir>] [--json]
 *   node scripts/orchestrator-doctor.js status   [--dir <stateDir>] [--json]
 *   node scripts/orchestrator-doctor.js metrics  [--dir <stateDir>] [--json]
 *
 * `--dir` points at the state directory itself; default is ~/.claude/orchestrator.
 * Exit codes: 0 = ok, 1 = state unreadable, 2 = validation problems found.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const PORTFOLIO_SECTIONS = ['## Objectives', '## Repositories', '## Missions', '## Needs Human', '## Decision Log'];
const MISSION_STATES = ['chartered', 'dispatched', 'active', 'wrapping', 'done', 'aborted', 'blocked'];
const RUNNING_STATES = ['dispatched', 'active'];
const TERMINAL_STATES = ['done', 'aborted'];

function resolveStateDir(dirOption) {
  if (dirOption) {
    return path.resolve(dirOption);
  }
  return path.join(os.homedir(), '.claude', 'orchestrator');
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
  // Accept suffixed forms like "## Needs Human (aggregated)".
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

function hasSectionContent(sectionBody) {
  return Boolean(sectionBody && sectionBody.split(/\r?\n/).some(line => line.trim() !== ''));
}

function parseTableRows(sectionBody) {
  if (!sectionBody) {
    return [];
  }
  const rows = [];
  for (const line of sectionBody.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) {
      continue;
    }
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length === 0 || /^[-:\s]+$/.test(cells[0]) || cells.every(cell => /^[-:\s]*$/.test(cell))) {
      continue;
    }
    rows.push(cells);
  }
  return rows;
}

function parseObjectives(sectionBody) {
  if (!sectionBody) {
    return [];
  }
  const objectives = [];
  for (const line of sectionBody.split(/\r?\n/)) {
    const match = line.match(/^\s*-\s+\[[ xX]\]\s+(OBJ-\d+)\s+(.*)$/);
    if (!match) {
      continue;
    }
    const status = match[2].match(/status:\s*([a-z-]+)/i);
    objectives.push({
      id: match[1],
      status: status ? status[1].toLowerCase() : null,
    });
  }
  return objectives;
}

function parsePortfolio(raw) {
  const updated = raw.match(/^\*\*Updated:\*\*\s*(.+)$/m);
  const session = raw.match(/^\*\*Active session:\*\*\s*(.+)$/m);
  const missionsSection = getSection(raw, '## Missions');
  const missionRows = parseTableRows(missionsSection)
    .filter(cells => cells[0] !== 'ID')
    .map(cells => ({
      id: cells[0] || '',
      objective: cells[1] || '',
      project: cells[2] || '',
      mode: cells[3] || '',
      state: (cells[4] || '').toLowerCase(),
      lastCheck: cells[6] || '',
    }));

  return {
    updated: updated ? updated[1].trim() : null,
    activeSession: session ? session[1].trim() : null,
    missingSections: PORTFOLIO_SECTIONS.filter(header => getSection(raw, header) === null),
    objectives: parseObjectives(getSection(raw, '## Objectives')),
    missions: missionRows,
    needsHumanCount: countListItems(getSection(raw, '## Needs Human')),
  };
}

function parseMissionFile(name, raw) {
  const field = label => {
    const match = raw.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'));
    return match ? match[1].trim() : null;
  };
  const charter = getSection(raw, '## Charter');

  return {
    name,
    id: name.replace(/\.md$/i, ''),
    objective: field('Objective'),
    project: field('Project'),
    mode: field('Mode'),
    state: (field('State') || '').toLowerCase() || null,
    hasCharter: charter !== null,
    hasGoal: Boolean(charter && /^\s*-\s*Goal:\s*\S/mi.test(charter)),
    supervisionEntries: countListItems(getSection(raw, '## Supervision Log')),
    hasOutcome: hasSectionContent(getSection(raw, '## Outcome')),
  };
}

function collectState(dirOption) {
  const stateDir = resolveStateDir(dirOption);
  if (!fs.existsSync(stateDir)) {
    return { stateDir, exists: false };
  }

  const portfolioRaw = readFileIfExists(path.join(stateDir, 'portfolio.md'));

  const missionsDir = path.join(stateDir, 'missions');
  let missionFiles = [];
  if (fs.existsSync(missionsDir)) {
    missionFiles = fs.readdirSync(missionsDir)
      .filter(name => /\.md$/i.test(name))
      .sort()
      .map(name => parseMissionFile(name, readFileIfExists(path.join(missionsDir, name)) || ''));
  }

  const reportsDir = path.join(stateDir, 'reports');
  let reports = [];
  if (fs.existsSync(reportsDir)) {
    reports = fs.readdirSync(reportsDir).filter(name => /\.md$/i.test(name)).sort();
  }

  return {
    stateDir,
    exists: true,
    portfolio: portfolioRaw === null ? null : parsePortfolio(portfolioRaw),
    missionFiles,
    reports,
  };
}

function validateState(state) {
  const problems = [];
  const problem = (severity, code, message) => problems.push({ severity, code, message });

  if (!state.exists) {
    problem('error', 'E_NO_STATE', `state directory not found: ${state.stateDir}`);
    return { ok: false, problems };
  }

  if (state.portfolio === null) {
    problem('error', 'E_NO_PORTFOLIO', 'portfolio.md is missing or unreadable');
    return { ok: false, problems };
  }

  for (const header of state.portfolio.missingSections) {
    problem('error', 'E_PORTFOLIO_SECTION', `portfolio.md is missing the "${header}" section`);
  }

  const tableIds = state.portfolio.missions.map(mission => mission.id);
  const duplicates = tableIds.filter((id, index) => tableIds.indexOf(id) !== index);
  for (const id of new Set(duplicates)) {
    problem('error', 'E_DUP_MISSION_ID', `mission "${id}" appears more than once in the portfolio table`);
  }

  const fileIds = new Set(state.missionFiles.map(file => file.id));
  for (const mission of state.portfolio.missions) {
    if (!MISSION_STATES.includes(mission.state)) {
      problem('error', 'E_MISSION_STATE', `portfolio mission "${mission.id}" has state "${mission.state}", expected one of: ${MISSION_STATES.join(', ')}`);
    }
    if (!fileIds.has(mission.id)) {
      problem('error', 'E_MISSION_FILE_MISSING', `portfolio mission "${mission.id}" has no missions/${mission.id}.md file`);
    }
  }

  const tableIdSet = new Set(tableIds);
  for (const file of state.missionFiles) {
    if (!tableIdSet.has(file.id)) {
      problem('warn', 'W_ORPHAN_MISSION', `missions/${file.name} is not registered in the portfolio table`);
    }
    if (file.state !== null && !MISSION_STATES.includes(file.state)) {
      problem('error', 'E_MISSION_STATE', `missions/${file.name} has state "${file.state}", expected one of: ${MISSION_STATES.join(', ')}`);
    }
    for (const [label, value] of [['Project', file.project], ['Mode', file.mode], ['State', file.state]]) {
      if (!value) {
        problem('error', 'E_MISSION_FIELD', `missions/${file.name} is missing the **${label}:** field`);
      }
    }
    if (!file.hasCharter || !file.hasGoal) {
      problem('error', 'E_MISSION_CHARTER', `missions/${file.name} has no "## Charter" section with a "- Goal:" line`);
    }
    if (TERMINAL_STATES.includes(file.state) && !file.hasOutcome) {
      problem('warn', 'W_NO_OUTCOME', `missions/${file.name} is ${file.state} but "## Outcome" is empty`);
    }
    if (RUNNING_STATES.includes(file.state) && file.supervisionEntries === 0) {
      problem('warn', 'W_NO_SUPERVISION', `missions/${file.name} is ${file.state} with an empty supervision log`);
    }
  }

  const runningByProject = new Map();
  for (const file of state.missionFiles) {
    if (!RUNNING_STATES.includes(file.state) || !file.project) {
      continue;
    }
    const key = file.project.toLowerCase();
    if (runningByProject.has(key)) {
      problem('error', 'E_REPO_CONFLICT', `more than one active/dispatched mission for project "${file.project}" (${runningByProject.get(key)}, ${file.id})`);
    } else {
      runningByProject.set(key, file.id);
    }
  }

  return { ok: !problems.some(item => item.severity === 'error'), problems };
}

function countByState(missionFiles) {
  const counts = {};
  for (const stateName of MISSION_STATES) {
    counts[stateName] = 0;
  }
  for (const file of missionFiles) {
    if (Object.prototype.hasOwnProperty.call(counts, file.state)) {
      counts[file.state] += 1;
    }
  }
  return counts;
}

function computeStatus(state) {
  const portfolio = state.portfolio;
  const byState = countByState(state.missionFiles);

  return {
    activeSession: portfolio ? portfolio.activeSession : null,
    updated: portfolio ? portfolio.updated : null,
    objectives: portfolio ? portfolio.objectives.length : null,
    missions: state.missionFiles.length,
    running: byState.dispatched + byState.active,
    blocked: byState.blocked,
    needsHuman: portfolio ? portfolio.needsHumanCount : null,
    lastReport: state.reports.length > 0 ? state.reports[state.reports.length - 1] : null,
  };
}

function computeMetrics(state) {
  const byState = countByState(state.missionFiles);
  const closed = byState.done + byState.aborted;
  const supervisionEntries = state.missionFiles
    .reduce((sum, file) => sum + file.supervisionEntries, 0);

  const objectives = state.portfolio ? state.portfolio.objectives : [];
  const objectivesDone = objectives.filter(objective => objective.status === 'done').length;

  return {
    objectives: objectives.length,
    objectivesDone,
    missions: state.missionFiles.length,
    byState,
    completionRate: closed > 0 ? Math.round((byState.done / closed) * 100) / 100 : null,
    supervisionEntries,
    reports: state.reports.length,
    needsHumanQueued: state.portfolio ? state.portfolio.needsHumanCount : null,
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
    throw new Error('Usage: orchestrator-doctor <validate|status|metrics> [--dir <path>] [--json]');
  }
  return args;
}

function formatValidation(result) {
  if (result.problems.length === 0) {
    return 'Orchestrator state is consistent.\n';
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
    stderr.write(`No orchestrator state found at ${state.stateDir}\n`);
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
    : formatObject(`Orchestrator ${args.command}:`, data));
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
  parseMissionFile,
  parsePortfolio,
  resolveStateDir,
  run,
  validateState,
};
