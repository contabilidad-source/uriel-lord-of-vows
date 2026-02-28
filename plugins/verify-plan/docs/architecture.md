# verify-plan -- Architecture Overview

## Executive Summary

verify-plan implements a convergence-loop debate system for adversarial plan verification. 3-5 agents iterate up to 3 times, challenging a plan's approach, researching unknowns, and synthesizing findings until binary convergence criteria are met.

## Core Concept: Convergence Loop

The system uses binary resolution tracking (not numeric scores) for loop control:

```
Iteration 1:
  Challenger -> challenges + unknowns manifest
  Resolver (Mode 1) -> resolved unknowns
  Researcher Mode 2 (SURFACE) -> surfaced context
  Researcher Mode 3 (PROBE) -> probed risks
  Synthesizer -> resolution state + convergence check

Iterations 2-3 (if needed):
  Challenger -> updated challenges (focus on unresolved)
  Resolver (Mode 1) -> resolves remaining unknowns
  Researcher Modes 2-3 -> SKIPPED unless RE-SWEEP/RE-PROBE
  Synthesizer -> re-evaluates convergence
```

## Agent Interaction Topology

Hub-and-spoke with main thread as the hub. No direct agent-to-agent messaging.

```
Main Thread (orchestrator + state holder)
    +--[spawn]----> Challenger --[return]----> challenges + unknowns
    +--[spawn]----> Resolver --[return]------> resolved unknowns
    +--[spawn]----> Researcher --[return]----> surfaced + probed
    +--[spawn]----> Synthesizer --[return]---> resolution state
    +--[evaluate]-> CONVERGED? / BLOCKED? / CONTINUE?
```

Each agent is a fresh Task spawn -- no persistent agents, no state carryover between iterations.

## Three-Mode Research System

| Mode | Agent | Purpose | Trigger |
|------|-------|---------|---------|
| Mode 1: RESOLVE | plan-resolver | Answer specific unknowns | Every iteration (if unknowns exist) |
| Mode 2: SURFACE | plan-researcher | Sweep for unknown knowns | Iteration 1 (or RE-SWEEP) |
| Mode 3: PROBE | plan-researcher | Hunt for unknown unknowns | Iteration 1 (or RE-PROBE) |

Mode 1 is convergent (answering specific questions). Modes 2-3 are divergent (discovering things nobody asked).

## Challenge Lifecycle

```
OPEN --> RESOLVED    (evidence settles it)
     --> UNRESOLVED  (confirmed real, no mitigation)
     --> DEFERRED    (MINOR only, handle during implementation)
     --> WITHDRAWN   (premise invalidated by evidence)
```

## Convergence Criteria

| Verdict | Condition |
|---------|-----------|
| PROCEED | Zero BLOCKING + zero SIGNIFICANT open/unresolved |
| REVISE | Zero BLOCKING + 1-2 SIGNIFICANT unresolved with mitigations |
| REVISE (strong) | Zero BLOCKING + 3+ SIGNIFICANT unresolved with mitigations |
| RETHINK | BLOCKING persists after iteration 3 |

## Scoring vs. Convergence

**Binary tracking controls the loop.** The quality score (1-10) is calculated once, on the final iteration, as informational context only.

| Dimension | Weight |
|-----------|--------|
| Approach Soundness | 25% |
| Risk Coverage | 20% |
| Assumption Validity | 15% |
| Integration Feasibility | 15% |
| Unknowns Coverage | 15% |
| Constraint Alignment | 10% |

A plan can score 5/10 and PROCEED (if all challenges resolved). A plan can score 9/10 and RETHINK (if a BLOCKING issue persists).

## Convergence Guards

- Max 5 challenges per iteration from Challenger
- Max 2 new challenges per iteration from Researcher (Modes 2-3)
- Max 8 active challenges total
- Net resolution rule: each iteration must resolve more than it creates
- DEGRADATION detection: if creating more problems than solving -> force assessment

## Team Sizing

Complexity score (0-16) determines team size:

| Factor | Points |
|--------|--------|
| Steps/phases | +1/step (max 3) |
| Distinct domains | +1/domain (max 3) |
| External integrations | +2/system (max 4) |
| Compliance/regulatory | +2 |
| Unknown signals | +1 each (max 3) |
| 10+ referenced files | +1 |

- Score < 7 AND unknowns <= 3 -> BASE team (3 agents)
- Score >= 7 OR unknowns > 3 -> SCALED team (5 agents)

## Token Budget

| Scenario | Typical | Worst Case |
|----------|---------|------------|
| Trivial plan | ~2K | ~2K |
| Base team, 1 iteration | ~45K | ~55K |
| Base team, 3 iterations | ~95K | ~150K |
| Scaled team, 1 iteration | ~70K | ~85K |
| Scaled team, 3 iterations | ~150K | ~215K |

## Agent Failure Protocol

If a Task agent fails mid-loop:
1. Challenger failure -> skip challenge, carry forward previous
2. Researcher failure -> skip research, note "unavailable"
3. Synthesizer failure -> FORCE EXIT with partial results
4. 2+ failures same iteration -> FORCE EXIT
5. Never retry failed agent in same iteration

## File Structure

```
plugins/verify-plan/
├── .claude-plugin/plugin.json    # Plugin manifest
├── agents/                        # 6 agent definitions
│   ├── plan-challenger.md         # Adversarial challenger (opus)
│   ├── plan-resolver.md           # Unknown resolver (sonnet)
│   ├── plan-researcher.md         # Modes 2-3 research (sonnet/opus)
│   ├── plan-synthesizer.md        # Convergence controller (opus)
│   ├── plan-domain-expert.md      # Domain specialist (sonnet)
│   └── plan-devils-advocate.md    # Black-swan hunter (opus)
├── skills/verify-plan/            # Skill definition
│   ├── SKILL.md                   # Main orchestrator instructions
│   ├── protocol.md                # Inter-agent protocol + schemas
│   └── scoring-rubric.md          # Quality scoring dimensions
├── CLAUDE.md                      # Plugin behavioral instructions
├── README.md                      # User documentation
└── docs/architecture.md           # This file
```
