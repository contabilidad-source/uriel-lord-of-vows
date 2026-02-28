# Interview Plugin — Architecture

## Executive Summary

The interview plugin is a structured interview engine for Claude Code that replaces ad-hoc clarification with a formal, multi-phase discovery workflow. When a user's request lacks sufficient context — or when they explicitly invoke `/interview` — the plugin conducts a one-question-at-a-time interview across four phases (Strategic, Context, Tactical, Format), persists state to disk after every answer, synthesizes a mega-prompt from the collected answers, gates on user approval, then generates the deliverable. A companion hook (`vague-prompt-detector.js`) passively scores incoming prompts for underspecification and suggests the interview workflow when appropriate, without auto-invoking it.

## Phase Flow

```
User invokes /interview [goal]
  |
  v
Phase 0: Intake & Calibration
  | Parse goal -> detect domain -> assess complexity -> propose depth
  v
Phase 1: Strategic Discovery (one question at a time)
  | Strategic -> Context -> Tactical -> Format
  | [state saved after each answer]
  | [mid-interview checkpoint every 4 Qs]
  v
Phase 2: Synthesis
  | Select template -> fill slots -> run checklist -> present mega-prompt
  | [three-tier assumptions: convention/inferred/guessed]
  v
Gate: User approves mega-prompt
  |
  v
Phase 3: Deliverable Generation
  |
  v
Phase 3.5: Quality Feedback (1-5 rating)
  | 5=done | 4=tweak | 3=revise | 1-2=re-interview
```

## State Management

### State File

**Location**: `~/.claude/cache/interview-state.json`

**Schema** (version 1):

```
{
  version          : 1
  status           : "active" | "completed" | "aborted"
  started_at       : ISO-8601 timestamp
  goal             : original user statement
  domain           : detected domain (matched from question-bank.md)
  depth            : "QUICK" | "STANDARD" | "DEEP"
  phase            : current phase name
  last_phase       : previous phase name
  question_count   : { current: N, total: N }
  answers          : [{ question, answer, phase }]
  asked_questions  : [question labels already posed]
  assumptions      : [{ text, tier, reasoning }]
  key_insights     : [running list of critical facts]
  key_context      : 3-5 sentence LLM summary of interview progression
}
```

### Flag File

**Location**: `~/.claude/cache/interview-active.flag`
**TTL**: 90 seconds. Timestamp refreshed after each turn. Stale flags are cleaned up on read.

### Write Validation

After every JSON write, the skill reads the file back and verifies it parses. On failure: retry once, then warn the user and dump to `interview-state.backup.txt`.

### Resume Flow

1. On startup, check for existing state file.
2. If found, show summary (goal, domain, depth, answer count, key_context).
3. Ask "Resume or start fresh?" unless `--resume` flag is set.
4. On resume, display all recorded answers and ask "Is anything missing?" before continuing.

### Cleanup

On completion or abort: delete the flag file, keep the state file for potential reuse.

## Hook Behavior

`vague-prompt-detector.js` is a `UserPromptSubmit` hook. It scores prompts for underspecification and suggests `/interview` via `additionalContext`. It never auto-invokes.

### Processing Pipeline

```
stdin (JSON with .prompt)
  |
  v
Fast exits (any match -> silent exit 0):
  - Prompt < 15 chars
  - Greeting pattern (hi, hello, hola, etc.)
  - Slash command (/anything)
  - Contains /interview
  |
  v
Guard checks (any match -> silent exit 0):
  - interview-active.flag exists and is within 90s TTL
  - dispatch-framework plugin is installed
  |
  v
Vague scoring (4 signals, threshold >= 2):
  1. No audience keywords (for, user, client, team, ...)
  2. No scope keywords (about, specific, focus, limit, ...)
  3. No success criteria keywords (should, must, goal, ...)
  4. Low specificity (< 10 words + vague verbs like make/do/create)
  |
  v
Output: additionalContext with missing signals list
  (suggestion only, NOT @DISPATCH)
```

### Fail-Open Design

Any error at any point results in `exit(0)` with no output. The hook never blocks user prompts.

## Token Budget Estimates

| Depth    | Questions | Est. Input Tokens | Est. Output Tokens |
|----------|-----------|-------------------|--------------------|
| QUICK    | 3-5       | ~3K               | ~2K                |
| STANDARD | 6-10      | ~8K               | ~7K                |
| DEEP     | 10-15     | ~15K              | ~15K               |

## Integration Points

**Dispatch framework** (optional): When the dispatch-framework plugin is installed, the vague-prompt-detector hook defers to it entirely (silent exit). The interview skill itself operates independently of dispatch.

**Other skills**: Interview runs first to collect context, then hands off to domain-specific skills with the mega-prompt as context. The interview supersedes CLAUDE.md's "1-2 clarifying questions" rule while active.

**CLAUDE.md**: The plugin complements the Prime Directive ("interview until you understand") by operationalizing it as a formal workflow with state persistence and structured phases.

## File Tree

```
plugins/interview/
  .claude-plugin/plugin.json       Plugin manifest
  CLAUDE.md                        Behavioral instructions
  README.md                        User-facing documentation
  hooks/
    hooks.json                     Hook registration
    vague-prompt-detector.js       Vague prompt detection
  skills/interview/
    SKILL.md                       Core interview logic
    references/
      question-bank.md             7 domains x 4 phases
      synthesis-patterns.md        6 domain templates
  docs/
    architecture.md                This file
```
