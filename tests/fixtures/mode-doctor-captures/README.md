# Mode-doctor fixture captures — M2, 2026-07-09

Real doctor outputs captured during the first supervised `/chief` session
(HELIOS Roadmap M2), preserved as the fixture seed for M3
(`tests/scripts/mode-doctor-contract.test.js`) per the F5 lesson: evidence is
committed with the work, never scratchpad-resident. Every file is verbatim
stdout+stderr of the command shown; exit codes observed live.

| File | Command | Exit | Class |
|---|---|---|---|
| `2026-07-09-orchestrator-validate-absent.json` | `node scripts/orchestrator-doctor.js validate --json` (before `~/.claude/orchestrator/` existed) | 1 | state absent |
| `2026-07-09-nightshift-status-nostate.json` | `node scripts/night-shift-doctor.js status --dir <ECC-main> --json` (no `.night-shift/`) | 1 | state absent |
| `2026-07-09-orchestrator-validate-fresh.json` | `node scripts/orchestrator-doctor.js validate --json` (portfolio referenced a mission file not yet written) | 2 | integrity error — `E_MISSION_FILE_MISSING` |
| `2026-07-09-orchestrator-validate-healthy.json` | `node scripts/orchestrator-doctor.js validate --json` (healed state) | 0 | healthy |
| `2026-07-09-orchestrator-status-healthy.json` | `node scripts/orchestrator-doctor.js status --json` | 0 | healthy status snapshot |
| `2026-07-10-nightshift-status-healthy.json` | `node scripts/night-shift-doctor.js status --dir <ECC-main> --json` (mission live) | 0 | healthy |
| `2026-07-10-nightshift-metrics-healthy.json` | `node scripts/night-shift-doctor.js metrics --dir <ECC-main> --json` (mission live) | 0 | healthy |
| `2026-07-10-nightshift-validate-healthy.json` | `node scripts/night-shift-doctor.js validate --dir <ECC-main> --json` (mission live) | 0 | healthy |

Capture set COMPLETE as of 2026-07-10: the healthy night-shift-doctor
status/metrics/validate captures (Mode Doctor Contract field set — `openCycle`,
`cycles`, `backlog`, `needsHuman`, `flatTrailingCycles`, `completionRate`,
`closedCycles`) were banked during the M2 supervised mission and are the three
`2026-07-10-*.json` files above. Do NOT recapture — the mission states that
produced them no longer exist. `tests/scripts/mode-doctor-contract.test.js`
consumes every file in this directory.
