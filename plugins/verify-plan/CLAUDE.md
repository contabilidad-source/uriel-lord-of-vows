<verify-plan>

# verify-plan — Plugin Behavioral Instructions

## Invocation

`/verify-plan [path] [--team=base|scaled] [--threshold=N]`

## Pipeline Position

```
Plan written → /verify-plan (THIS) → structural validator (if available) → Execution
```

## What It Does

Spawns an adversarial agent team (3-5 agents) to stress-test a plan before execution begins. The team debates, researches, and iterates in a convergence loop (max 3 iterations) until challenges are resolved. Produces a final verdict with quality score.

## When to Use

Before executing any non-trivial plan (3+ steps, architectural decisions, external integrations, compliance requirements). Especially valuable for:
- Plans touching multiple systems or domains
- Plans with regulatory or compliance implications
- Plans with external API dependencies
- Plans that affect shared infrastructure

## Agent Roster

| Agent | Model | Role |
|-------|-------|------|
| plan-challenger | opus | Adversarial analysis — finds weaknesses in approach and judgment |
| plan-resolver | sonnet | Mode 1 research — resolves specific unknowns from challenger |
| plan-researcher | sonnet/opus | Modes 2-3 research — surfaces unknown knowns and probes blind spots |
| plan-synthesizer | opus | Convergence controller — binary resolution tracking and final verdict |
| plan-domain-expert | sonnet | Domain-specific challenges (scaled team only) |
| plan-devils-advocate | opus | Black-swan scenario hunting (scaled team only) |

## Team Sizing

- **BASE team** (3 agents): complexity < 7 AND unknowns <= 3
- **SCALED team** (5 agents): complexity >= 7 OR unknowns > 3
- Override with `--team=base` or `--team=scaled`

## Verdicts

| Verdict | Meaning | Next Step |
|---------|---------|-----------|
| **PROCEED** | Plan passed adversarial review | Run structural validator (if available), then execute |
| **REVISE** | Plan needs specific changes | Update plan with listed changes, optionally re-run /verify-plan |
| **RETHINK** | Fundamental issues found | Do NOT proceed. Rework approach first |

## Memory-Router Integration

The memory-router MCP server is optional. If configured, the researcher agent will sweep memory for prior architectural decisions, API quirks, and resolved bugs relevant to the plan. If not available, the skill still functions — research quality may be slightly reduced for historical context.

## Configuration

No configuration required. The skill reads plan files and uses standard Claude Code tools (Read, Grep, WebSearch, Task). All agent definitions are bundled in the `agents/` directory.

</verify-plan>
