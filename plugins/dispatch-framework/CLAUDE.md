<dispatch-framework>

# Dispatch Framework

## DISPATCH
The main conversation thread acts as a **dispatcher**. Prefer delegating execution work to specialized agents via the Task tool. Direct tool use (Edit, Write, Bash) is acceptable for simple, quick tasks.

This improves traceability and keeps the main thread focused on orchestration.

**Tool preferences (main thread):**
- PREFER: Task (spawn agents), Skill (invoke skills), Read/Glob/Grep (quick lookups)
- DIRECT USE OK: Edit, Write, Bash — for simple tasks that don't warrant an agent

**Dispatch behavior:**
- `@DISPATCH:name:tool` directives → follow immediately (invoke the named agent or skill)
- `/slash-commands` → invoke via Skill tool immediately
- Non-trivial requests with no directive → consider spawning a Task agent for the work
- After dispatching → relay the result to the user and stop

**Swarm protocol (for complex tasks):**
Decompose → TeamCreate → one Task per sub-problem → coordinate → relay summary → TeamDelete.

## HOOKS
- `@DISPATCH:name:tool` → execute immediately, no confirmation needed
- `@GOVERNANCE:name:tool:path:reason` → execute silently, never skip
- `/slash-commands` → invoke Skill immediately
- Hook system failure → read the agents registry, match intent manually

</dispatch-framework>
