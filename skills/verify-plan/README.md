# verify-plan

Multi-agent adversarial plan verification for Claude Code. Spawns 3-5 agents in a convergence loop that challenges, researches, and synthesizes plan quality before execution begins.

Plans are the most dangerous artifact in software development — they feel productive but can lock you into bad decisions. A plan that "looks good" to one person may have fatal assumptions, missed integrations, or blind spots. This skill forces adversarial scrutiny before execution, catching issues when they're cheap to fix.

## How It Works

The skill reads your plan, assesses its complexity, sizes a verification team, and runs a convergence loop. Each iteration spawns agents that challenge assumptions, research unknowns, and synthesize findings. The loop exits when all challenges are resolved or the iteration cap is reached.

```
┌─────────────────────────────────────────────┐
│              CONVERGENCE LOOP               │
│                                             │
│  ┌───────────┐   ┌────────────┐             │
│  │ Challenger │──▶│ Researcher │             │
│  └───────────┘   └─────┬──────┘             │
│        ▲               │                    │
│        │         ┌─────▼──────┐             │
│        └─────────│Synthesizer │             │
│                  └─────┬──────┘             │
│                        │                    │
│              ┌─────────▼─────────┐          │
│              │ CONVERGED?        │          │
│              │ yes → verdict     │          │
│              │ no  → next iter   │          │
│              └───────────────────┘          │
└─────────────────────────────────────────────┘
```

**Challenger** agents identify weaknesses: missing error handling, unclear scope, risky assumptions, integration gaps, and unstated dependencies. **Researcher** agents investigate each challenge — reading the codebase, checking feasibility, gathering evidence. The **Synthesizer** evaluates all findings, resolves or escalates each challenge, and determines whether to converge or iterate again.

The main thread holds all state throughout. No agent communicates directly with another. This hub-and-spoke topology keeps context clean and prevents drift.

## Install

```bash
# Symlink (recommended)
git clone https://github.com/contabilidad-source/uriel-lord-of-vows.git
ln -s "$(pwd)/uriel-lord-of-vows/skills/verify-plan" ~/.claude/skills/verify-plan

# Or copy
cp -r uriel-lord-of-vows/skills/verify-plan ~/.claude/skills/verify-plan
```

After installation, verify the skill is discoverable:

```bash
ls ~/.claude/skills/verify-plan/SKILL.md
```

## Usage

```
/verify-plan                           # Auto-discovers most recent plan
/verify-plan .claude/plans/my-plan.md  # Explicit path
/verify-plan --team=scaled             # Force 5-agent team
/verify-plan --threshold=5             # Lower complexity threshold
```

### Expected Output Flow

1. **Complexity assessment:** `"Complexity: 8/14. Team: SCALED. Starting verification..."`
2. **Iteration progress:** `"Iteration 1: 3 resolved, 2 remaining. Continuing..."`
3. **Final verdict:** `PROCEED / REVISE / RETHINK` with resolution table and quality score

### Verdicts Explained

| Verdict | Meaning |
|---------|---------|
| **PROCEED** | No blocking or significant issues remain. Safe to execute. |
| **REVISE** | No blocking issues, but 1-2 significant ones need attention before execution. |
| **RETHINK** | Blocking issues remain after 3 iterations. The plan needs fundamental changes. |

Trivial plans (fewer than 5 lines, simple scope) are automatically detected and shortcut to `PROCEED (trivial)` for minimal token cost.

### Example Verdict Output

A typical final verdict looks like this:

```
══════════════════════════════════════════════════
  VERDICT: REVISE (2 iterations, 6 challenges)
══════════════════════════════════════════════════

  Quality Score: 7.2 / 10

  Resolution Table:
  ┌────┬──────────────────────────────┬───────────┬──────────┐
  │ #  │ Challenge                    │ Severity  │ Status   │
  ├────┼──────────────────────────────┼───────────┼──────────┤
  │ 1  │ No rollback strategy         │ blocking  │ RESOLVED │
  │ 2  │ API rate limit unaddressed   │ significant│ OPEN    │
  │ 3  │ Missing auth flow for svc B  │ significant│ OPEN    │
  │ 4  │ Unclear ownership of step 5  │ minor     │ RESOLVED │
  │ 5  │ No error budget defined      │ minor     │ RESOLVED │
  │ 6  │ Test coverage gap in module  │ minor     │ DEFERRED │
  └────┴──────────────────────────────┴───────────┴──────────┘

  Action items before execution:
  - Address API rate limiting strategy (challenge #2)
  - Define auth flow for service B integration (challenge #3)
══════════════════════════════════════════════════
```

## Invocation Flags

| Flag | Values | Default | Effect |
|------|--------|---------|--------|
| `--team` | `base`, `scaled` | auto | Override team size (base = 3 agents, scaled = 5 agents) |
| `--threshold` | integer | `7` | Complexity score threshold for auto team sizing |

When `--team` is not specified, the skill computes a complexity score (0-14) and selects `base` if below threshold, `scaled` if at or above.

