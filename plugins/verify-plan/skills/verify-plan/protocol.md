# Verify-Plan V2 — Inter-Agent Protocol

**Purpose:** Defines all message schemas, resolution states, convergence criteria, and tool budgets
for the verify-plan V2 convergence loop. This is the single source of truth. ALL agents reference
this file. No agent may define its own schema variants.

---

## 1. Challenge Schema

```yaml
# One block per challenge. id increments globally across all iterations.
challenge:
  id: "C{N}"                        # e.g. C1, C2, C12
  origin: "challenger|domain-expert|devils-advocate|surfaced|probed"
  claim: "The plan assumes X"
  concern: "This fails when Y because Z"
  failure_scenario: "Concretely: if Y occurs, then Z breaks, causing W"
  alternative: "Instead, consider A which avoids Z by doing B"
  severity: "BLOCKING|SIGNIFICANT|MINOR"
  confidence: "HIGH|MED|LOW"
  status: "OPEN|RESOLVED|UNRESOLVED|DEFERRED|WITHDRAWN"
  resolution: "How it was settled — evidence, debate outcome, or user decision"
  iteration_introduced: 1           # integer
```

---

## 2. Unknowns Manifest Schema

```yaml
# Researcher Mode 1 generates these. One block per unknown.
unknown:
  id: "U{N}"                        # e.g. U1, U4
  description: "What we don't know and need to know"
  type: "FILE_MISSING|API_BEHAVIOR|PRIOR_DECISION|STALE_KNOWLEDGE|INTEGRATION_UNKNOWN"
  affects_challenge: "C{N}"        # which challenge this unblocks
  suggested_query: "Exact query to run in memory_search (if available), Grep, or WebSearch"
  resolution: "CONFIRMED|REFUTED|UNRESOLVABLE|PARTIALLY_RESOLVED"
  finding: "[VERIFIED: source | finding | impact]"
```

---

## 3. Surfaced Context Schema

```yaml
# Researcher Mode 2 generates these. One block per finding from memory/codebase/history.
surfaced_context:
  id: "S{N}"                        # e.g. S1, S3
  source: "memory|codebase|claude_md|git_history"
  location: "Exact path, key, or commit hash"
  relevance: "Why this matters to the current plan"
  impact: "changes_needed|confirms_approach|contradicts_plan"
  generates_challenge: "C{N}|null"  # if this finding spawns a new challenge
```

---

## 4. Probed Risk Schema

```yaml
# Researcher Mode 3 generates these. One block per identified risk.
probed_risk:
  id: "P{N}"                        # e.g. P1, P2
  risk: "What could go wrong"
  trigger: "The specific condition that activates this risk"
  cascade: "Downstream consequences if trigger fires"
  probability: "LOW|MED"
  severity: "BLOCKING|SIGNIFICANT|MINOR"
  generates_challenge: "C{N}|null"  # if this risk escalates to a challenge
```

---

## 5. Iteration State Schema

```yaml
# Synthesizer maintains this across all iterations. Full state per iteration.
iteration_state:
  iteration: 1                      # integer, starts at 1
  plan_path: "/absolute/path/to/plan.md"
  plan_quality: "RICH|ADEQUATE|THIN"
  team_mode: "base|scaled"

  challenges:                       # full list — include all, mark status
    - id: "C1"
      status: "OPEN"
      severity: "BLOCKING"

  unknowns:                         # all unknowns this iteration
    - id: "U1"
      resolution: "CONFIRMED"

  surfaced_contexts:                # all surfaced findings this iteration
    - id: "S1"
      impact: "contradicts_plan"
      generates_challenge: "C3"

  probed_risks:                     # all probed risks this iteration
    - id: "P1"
      generates_challenge: "null"

  convergence:
    blocking_open: 0                # count of BLOCKING challenges with status OPEN or UNRESOLVED
    significant_open: 0             # count of SIGNIFICANT challenges with status OPEN or UNRESOLVED
    status: "CONTINUE|CONVERGED|BLOCKED|FORCED_EXIT"

  user_responses: []                # list of user clarifications received this iteration
  synthesizer_directives: []        # instructions synthesizer passed to next iteration
  quality_score: null               # null until final iteration; integer 1-10 when set
```

---

## 6. Resolution States

| State | Meaning |
|-------|---------|
| **OPEN** | Challenge is new, not yet evaluated by any agent |
| **RESOLVED** | Research finding, user input, or agent debate settled the challenge with a clear mitigation or confirmation it is not a real risk |
| **UNRESOLVED** | Confirmed real risk with no viable mitigation identified. Counts against convergence. |
| **DEFERRED** | MINOR severity only. Not worth iterating on. Flagged in report but does not block convergence. |
| **WITHDRAWN** | Challenge was shown to be invalid — based on incorrect assumption or already handled. |

