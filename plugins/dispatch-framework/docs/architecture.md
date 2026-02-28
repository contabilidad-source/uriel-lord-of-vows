# Dispatch Framework Architecture

## Executive Summary

The dispatch framework is a 4-tier system that transforms Claude Code's main conversation thread from an executor into a dispatcher. It uses Claude Code's hook system to intercept prompts, score them against a registry of specialized agents, emit routing directives, and trigger governance reviews after significant code changes. The framework is entirely soft-enforcement: it influences Claude's behavior through injected context but cannot override it.

---

## Design Constraints

### Why Soft Enforcement

Claude Code hooks can inject additional context into the conversation but cannot block tool execution or force specific behavior. Claude's base model behavior -- its tendency to answer directly rather than delegate -- cannot be overridden, only influenced. The framework accepts this constraint and optimizes for nudging rather than blocking. Observed compliance is approximately 84%.

### Why Hooks

Hooks are the only integration point Claude Code provides for intercepting user prompts, tool invocations, and tool completions. There is no plugin API, no middleware layer, and no way to modify Claude's system prompt directly. Hooks are the framework's sole mechanism for influencing behavior.

### Why Registry-Based

A JSON registry enables:

- **Portability**: The entire dispatch configuration travels with the plugin as a single file
- **Extensibility**: Users add agents by editing JSON, not JavaScript
- **Transparency**: The scoring logic is deterministic and inspectable
- **Separation of concerns**: Routing rules live in data, routing logic lives in code

---

## Architecture Overview

```
                          User Prompt
                               |
                               v
                   +-----------------------+
  Tier 1           | UserPromptSubmit Hook |
  (Routing)        |   dispatch-router.js  |
                   +-----------+-----------+
                               |
              +----------------+----------------+
              |                |                |
         [Greeting]     [Slash Cmd]      [Score Registry]
          pass-thru      set flag          |
                                     best match?
                                    /          \
                                  yes           no
                                   |             |
                          @DISPATCH:name:tool   fallback to
                                               general-coder
                               |
                               v
                   +-----------------------+
  Tier 2           |   PreToolUse Hook     |
  (Enforcement)    | dispatch-enforcer.js  |
                   +-----------+-----------+
                               |
                    tool is Edit/Write/Bash/NotebookEdit?
                       /                    \
                     yes                     no
                      |                    (pass)
               flag active?
               /          \
             yes           no
           (pass)     emit WARNING
                               |
                               v
                   +-----------------------+
  Tier 3           |   PostToolUse Hook    |
  (Governance)     | governance-router.js  |
                   +-----------+-----------+
                               |
                    tool was Write/Edit on code file?
                       /                    \
                     yes                     no
                      |                    (pass)
              count code lines
              check governance triggers
                      |
               threshold met?
               /          \
             yes           no
              |           (pass)
    @GOVERNANCE:name:tool:file:reason

                   +-----------------------+
  Tier 4           |      CLAUDE.md        |
  (Behavioral)     | Dispatch instructions |
                   +-----------------------+
       Reinforces: delegate via Task, relay results, stop
```

### Tier 1: Prompt Routing

**Hook:** `UserPromptSubmit`
**Script:** `dispatch-router.js`
**Input:** `{ "prompt": "..." }`
**Output:** `@DISPATCH:name:tool` directive (or nothing)

The router executes a pipeline of checks in order:

1. **Length guard**: Prompts under 3 characters are ignored
2. **Stale flag cleanup**: Remove expired skill/command flags (> 90s old)
3. **Greeting detection**: Prompts under 30 chars matching greeting patterns pass through
4. **Short answer detection**: Prompts under 15 chars without action verbs pass through
5. **Slash command detection**: Prompts starting with `/` set a command flag and pass through
6. **File extension routing**: Prompts mentioning known file extensions route to corresponding skills
7. **Registry scoring**: Each entry is scored; best match above threshold (>= 15) emits a directive
8. **Fallback**: Prompts >= 15 chars with no match emit `@DISPATCH:general-coder:Task`