## Cost Expectations

Token usage varies by plan complexity:

| Scenario | Tokens | Est. Cost (API) |
|----------|--------|-----------------|
| Trivial plan (< 5 lines) | ~2K | ~$0.01 |
| Base team, 1 iteration | ~45K | ~$1.50 |
| Base team, 3 iterations | ~95-150K | ~$3-5 |
| Scaled team, 1 iteration | ~70K | ~$2.50 |
| Scaled team, 3 iterations | ~150-215K | ~$5-7 |

> **Note:** Costs are approximate and based on Claude API pricing. Pro and Max subscribers with included usage pay no additional cost per token. Actual costs depend on your pricing tier.

## Prerequisites

- **Claude Code** CLI tool (with skill discovery and Task tool support)

- **TeamCreate (optional):** For the scaled team's parallel challenge phase, set:
  ```bash
  export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
  ```
  Without this flag, the skill falls back to sequential mode — all agents run one at a time. This is functionally identical but slower for complex plans.

## Compatibility

- Tested with Claude Code (requires skill discovery and Task tool support)
- Core dependencies: Skill YAML frontmatter discovery, Task tool for agent spawning
- Optional: TeamCreate (for parallel scaled team), memory-router MCP (for enhanced research)
- Models: Uses Opus for critical thinking agents, Sonnet for research agents

## Architecture

The skill consists of 3 files:

| File | Purpose |
|------|---------|
| `SKILL.md` | Main orchestrator — team composition, execution flow, convergence loop |
| `protocol.md` | Inter-agent protocol — schemas, resolution states, convergence criteria, tool budgets |
| `scoring-rubric.md` | Quality scoring — 6 dimensions, calibration examples, evidence requirements |

### Key Design Decisions

- **No persistent agents** — A fresh Task is spawned per step, preventing context pollution across iterations. Each agent starts clean with only the state it needs.

- **Hub-and-spoke topology** — The main thread holds all state. No agent-to-agent messaging. This eliminates coordination overhead and keeps the convergence loop deterministic.

- **Binary convergence** — The loop exits based on challenge resolution counts, not subjective scores. A challenge is either resolved (with evidence) or it isn't. This removes ambiguity from the convergence decision.

- **Capped complexity** — Max 8 challenges per iteration, max 3 iterations, strict tool budgets per agent. These caps prevent runaway token consumption on adversarial edge cases.

### Execution Flow (Detailed)

1. **Plan discovery** — Locate the target plan file (explicit path or auto-discovery via `.claude/plans/`)
2. **Complexity scoring** — Assess plan on 7 dimensions (scope, integrations, unknowns, risk, dependencies, ambiguity, scale) producing a 0-14 score
3. **Team sizing** — Score below threshold selects base team (3 agents), at or above selects scaled team (5 agents)
4. **Iteration 1** — Challenger reads the plan and raises up to 8 challenges. Researcher investigates each. Synthesizer resolves, escalates, or defers.
5. **Convergence check** — If all challenges are resolved or deferred, emit verdict. Otherwise, continue.
6. **Iterations 2-3** — Repeat with unresolved challenges. New challenges may emerge from research findings.
7. **Final verdict** — Emit PROCEED, REVISE, or RETHINK with a resolution table and quality score across 6 dimensions.

### Complexity Scoring Dimensions

The complexity assessment evaluates the plan across 7 dimensions, each scored 0 (low), 1 (moderate), or 2 (high):

| Dimension | 0 (Low) | 1 (Moderate) | 2 (High) |
|-----------|---------|-------------|----------|
| **Scope** | Single file or function | Multiple files, one module | Cross-module or cross-service |
| **Integrations** | No external dependencies | 1-2 APIs or services | 3+ APIs, databases, or services |
| **Unknowns** | All paths well-understood | Some research needed | Significant unknowns or novel territory |
| **Risk** | Easily reversible | Partially reversible | Hard to reverse (data migration, public API) |
| **Dependencies** | Self-contained | Depends on 1-2 other changes | Blocked by or blocking multiple workstreams |
| **Ambiguity** | Clear success criteria | Some undefined edge cases | Vague goals or conflicting requirements |
| **Scale** | Hours of work | Days of work | Weeks or multi-phase |

A single-file refactor with clear scope might score 1-2. A multi-service migration with unclear rollback strategy might score 10-12.

### Agent Roles (Base Team)

| Role | Model | Tool Budget | Responsibility |
|------|-------|-------------|----------------|
| Challenger | Opus | 5 reads | Identify weaknesses, assumptions, gaps |
| Researcher | Sonnet | 10 reads, 5 searches | Investigate challenges with codebase evidence |
| Synthesizer | Opus | 3 reads | Evaluate findings, resolve or escalate challenges |

### Agent Roles (Scaled Team — adds 2)

