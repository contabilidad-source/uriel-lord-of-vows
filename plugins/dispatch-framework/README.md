# dispatch-framework

A 4-tier agent dispatch framework for Claude Code. Routes user prompts to specialized agents and skills via registry-based scoring, enforces delegation patterns through PreToolUse warnings, and triggers governance reviews on significant code changes.

---

## What It Does

The dispatch framework turns Claude Code's main conversation thread into a **dispatcher** rather than an executor. Instead of the main thread reading, writing, and running code directly, it delegates work to specialized subagents via the Task tool.

This is achieved through a pipeline of three Claude Code hooks that fire at different stages of each interaction:

```
User prompt
    |
    v
[UserPromptSubmit] --> dispatch-router.js --> @DISPATCH directive
    |
    v
[PreToolUse] -------> dispatch-enforcer.js --> Warning if main thread executes
    |
    v
[PostToolUse] ------> governance-router.js --> @GOVERNANCE directive for review
```

The result: prompts get routed to the right agent automatically, the main thread is discouraged from doing execution work, and significant code changes trigger quality reviews.

---

## Architecture

The framework operates across four tiers:

| Tier | Hook Event | Script | Purpose |
|------|-----------|--------|---------|
| 1 | UserPromptSubmit | dispatch-router.js | Score prompt against registry, emit `@DISPATCH` directive |
| 2 | PreToolUse | dispatch-enforcer.js | Warn when execution tools are used on main thread |
| 3 | PostToolUse | governance-router.js | Emit `@GOVERNANCE` directive after significant code changes |
| 4 | CLAUDE.md | (behavioral) | Reinforce dispatch pattern via system instructions |

Tier 1 handles routing. Tier 2 handles enforcement. Tier 3 handles quality. Tier 4 provides the behavioral foundation that makes Claude receptive to the directives from Tiers 1-3.

---

## Prerequisites