### Tier 2: Tool Enforcement

**Hook:** `PreToolUse`
**Script:** `dispatch-enforcer.js`
**Matcher:** `Edit|Write|Bash|NotebookEdit|Skill`
**Input:** `{ "tool_name": "...", "tool_input": {...} }`
**Output:** Warning context (or nothing)

The enforcer serves two purposes:

1. **Flag management**: When `tool_name` is `Skill`, it writes a `skill-active.flag` file. This tells subsequent checks that execution tools are expected (a skill is running).
2. **Warning injection**: When `tool_name` is an execution tool (`Edit`, `Write`, `Bash`, `NotebookEdit`) and no active flag exists, it injects a warning reminding Claude to delegate.

Flag files use a 90-second TTL. They are stored in `~/.claude/cache/` and checked by modification time.

### Tier 3: Governance

**Hook:** `PostToolUse`
**Script:** `governance-router.js`
**Matcher:** `Write|Edit`
**Input:** `{ "tool_name": "...", "tool_input": {...} }`
**Output:** `@GOVERNANCE:name:tool:file:reason` directive (or nothing)

The governance router evaluates completed code writes against configurable thresholds:

1. Verify the file has a recognized code extension (`.py`, `.js`, `.ts`, `.go`, etc.)
2. Count non-empty, non-comment lines of code
3. Check the `governance` section of `registry.json` for matching triggers
4. Emit a `@GOVERNANCE` directive for the highest-priority matching trigger

Governance triggers are evaluated in priority order:
- **council-protocol**: Financial, legal, or security keywords detected
- **multipersona-audit**: 30+ code lines or high-stakes keywords
- **audit-loop**: 20+ code lines or governance keywords (with 10-line minimum for keyword-only)

### Tier 4: Behavioral Instructions

**File:** `CLAUDE.md`

The plugin's CLAUDE.md provides instructions that Claude reads at session start. These reinforce:

- Main thread should prefer Task and Skill over direct execution tools
- `@DISPATCH` directives should be followed immediately
- `@GOVERNANCE` directives should never be skipped
- Slash commands should invoke the Skill tool directly
- Complex tasks should use the swarm protocol (TeamCreate / TaskCreate / coordinate / TeamDelete)

This tier has no runtime enforcement mechanism. It relies on Claude's instruction-following behavior.

---

## Scoring Algorithm

### Formula

For each registry entry, the score is calculated as:

```
score = (pattern_matches * 20) + (trigger_matches * 10) + (priority * 0.05)
```

If any exclusion pattern matches, the entry scores 0 and is skipped entirely.

### Scoring Examples

**Prompt: "build a REST API with authentication"**

| Entry | Pattern Hits | Trigger Hits | Priority | Score |
|-------|-------------|-------------|----------|-------|
| general-coder | `build` (+20), `api` (+20) | -- | 50 | 42.5 |
| task-orchestrator | -- | -- | 75 | 0 |
| system-prompt-architect | -- | -- | 80 | 0 |

Result: `@DISPATCH:general-coder:Task` (score 42.5)

**Prompt: "audit this code for security issues"**

| Entry | Pattern Hits | Trigger Hits | Priority | Score |
|-------|-------------|-------------|----------|-------|
| general-coder | `code` (+20) | -- | 50 | excluded by `audit` |
| multipersona-auditor | `audit` (+20), `code review` (+20) | -- | 85 | 44.25 |

Result: `@DISPATCH:multipersona-auditor:Task` (score 44.25)

**Prompt: "brainstorm ideas for a mobile app"**

| Entry | Pattern Hits | Trigger Hits | Priority | Score |
|-------|-------------|-------------|----------|-------|
| general-coder | -- | -- | 50 | excluded by `brainstorm` |
| brainstorm-thinktank | `brainstorm` (+20) | -- | 76 | 23.8 |