| Role | Model | Tool Budget | Responsibility |
|------|-------|-------------|----------------|
| Domain Expert | Opus | 5 reads | Deep-dive on domain-specific challenges |
| Devil's Advocate | Opus | 3 reads | Counter-argue resolved challenges, stress-test consensus |

### Challenge Resolution States

Each challenge raised by the Challenger moves through a lifecycle:

| State | Meaning | Transition |
|-------|---------|------------|
| `OPEN` | Newly raised, not yet investigated | Researcher picks it up |
| `RESEARCHED` | Evidence gathered, awaiting synthesis | Synthesizer evaluates |
| `RESOLVED` | Addressed with sufficient evidence | Terminal — no further action |
| `DEFERRED` | Not blocking, insufficient evidence to resolve now | Terminal — flagged in verdict |
| `ESCALATED` | Severity increased based on research findings | Re-enters next iteration as high priority |

A challenge can only be marked `RESOLVED` if the Synthesizer cites specific evidence from the Researcher. "Looks fine" is not a valid resolution. This evidence requirement is what gives the convergence loop its rigor.

## Known Limitations

1. **Token cost** — Scaled team with 3 iterations can use 150-215K tokens (~$5-7 on API pricing). For budget-sensitive workflows, use `--team=base` to cap agent count.

2. **No code review** — This verifies *plans*, not code. Use a dedicated code review tool for implementation review.

3. **No structural validation** — This checks plan *quality* (assumptions, risks, completeness), not plan *format* (headings, required sections). Structural validators are complementary.

4. **TeamCreate experimental** — Parallel scaled team requires the experimental `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` flag. Without it, the skill falls back to sequential execution with identical results.

5. **Research depth** — Tool budgets limit how deeply each agent can investigate per iteration. Some unknowns may require manual investigation after the verdict.

6. **Model dependency** — Designed for and tested with Claude models (Opus and Sonnet). Not tested with other LLM providers.

## Troubleshooting

**Skill not found when invoking `/verify-plan`**
Verify the skill directory is correctly placed at `~/.claude/skills/verify-plan/` and contains `SKILL.md`. Claude Code discovers skills by scanning for `SKILL.md` files with YAML frontmatter.

**"Task tool not available" error**
The Task tool is required for spawning agents. Ensure you are running a version of Claude Code that supports the Task tool. Check with `/help` or verify your Claude Code version.

**Sequential mode is very slow on complex plans**
Enable parallel execution by setting `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Without this, all agents run sequentially. For a scaled team with 3 iterations, parallel mode can reduce wall-clock time significantly.

**Verdict seems overly cautious (too many RETHINK verdicts)**
The skill is intentionally conservative — it is cheaper to over-flag than to miss a blocking issue. If you find the threshold too aggressive for your workflow, consider lowering the complexity threshold with `--threshold=5` to keep the team small, or review the scoring rubric in `scoring-rubric.md` to understand the calibration.

**Plan auto-discovery picks the wrong file**
Auto-discovery selects the most recently modified `.md` file in `.claude/plans/`. If you have multiple plans, pass the explicit path: `/verify-plan .claude/plans/specific-plan.md`.

## FAQ

**Q: Can I use this without the experimental TeamCreate flag?**
A: Yes. The skill falls back to sequential mode. All agents run one at a time instead of in parallel. Results are identical, just slower for complex plans.

**Q: Does this modify my code or plan files?**
A: No. The skill is read-only. It reads your plan and codebase for context but writes nothing. The only output is the verdict report displayed in your terminal.

**Q: What's the difference between PROCEED, REVISE, and RETHINK?**
A: **PROCEED** = no blocking or significant issues remain. **REVISE** = no blocking issues but 1-2 significant ones need attention. **RETHINK** = blocking issues remain after 3 iterations — the plan needs fundamental changes.

**Q: Can I adjust the team size or iteration count?**
A: Team size: yes, via `--team=base|scaled`. Iteration count: fixed at 3 max (this is a convergence guard, not a setting). Complexity threshold: adjustable via `--threshold=N`.

**Q: Is this worth running on small plans?**
A: The skill auto-detects trivial plans (< 5 lines, simple scope) and shortcuts to `PROCEED (trivial)` for ~2K tokens. You don't pay the full cost for simple plans.

**Q: What counts as a "blocking" issue?**
A: A challenge that, if unresolved, would cause the plan to fail at execution time. Examples: missing critical dependency, incorrect API assumption, unhandled failure mode in a core path. The Synthesizer classifies severity based on evidence from the Researcher.

**Q: Can I run this on plans outside `.claude/plans/`?**
A: Yes. Pass the explicit path: `/verify-plan path/to/my-plan.md`. Auto-discovery only searches `.claude/plans/` by default.

**Q: How does the complexity scoring work?**
A: Seven dimensions are evaluated (scope, integrations, unknowns, risk, dependencies, ambiguity, scale), each scored 0-2. The sum (0-14) determines team sizing. A plan touching 3 APIs with unclear error handling might score 9; a single-file refactor with clear scope might score 2.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on proposing improvements or new skills.