---

## 7. Convergence Criteria (Binary Resolution Tracking)

Convergence is determined by counting OPEN + UNRESOLVED challenges by severity bucket.
Scores are irrelevant to loop control. Binary counts only.

| Status | Trigger | Action |
|--------|---------|--------|
| **CONVERGED → PROCEED** | Zero BLOCKING open/unresolved + Zero SIGNIFICANT open/unresolved | Synthesizer writes final report with PROCEED verdict |
| **CONVERGED → REVISE** | Zero BLOCKING open/unresolved + 1-2 SIGNIFICANT open/unresolved | Final report includes REVISE verdict with mitigations noted inline |
| **CONVERGED → REVISE (strong)** | Zero BLOCKING open/unresolved + 3+ SIGNIFICANT unresolved with mitigations | Final report includes REVISE verdict with "Strongly recommended: address these before proceeding" |
| **BLOCKED → PAUSE** | Any BLOCKING challenge is OPEN or UNRESOLVED | Loop pauses, Synthesizer surfaces specific question(s) to user |
| **FORCED_EXIT → RETHINK** | Any BLOCKING still OPEN or UNRESOLVED after iteration 3 | Loop exits, Synthesizer writes RETHINK verdict — plan needs fundamental revision |

**Advisory note:** If 5+ challenges are DEFERRED across all iterations, the final report MUST include a "Technical Debt Warning" section listing all deferred items. This does not affect the verdict but ensures the user sees the accumulated debt.

---

## 7.5 RE-SWEEP / RE-PROBE Trigger Conditions

The Synthesizer MAY issue RE-SWEEP or RE-PROBE directives when:

| Directive | Trigger Condition |
|-----------|-------------------|
| RE-SWEEP | A new BLOCKING challenge was introduced in iteration N that contradicts previously surfaced context |
| RE-SWEEP | User response in iteration N changes the plan's scope or constraints |
| RE-PROBE | A resolved unknown revealed a new dependency chain not previously probed |
| RE-PROBE | An UNRESOLVED challenge has cascading implications not explored in iteration 1 |

The Synthesizer SHOULD NOT issue RE-SWEEP/RE-PROBE when:
- All challenges are progressing toward resolution (no new information needed)
- The only remaining items are MINOR severity
- Iteration 3 is reached (no further iterations available)

---

## 8. Convergence Guards

These rules prevent the loop from expanding unboundedly.

- **Max new challenges per iteration:** Researcher Modes 2 and 3 combined may surface at most **2 new challenges** per iteration.
- **Max active challenges total:** No more than **8 active challenges** across all iterations at any time (WITHDRAWN and DEFERRED do not count).
- **Net resolution rule:** Each iteration MUST resolve more challenges than it creates. If it creates more than it resolves, this is a **DEGRADATION** event — Synthesizer flags it and tightens scope for the next iteration.
- **Excess challenge handling:** If new challenges would exceed the cap, rank by severity. Keep the top 2 by severity. Tag the rest `DEFERRED_SURFACED` with a note in the final report.

---

## 9. Research Tool Budget (Per Iteration Ceiling)

Budgets are **per agent per iteration**. Exceeding budget requires Synthesizer approval in the iteration state directives.

### Mode 1 — RESOLVE (Researcher targets open challenges)
| Tool | Limit |
|------|-------|
| Read | 8 |
| Grep | 5 |
| memory_search (if available) | 3 |
| WebSearch | 3 |
| WebFetch | 2 |

### Mode 2 — SURFACE (Researcher scans for missed context)
| Tool | Limit |
|------|-------|
| memory_search (if available) | 3 |
| Grep | 4 |
| Read | 3 |
| git log | 1 |

### Mode 3 — PROBE (Researcher stress-tests assumptions)
| Tool | Limit |
|------|-------|
| Grep | 4 |
| Read | 3 |
| memory_search (if available) | 2 |
| WebSearch | 1 (if needed) |

### Combined Totals (All Three Modes)
| Tool | Total Ceiling |
|------|---------------|
| Read | 14 |
| Grep | 13 |
| memory_search (if available) | 8 |
| WebSearch | 4 |
| WebFetch | 2 |

**WebSearch restrictions:** Only permitted for unknown types `API_BEHAVIOR`, `STALE_KNOWLEDGE`,
and `INTEGRATION_UNKNOWN` in Mode 1, and for temporal risks (e.g. deprecation, versioning) in Mode 3.
WebSearch is NEVER used for questions answerable from the local codebase or memory-router (if configured).
