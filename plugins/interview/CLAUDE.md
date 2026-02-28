<interview>

# interview — Plugin Behavioral Instructions

## Invocation

`/interview [goal] [--depth=QUICK|STANDARD|DEEP] [--resume]`

## What It Does

Conducts structured one-question-at-a-time interviews to extract full context before generating deliverables. Produces synthesized mega-prompts with three-tier assumption management and quality-gated output. The interview replaces ad-hoc clarifying questions with a formal discovery workflow that ensures nothing critical is missed before execution begins.

## When to Activate

- User invokes `/interview`
- User says "interview me", "help me figure out", "I'm not sure what I want"
- Auto-detection via vague-prompt-detector hook suggests it (user must opt in)

## Interview Phases

| Phase | Name | Purpose |
|-------|------|---------|
| 0 | Intake | Parse goal, detect domain, assess complexity, propose depth, wait for confirmation |
| 1 | Discovery | One question at a time across Strategic > Context > Tactical > Format sequencing |
| 2 | Synthesis | Assemble answers into a mega-prompt using domain-matched templates |
| Gate | Approval | Present mega-prompt, require explicit user approval before proceeding |
| 3 | Generation | Produce deliverable from approved mega-prompt, offer iteration |
| 3.5 | Quality Check | Verify output matches intent, offer adjustments or alternative versions |

## State Management

- **State file**: `~/.claude/cache/interview-state.json` — full interview state (goal, domain, depth, answers, assumptions, insights)
- **Flag file**: `~/.claude/cache/interview-active.flag` — 90-second TTL, updated each turn
- Auto-save after each user answer (write + read-back validation)
- On startup, check for existing state file and offer to resume (or resume directly with `--resume`)
- One active interview at a time
- On completion or abort: delete flag file, keep state file for potential reuse

## Escape Hatches

### Natural Language Escapes

Match as standalone utterances only — if embedded in a longer answer (e.g., "I think that's enough detail about the API"), do NOT trigger. The message must be < 30 chars total, or the escape phrase must be > 70% of the message.

| Phrase | Behavior |
|--------|----------|
| "enough" / "that's enough" | Jump to Phase 2 (Synthesis) with what you have |
| "skip ahead" | Skip remaining questions in current phase, move to next. Warn if Strategic minimum (2 Qs) not met |
| "abort" / "cancel" | End interview, clean up state, summarize what was gathered |
| "back" | Revisit previous question, show its current answer, accept replacement |
| "save and quit" | Persist state to file, confirm with path, exit cleanly for later `--resume` |
| "show progress" | Display phase, questions asked/remaining, key insights, slot coverage % |
| "change depth" | Recalibrate depth mid-interview, adjust remaining question count, confirm new total |

### Formal Flags

| Flag | Effect |
|------|--------|
| `--skip` | Skip current phase |
| `--abort` | Abort interview, clean up state |
| `--resume` | Resume previous interview without asking |
| `--progress` | Show interview progress |
| `--depth=QUICK\|STANDARD\|DEEP` | Set or change interview depth |

## Key Rules (Anti-Patterns)

- NEVER ask more than one question per turn
- NEVER skip state file updates after receiving an answer
- NEVER proceed to generation without explicit user approval at the gate
- NEVER accept vague answers without follow-up probes
- NEVER ask questions already answered by user input
- NEVER skip the progress indicator
- ALWAYS show the progress status line (`[Interview: N/total | Phase | Key insights]`)
- ALWAYS reflect on the user's answer before asking the next question — demonstrate active thinking, not just acknowledgment
- ALWAYS cover at least Strategic + one other phase before synthesis
- Match standalone escape phrases only, not phrases embedded in longer answers

## Assumption Management

Three-tier system for handling information gaps:

| Tier | Label | Confidence | Handling |
|------|-------|------------|----------|
| Convention | `[CONVENTION]` | High | Safe defaults based on domain norms. No confirmation needed |
| Inferred | `[INFERRED]` | Medium | Derived from answers but not explicitly stated. Verify at gate |
| Guessed | `[GUESSED]` | Low | Zero-signal slots filled with best guess. Must confirm before generation |

**Budgets by depth**:

| Depth | Guessed (max) | Convention/Inferred |
|-------|---------------|---------------------|
| QUICK | 2 | unlimited |
| STANDARD | 4 | unlimited |
| DEEP | 6 | unlimited |

If the guessed budget is exceeded, stop and ask the user instead of guessing. Slots with absolutely no signal are marked `[NEEDS INPUT]` and must be resolved at the gate before proceeding.

## Dispatch Framework Integration

Optional integration. If dispatch-framework is installed, the vague-prompt-detector hook stays silent (dispatch handles routing). The interview skill works independently when dispatch is not present. Users can add interview to the dispatch registry for automatic routing of vague requests.

This skill supersedes the CLAUDE.md "1-2 clarifying questions minimum" rule when active — the structured interview IS the clarification process, but deeper.

## Domains

| Domain | Scope |
|--------|-------|
| Writing | Content, copy, documentation, creative writing |
| Code / Technical | Software, architecture, debugging, APIs |
| Strategy / Business | Planning, operations, market analysis, processes |
| Prompts / AI | Prompt engineering, AI workflows, model configuration |
| Research / Analysis | Investigation, data analysis, competitive research |
| Design / UX | UI/UX, visual design, user flows, prototyping |
| Mixed | Cross-domain tasks that span multiple categories |

</interview>