- **Claude Code** installed and functional ([documentation](https://docs.anthropic.com/en/docs/claude-code))
- **Node.js** (any version that ships with Claude Code is sufficient -- hooks run as Node scripts)
- **uriel-lord-of-vows** repository cloned or accessible

---

## Install

### Via Plugin System

```bash
claude plugin add dispatch-framework@uriel-lord-of-vows
```

### Manual Alternative

Clone the repository and symlink or copy the plugin directory:

**Linux / macOS:**

```bash
git clone https://github.com/contabilidad-source/uriel-lord-of-vows.git
ln -s "$(pwd)/uriel-lord-of-vows/plugins/dispatch-framework" ~/.claude/plugins/dispatch-framework
```

**Windows (PowerShell as Administrator):**

```powershell
git clone https://github.com/contabilidad-source/uriel-lord-of-vows.git
New-Item -ItemType SymbolicLink `
  -Path "$env:USERPROFILE\.claude\plugins\dispatch-framework" `
  -Target "$(Get-Location)\uriel-lord-of-vows\plugins\dispatch-framework"
```

> Windows symlinks require Administrator PowerShell or Developer Mode. If neither is available, use a junction:
> ```cmd
> cmd /c mklink /J "%USERPROFILE%\.claude\plugins\dispatch-framework" "uriel-lord-of-vows\plugins\dispatch-framework"
> ```

---

## Migration from Manual Setup

If you previously added dispatch hooks manually to your `settings.json` or project `.claude/settings.json`, **remove those entries after installing this plugin**.

Hook registration is additive. Keeping both the manual hooks and the plugin hooks causes **double execution per event**.

**Symptoms of double-hook registration:**

- Duplicate `@DISPATCH` directives appearing in context
- Agents being spawned twice for the same prompt
- Double `@GOVERNANCE` triggers on code changes
- Performance degradation (each hook script runs twice)

**To fix:** Remove the `UserPromptSubmit`, `PreToolUse`, and `PostToolUse` entries from your manual settings that reference `dispatch-router.js`, `dispatch-enforcer.js`, or `governance-router.js`. The plugin's `hooks.json` handles all registration.

---

## How It Works

### Tier 1: Prompt Routing (UserPromptSubmit)

When a user submits a prompt, `dispatch-router.js` runs through this sequence:

1. **Fast-path checks** (no registry load needed):
   - Greetings (`hi`, `hello`, `hola`, etc.) -- pass through, no dispatch
   - Short answers (< 15 chars, no action verbs) -- pass through
   - Slash commands (`/something`) -- set command flag, pass through
2. **File extension routing**: If prompt mentions `.pdf`, `.docx`, `.xlsx`, `.pptx`, or `.csv`, route to the corresponding skill
3. **Registry scoring**: Load `registry.json`, score each entry against the prompt
4. **Emit directive**: Best match above threshold emits `@DISPATCH:name:tool`
5. **Fallback**: Prompts >= 15 chars with no match emit `@DISPATCH:general-coder:Task`

### Scoring Formula

Each registry entry is scored as follows:

| Component | Points | Description |
|-----------|--------|-------------|
| Pattern match (regex) | +20 each | Entry's `patterns[]` tested against prompt |
| Trigger match (substring) | +10 each | Entry's `triggers[]` tested against prompt (case-insensitive) |
| Exclusion match | 0 (entry skipped) | If any `exclusions[]` match, entry scores 0 |
| Priority bonus | priority * 0.05 | Higher priority entries get slight score boost |

**Minimum threshold:** Score must be >= 15 for a match. This ensures at least one pattern or a pattern+trigger combination must match.

**Tie-breaking:** Higher priority wins. If still tied, fewer triggers wins (more specific entry). If still tied, first entry in array wins.

### Tier 2: Enforcement (PreToolUse)

When any tool is about to execute, `dispatch-enforcer.js` checks:

- If the tool is `Skill`, it writes a `skill-active.flag` and exits (no warning)
- If the tool is `Edit`, `Write`, `Bash`, or `NotebookEdit`:
  - Check if `skill-active.flag` or `command-active.flag` is active (< 90s old)
  - If a flag is active: no warning (execution is expected during skill/command processing)
  - If no flag is active: emit a warning reminding the main thread to delegate

This is **soft enforcement only**. The warning is injected as context but does not block tool execution.

### Tier 3: Governance (PostToolUse)

After `Write` or `Edit` completes on a code file, `governance-router.js`:

1. Checks if the file has a code extension (`.py`, `.js`, `.ts`, `.go`, etc.)
2. Counts non-empty, non-comment lines of code in the written/edited content
3. Evaluates governance triggers from `registry.json`:
   - **council-protocol**: Fires on financial/legal/security keywords
   - **multipersona-audit**: Fires on 30+ code lines or high-stakes keywords
   - **audit-loop**: Fires on 20+ code lines or governance keywords
4. Emits `@GOVERNANCE:name:tool:filename:reason` for the highest-priority trigger

---

## Customization

### Adding Registry Entries

Edit `agents/registry.json` to add new agent routing entries. Each entry in the `entries[]` array defines a dispatchable agent.

### Modifying Governance Triggers

The `governance` section of `registry.json` controls when post-execution reviews fire. Adjust `code_lines_min` thresholds or `keywords_any` arrays to change sensitivity.

### Extending FILE_EXT_MAP

In `hooks/dispatch-router.js`, the `FILE_EXT_MAP` object maps file extensions to skill names. Add entries to route new file types:

```javascript
const FILE_EXT_MAP = {
  ".pdf": "pdf", ".docx": "docx", ".xlsx": "xlsx",
  ".pptx": "pptx", ".csv": "csv",
  ".svg": "svg-processor"  // custom addition
};
```

### Customizing CLAUDE.md

The plugin's `CLAUDE.md` provides behavioral instructions that reinforce the dispatch pattern. You can edit it to adjust tool preferences, add domain-specific dispatch rules, or modify the swarm protocol.

---

## Registry Entry Format

Each entry in `registry.json` follows this schema:

```json
{
  "name": "my-agent",
  "description": "What this agent specializes in",
  "tool": "Task",
  "subagent_type": "my-agent",
  "priority": 75,
  "keywords": [
    "\\b(keyword1|keyword2|keyword3)\\b"
  ],
  "exclusions": [
    "\\b(excluded_term)\\b"
  ],
  "model_tier": "opus"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier, used in `@DISPATCH:name:tool` |
| `description` | Yes | Human-readable purpose |
| `tool` | Yes | `Task` or `Skill` |
| `subagent_type` | Yes (for Task) | Passed to `Task(subagent_type=...)` |
| `priority` | No (default: 50) | 0-100, higher = slight scoring advantage + tie-breaker |
| `keywords` | Yes | Array of regex patterns (scored at +20 each) |
| `exclusions` | No | Array of regex patterns that disqualify this entry |
| `model_tier` | No | Hint for model selection (`opus`, `sonnet`, etc.) |
| `triggers` | No | Array of substring matches (scored at +10 each) |

---

## Escape Hatches

The following bypass dispatch routing entirely:

- **Greetings and acknowledgments**: `hi`, `hello`, `thanks`, `ok`, `yes`, `no`, etc. (< 30 chars, matching greeting pattern)
- **Short answers**: Prompts under 15 characters with no action verbs
- **Slash commands**: Any prompt starting with `/` sets a command flag and passes through
- **Active skill/command flag**: If a skill or command was invoked within the last 90 seconds, execution tool warnings are suppressed
- **Very short prompts**: Prompts under 3 characters are ignored entirely

---

## Known Limitations

1. **Soft enforcement only**: The PreToolUse hook emits warnings but cannot block tool execution. Observed compliance is approximately 84%. Claude's base behavior occasionally overrides the dispatch pattern, especially for prompts it perceives as simple.

2. **ReDoS protection is basic**: The router skips regex patterns containing nested quantifiers (`++`, `*+`, `{}{`), but this is a heuristic, not a full ReDoS defense. Avoid complex nested patterns in registry entries.

3. **Flag TTL window**: The skill/command active flags expire after 90 seconds. Long-running skills that take more than 90 seconds may see enforcement warnings mid-execution.

4. **Greeting misclassification**: Short prompts with action verbs (e.g., "build it") may bypass greeting detection but score below the registry threshold, resulting in a general-coder fallback.

5. **No persistent state**: The framework is stateless across sessions. Flag files are ephemeral (TTL-based). There is no learning or adaptation between conversations.

6. **Single-directive output**: Only one `@DISPATCH` directive is emitted per prompt. If a prompt spans multiple domains, only the highest-scoring agent is selected.

---

## Troubleshooting

### Hooks Not Firing

1. Verify the plugin is installed: check that `hooks.json` is being loaded by Claude Code
2. Check that Node.js is available in your PATH
3. Verify file permissions: hook scripts need execute permission on Unix systems
   ```bash
   chmod +x plugins/dispatch-framework/hooks/*.js
   ```
4. Test a hook manually:
   ```bash
   echo '{"prompt":"build a REST API"}' | node hooks/dispatch-router.js
   ```

### Double Dispatch Directives

You have both manual hook entries in `settings.json` and the plugin installed. Remove the manual entries. See [Migration from Manual Setup](#migration-from-manual-setup).

### Windows Path Issues

- Use forward slashes or properly escaped backslashes in registry patterns
- The `CLAUDE_PLUGIN_ROOT` variable in `hooks.json` is resolved by Claude Code -- do not replace it manually
- If symlinks fail, use junctions (`mklink /J`) or direct copies instead

### Agents Not Being Spawned

- Check that the `@DISPATCH` directive appears in the conversation context
- Verify the registry entry's `name` and `tool` fields are correct
- If score is below 15, no match is emitted -- add more specific patterns to the registry entry

### Governance Not Triggering

- Only fires on code files (check the extension list in `governance-router.js`)
- Only fires on `Write` and `Edit` tools (not `Bash`)
- Check that `registry.json` has a `governance` section with configured triggers

---

## FAQ

**Q: Does this block me from using tools directly?**
No. Enforcement is soft -- it injects a warning but never blocks. You can always use Edit, Write, or Bash directly. The framework nudges toward delegation but does not prevent direct execution.

**Q: What happens if registry.json has a syntax error?**
The framework fails open. If the registry cannot be parsed, dispatch-router.js exits silently and no `@DISPATCH` directive is emitted. Claude proceeds with its default behavior.

**Q: Can I use this without the governance tier?**
Yes. Remove or empty the `governance` section in `registry.json` and remove the `PostToolUse` entry from `hooks.json`. Tiers 1 and 2 work independently.

**Q: How do I add a new specialized agent?**
Add an entry to `registry.json` with `patterns` that match the prompts you want routed to it. Set `tool` to `Task` and `subagent_type` to a descriptive name. See [Registry Entry Format](#registry-entry-format).

**Q: What is the `model_tier` field for?**
It is a hint that the CLAUDE.md or dispatch logic can use to request a specific model tier (e.g., Opus for complex auditing tasks). The actual model selection depends on your Claude Code configuration and account capabilities.

---

## License

MIT -- see [LICENSE](../../LICENSE)
