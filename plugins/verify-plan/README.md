# verify-plan

Adversarial plan verification via convergence-loop debate for Claude Code.

## What It Does

Spawns a team of 3-5 specialized AI agents that autonomously challenge, research, and debate your implementation plan before you start building. The agents iterate in a convergence loop (max 3 iterations) until all concerns are resolved, producing a final verdict: **PROCEED**, **REVISE**, or **RETHINK**.

No plan survives first contact with reality. This plugin makes sure yours gets that contact *before* you start building.

## Architecture

The plugin implements a convergence loop with binary resolution tracking:

```
Plan File
  |
  v
+---------------------------------------------+
|           CONVERGENCE LOOP (max 3)          |
|                                              |
|  +----------+   +----------+   +---------+  |
|  |Challenger |   |Researcher|   |Synthesiz|  |
|  |  (opus)   |-->|(snt/opus)|-->|  (opus) |  |
|  +----------+   +----------+   +---------+  |
|       |                             |        |
|       v                             v        |
|  challenges +              resolution state  |
|  unknowns manifest         + convergence     |
|                                              |
|  [SCALED adds: domain-expert + devil's-adv]  |
+---------------------------------------------+
  |
  v
Verdict: PROCEED / REVISE / RETHINK
```

### Agent Roster

| Agent | Model | Role |
|-------|-------|------|
| plan-challenger | opus | Finds weaknesses in approach and judgment |
| plan-resolver | sonnet | Resolves specific unknowns identified by challenger |
| plan-researcher | sonnet/opus | Surfaces unknown knowns + probes blind spots |
| plan-synthesizer | opus | Binary resolution tracking, convergence control, final verdict |
| plan-domain-expert | sonnet | Domain-specific challenges (scaled team only) |
| plan-devils-advocate | opus | Black-swan scenario hunting (scaled team only) |

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) -- Anthropic's CLI tool
- memory-router MCP server — optional (enhances research quality, if available)

## Install

```bash
claude plugin add verify-plan@uriel-lord-of-vows
```

Or manually:
```bash
git clone https://github.com/contabilidad-source/uriel-lord-of-vows.git
# Copy plugin files to your Claude Code plugins directory
```

## Usage

```
/verify-plan [path] [--team=base|scaled] [--threshold=N]
```

### Path Resolution

1. **Explicit path:** `/verify-plan .claude/plans/my-plan.md`
2. **Auto-discover:** Picks most recent `.md` file in `.claude/plans/`
3. **Ask user:** If no plan found, prompts for path

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--team=base` | auto | Force 3-agent team |
| `--team=scaled` | auto | Force 5-agent team |
| `--threshold=N` | 7 | Override complexity threshold for team sizing |

### Examples

```
/verify-plan                          # auto-discover most recent plan
/verify-plan .claude/plans/auth.md    # verify specific plan
/verify-plan --team=scaled            # force 5-agent team
/verify-plan --threshold=5            # lower complexity threshold
```

## How It Works

### 1. Complexity Assessment

The plugin scores your plan's complexity (0-16) based on:
- Number of steps/phases (max +3)
- Distinct domains (max +3)
- External integrations (+2/system, max +4)
- Compliance/regulatory requirements (+2)
- Unknown signals like TBD, TODO (+1 each, max +3)
- File count (10+ referenced files: +1)

Plans scoring < 7 get a BASE team (3 agents). Plans >= 7 get a SCALED team (5 agents).

### 2. Convergence Loop

Each iteration runs three phases:
1. **Challenge:** Adversarial agents find weaknesses (approach, domain, black-swan)
2. **Research:** Three-mode research resolves unknowns, surfaces context, probes blind spots
3. **Synthesis:** Binary resolution tracking determines convergence

### 3. Binary Resolution Tracking

Challenges are tracked as OPEN -> RESOLVED/UNRESOLVED/DEFERRED/WITHDRAWN. The loop converges when:
- **PROCEED:** Zero BLOCKING + zero SIGNIFICANT open/unresolved
- **REVISE:** Zero BLOCKING + 1-2 SIGNIFICANT with concrete mitigations
- **RETHINK:** BLOCKING issues persist after 3 iterations

Quality scores (1-10) are informational only -- they don't affect the verdict.

## Team Composition

### BASE Team (complexity < 7)

Three agents run sequentially per iteration:
1. Challenger produces challenge brief + unknowns manifest
2. Resolver/Researcher investigates unknowns and surfaces context
3. Synthesizer evaluates resolution status and checks convergence

### SCALED Team (complexity >= 7)

Adds two agents that run in parallel with the challenger:
- **Domain Expert:** Applies specialized domain knowledge (auto-detected)
- **Devil's Advocate:** Hunts for non-obvious failure modes and cascading failures

## Verdicts

### PROCEED
All BLOCKING and SIGNIFICANT challenges resolved. Plan is ready.
- **Next step:** Run structural validation (if available), then execute

### REVISE
No BLOCKING issues, but 1+ SIGNIFICANT concerns with noted mitigations.
- **Next step:** Update plan with listed changes, optionally re-verify

### RETHINK
Fundamental issues found after 3 iterations. Do NOT proceed.
- **Next step:** Rework approach before re-verification

## Customization

### Domain Lenses

The challenger auto-detects domains from plan content:
Infrastructure, Frontend, API/Integration, Data/Pipeline, Automation, Compliance, Agent/Prompt

### Adjusting Thresholds

Use `--threshold=N` to change when SCALED team activates. Lower values mean more scrutiny.

## Optional Enhancements

### Memory-Router MCP

If configured, the researcher agent sweeps persistent memory for:
- Prior architectural decisions
- API quirks and gotchas
- Resolved bugs in similar domains
- User corrections

The memory-router integration is optional. If not available, the plugin still functions -- research is based on codebase, CLAUDE.md, and git history.

## Known Limitations

- **Token budget:** Scaled team with 3 iterations can use ~150-215K tokens
- **Max iterations:** Hard cap at 3 -- if issues persist, RETHINK is forced
- **Soft enforcement:** Challenge caps and tool budgets are agent-enforced, not system-enforced
- **No code review:** This plugin reviews *plans*, not code. Use a code review tool for that.

## FAQ

**Q: When should I use this vs just executing my plan?**
A: Use it for any non-trivial plan (3+ steps, external integrations, compliance concerns). Skip it for obvious fixes and single-file changes.

**Q: Can I override the verdict?**
A: Yes -- verdicts are advisory. You can proceed after REVISE or even RETHINK, but the issues are documented.

**Q: Does it modify my plan file?**
A: No. The plugin is read-only. It reads your plan and produces a verdict report.

**Q: How long does it take?**
A: BASE team: 1-3 minutes. SCALED team: 2-5 minutes. Depends on plan complexity and iteration count.

**Q: What if an agent fails mid-loop?**
A: The plugin has an Agent Failure Protocol -- it logs the failure, skips the failed phase, and continues with available data. If 2+ agents fail, it force-exits with partial findings.

## License

MIT -- see [LICENSE](../../LICENSE)