Result: `@DISPATCH:brainstorm-thinktank:Task` (score 23.8)

### Threshold and Tie-Breaking

- **Minimum threshold**: 15 points. Entries scoring below this are discarded.
- **Tie-breaking order**: (1) Higher priority, (2) Fewer triggers (more specific), (3) Array position (first wins)

---

## Compliance Model

### Observed Behavior

The framework achieves approximately 84% dispatch compliance in practice. This means that in roughly 84% of interactions where dispatch is appropriate, Claude follows the `@DISPATCH` directive and delegates to an agent rather than executing directly.

### Why Not 100%

Several factors reduce compliance:

1. **Base model tendency**: Claude's training optimizes for helpfulness, which it often interprets as answering directly. The dispatch pattern conflicts with this default when the task appears simple.

2. **Soft enforcement**: Warnings are injected as context, not as hard blocks. Claude can and does ignore them when it judges direct execution to be more efficient.

3. **Greeting edge cases**: Short prompts with action verbs (e.g., "fix this", "run tests") sometimes pass through the greeting detector but score below the registry threshold.

4. **Context window pressure**: In long conversations, earlier CLAUDE.md instructions may lose influence as the context fills with recent exchanges.

### What Fails Most Often

- Single-line fix requests ("change X to Y") -- Claude often executes directly
- Follow-up prompts in an existing conversation -- dispatch feels unnecessary
- Prompts that Claude perceives as trivial -- the efficiency heuristic overrides

---

## Extension Points

### Registry Entries

Add entries to the `entries[]` array in `registry.json`. Each entry needs at minimum: `name`, `description`, `tool`, `subagent_type`, and `keywords`. See the plugin README for the full schema.

### Governance Triggers

Add named sections to the `governance` object in `registry.json`. Each trigger needs:

```json
{
  "triggers": {
    "code_lines_min": 30,
    "keywords_any": ["keyword1", "keyword2"]
  },
  "tool": "Task"
}
```

The governance router checks triggers in the order they appear in the JSON. Higher-stakes triggers should be listed first.

### FILE_EXT_MAP

In `dispatch-router.js`, extend the `FILE_EXT_MAP` object to route additional file types to skills:

```javascript
const FILE_EXT_MAP = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".xlsx": "xlsx",
  ".pptx": "pptx",
  ".csv": "csv"
};
```

Each key is a file extension; each value is the skill name passed to `@DISPATCH:name:Skill`.

### CLAUDE.md Customization

The plugin's `CLAUDE.md` is loaded by Claude Code at session start. It can be extended with:

- Domain-specific dispatch rules
- Additional tool preferences
- Custom swarm protocol variations
- Project-specific agent routing hints

---

## Data Flow Summary

```
User types prompt
  --> stdin to dispatch-router.js
    --> JSON parsed, prompt extracted
    --> Fast-path checks (greeting, short, slash)
    --> File extension check
    --> Registry loaded, entries scored
    --> Best match emitted as @DISPATCH:name:tool
      --> Claude reads directive in additionalContext
        --> Claude spawns Task(subagent_type="name")
          --> Agent executes work
            --> Agent uses Write/Edit
              --> governance-router.js evaluates output
                --> @GOVERNANCE emitted if threshold met
                  --> Claude spawns review agent
```

Each arrow represents a handoff. The framework has no persistent state between prompts beyond the TTL-based flag files.

---

## Security Considerations

- **Fail-open design**: Every hook catches all errors and exits with code 0. A broken hook never blocks Claude Code.
- **No network calls**: All hooks are local-only. No data leaves the machine beyond normal Claude API calls.
- **No secrets in registry**: The registry contains only routing patterns and agent names. No API keys, tokens, or credentials.
- **ReDoS mitigation**: The router skips regex patterns containing nested quantifiers, though this is a heuristic defense, not comprehensive.
- **Flag file safety**: Flag files contain only timestamps. They are written to `~/.claude/cache/` with a 90-second TTL.
