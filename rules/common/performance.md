# Performance Optimization

## Model Selection Strategy

**Haiku 5.5** (fast, lowest cost):
- Fully specified, checklist-shaped work
- Classification, routing, extraction, fixture writing
- Worker agents in multi-agent systems

**Sonnet 5.5** (default builder):
- Main development work
- Orchestrating multi-agent workflows
- Complex coding tasks

**Opus 5.5** (planning and review):
- Complex architectural decisions
- Adversarial review of plans and code
- Research and analysis tasks

**Fable 5.2** (hardest reasoning):
- Problems where evals at higher effort on Opus still fall short
- Documents other models will execute from

Per-model minimum bars are in [legacy.md](legacy.md). Older versions of each family
still work; use the section for the family when an exact version is not listed.

## Context Window Management

Avoid last 20% of context window for:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

Lower context sensitivity tasks:
- Single-file edits
- Independent utility creation
- Documentation updates
- Simple bug fixes

## Extended Thinking + Plan Mode

Extended thinking is enabled by default, reserving up to 31,999 tokens for internal reasoning.

Control extended thinking via:
- **Toggle**: Option+T (macOS) / Alt+T (Windows/Linux)
- **Config**: Set `alwaysThinkingEnabled` in `~/.claude/settings.json`
- **Budget cap**: `export MAX_THINKING_TOKENS=10000`
- **Verbose mode**: Ctrl+O to see thinking output

For complex tasks requiring deep reasoning:
1. Ensure extended thinking is enabled (on by default)
2. Enable **Plan Mode** for structured approach
3. Use multiple critique rounds for thorough analysis
4. Use split role sub-agents for diverse perspectives

## Build Troubleshooting

If build fails:
1. Use **build-error-resolver** agent
2. Analyze error messages
3. Fix incrementally
4. Verify after each fix
