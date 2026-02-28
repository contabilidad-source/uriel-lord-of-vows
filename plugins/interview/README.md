# interview

Structured interview plugin for Claude Code. Extracts full context through one-question-at-a-time interviews before generating deliverables. Produces synthesized mega-prompts and high-quality outputs.

## Quick Start

```bash
claude plugin add interview@uriel-lord-of-vows
```

Invoke with `/interview [goal]`, answer the questions, approve the synthesized mega-prompt, and receive your deliverable.

## Flags & Commands

### Formal Flags

| Flag | Effect |
|------|--------|
| `--skip` | Skip current interview phase |
| `--abort` | Abort interview, clean up state |
| `--resume` | Resume previous interview without confirmation prompt |
| `--progress` | Display interview progress (phase, questions, insights) |
| `--depth=QUICK\|STANDARD\|DEEP` | Set or change interview depth |

### Natural Language Escapes

These are recognized as standalone utterances only. If the phrase appears as part of a longer answer (e.g., "I think that's enough detail about the API"), the escape does not trigger. The message must be fewer than 30 characters total, or the escape phrase must constitute more than 70% of the message.

| Phrase | Effect |
|--------|--------|
| `enough` / `that's enough` | Jump to synthesis with collected answers |
| `skip ahead` | Skip remaining questions in current phase. Warns if Strategic minimum (2 Qs) is unmet |
| `abort` / `cancel` | End interview, clean up state, summarize what was gathered |
| `back` | Return to previous question with its current answer for revision |
| `save and quit` | Persist state to file and exit cleanly. Resume later with `--resume` |
| `show progress` | Display phase, question count, key insights, slot coverage |
| `change depth` | Recalibrate depth mid-interview (adjusts remaining question count) |

## How It Works

### Structured Interviews

The plugin conducts interviews in four sequential phases, asking one question per turn:

```
Strategic (2-3 Qs)   Why this? What outcome? What does good/bad look like?
     |
Context (2-3 Qs)     Who's the audience? What exists? What constraints?
     |
Tactical (1-2 Qs)    What approach? Priority if scope is cut?
     |
Format (1-2 Qs)      Exact deliverable spec? Length? Structure?
```

Each turn includes a reflective acknowledgment (not a generic "got it" -- active synthesis of what the answer means for the deliverable) and a progress indicator showing question count, current phase, and accumulated key insights.

Every 4th answer triggers a checkpoint summary for the user to confirm or correct.

### Domain Detection

The plugin detects the task domain from keyword analysis of the goal statement and selects domain-specific questions accordingly.

| Domain | Example Keywords |
|--------|-----------------|
| Writing | blog, article, draft, newsletter, copy |
| Code | build, implement, API, refactor, script |
| Strategy | plan, roadmap, evaluate, proposal |
| Prompts | system prompt, agent, chatbot, persona |
| Research / Analysis | analyze, investigate, hypothesis, methodology |
| Design / UX | wireframe, prototype, user flow, accessibility |
| Mixed | Multiple domains detected -- uses universal + primary domain questions |

### Depth Calibration

Depth is proposed based on complexity assessment of the goal statement, and the user confirms or adjusts before the interview begins.

| Depth | Questions | When to Use |
|-------|-----------|-------------|
| QUICK | 3-5 | Simple, single-domain, clear deliverable |
| STANDARD | 6-10 | Multi-faceted, some unknowns, moderate scope |
| DEEP | 10-15 | Complex, multi-stakeholder, high-stakes, vague goal |

### Mega-Prompt Synthesis

After the interview (or early exit), the plugin assembles answers into a structured XML mega-prompt using domain-specific templates. The mega-prompt fills slots for role, context, task, requirements, and output spec. Unfilled slots are handled through a three-tier assumption system rather than left blank.

### Three-Tier Assumption System

Assumptions are explicitly categorized so the user knows what to verify:

| Tier | Tag | Meaning | Example |
|------|-----|---------|---------|
| Convention | `<convention>` | Safe default based on standard practice | Blog posts default to conversational tone |
| Inferred | `<inferred>` | Reasonable inference from user's answers | "Technical team" implies internal engineering audience |
| Guessed | `<guessed>` | Zero signal -- must be confirmed by user | Target word count when not mentioned |

Assumption budgets per depth: QUICK allows 2 guesses max, STANDARD 4, DEEP 6. If the budget is exceeded, the plugin asks instead of guessing.

### Gate Approval

The synthesized mega-prompt is always presented for explicit approval before any deliverable is generated. The user can approve, request changes, or restart the interview. The plugin never proceeds without this gate.

## Example Transcript

A QUICK interview for "write a blog post about AI in cooking":

```
User: /interview write a blog post about AI in cooking

Claude: Got it -- you want to write a blog post exploring AI applications in
cooking/food service.

I'm detecting this as a Writing task. I'd suggest a QUICK interview (4 questions)
to make sure I nail it. Here's what I already know from your request:
- Deliverable: blog post
- Topic: AI in cooking
- Domain: Writing

Want to proceed at QUICK, or adjust? (You can say "enough" or "skip ahead"
at any point.)

User: QUICK is fine

Claude: Great. Let's start with the strategic foundation.

**Q1/4**: What's the single takeaway you want readers to walk away with?
Is this meant to inspire cooks to try AI tools, inform industry professionals
about trends, or something else?

`[Interview: 1/4 | Phase: Strategic | Key: blog post, AI + cooking]`

User: I want restaurant owners to realize AI isn't just for tech companies --
there are practical tools they can use right now in their kitchens

Claude: That's a strong angle -- practical, demystifying, aimed at operators who
might feel AI is "not for them." This shifts the tone from theoretical overview
to actionable guide. I should lead with relatable kitchen problems, not
technology jargon.

**Q2/4**: Who's your primary audience -- independent restaurant owners,
chain operators, food truck entrepreneurs? And what do they already know
about AI? Are we starting from zero or building on some awareness?

`[Interview: 2/4 | Phase: Context | Key: demystify AI for non-tech owners, practical tools]`

User: Independent restaurant owners, mostly not tech savvy. Starting from zero.

Claude: Independent operators starting from zero -- that means no acronyms,
no "machine learning vs deep learning" distinctions. Every AI concept needs
a kitchen analogy or a concrete tool name they can search for. The post
needs to feel like advice from a peer, not a lecture from a consultant.

**Q3/4**: What structure works best for your audience -- a listicle
("5 AI Tools You Can Use This Week"), a narrative ("How One Chef Used AI
to Cut Food Waste 30%"), or a practical how-to with steps?

`[Interview: 3/4 | Phase: Tactical | Key: non-tech audience, zero baseline, peer tone]`

User: Listicle with practical examples. Keep it under 1500 words.

Claude: Listicle with real examples, under 1500 words -- tight and scannable.
Each item should be: tool/concept, what it does in plain language, one real
example, and how to get started. No fluff.

**Q4/4**: Where will this be published? And should I include a call to
action at the end -- like linking to specific tools, inviting comments,
or pointing to a follow-up resource?

`[Interview: 4/4 | Phase: Format | Key: listicle, practical, <1500 words]`

User: For our company blog. End with a CTA to our consulting services.

Claude: Company blog with a consulting CTA -- that means the post doubles as
a lead magnet. The tone should be generous with free value (so readers trust
you) but leave enough complexity that they'd want help implementing.

---

## Synthesized Mega-Prompt

Here's what I'll use to generate your deliverable:

<mega-prompt>
  <role>
    You are an expert blog writer specializing in food service technology.
    Voice: practical, peer-to-peer, jargon-free. Style: accessible listicle.
  </role>

  <context>
    <objective>Convince independent restaurant owners that AI tools are
    practical and accessible, not just for tech companies</objective>
    <audience>Independent restaurant owners -- not tech savvy, zero AI
    knowledge, reading on a company blog</audience>
    <brand_voice>Generous, authoritative, peer-like -- not salesy</brand_voice>
  </context>

  <task>
    <deliverable>Blog post (listicle format)</deliverable>
    <thesis>AI has practical, accessible tools restaurant owners can
    use right now in their kitchens</thesis>
  </task>

  <requirements>
    <structure>Listicle -- each item: tool/concept, plain-language
    explanation, real example, getting-started step</structure>
    <evidence>Concrete tool names and real-world examples</evidence>
  </requirements>

  <output_spec>
    <length>~1500 words</length>
    <sections>Hook, 5-7 list items, CTA to consulting services</sections>
  </output_spec>

  <assumptions>
    <convention reason="standard for blog listicles">5-7 items</convention>
    <convention reason="company blog SEO">Include meta description</convention>
    <inferred from="non-tech audience + zero baseline"
      reason="accessibility">No acronyms without definition</inferred>
  </assumptions>
</mega-prompt>

### Assumptions (review required)

**Conventions** (safe defaults -- change if wrong):
- 5-7 list items (standard for blog listicles)
- Include meta description (company blog SEO)

**Inferences** (from your answers -- verify):
- No acronyms without definition (non-tech audience at zero baseline)

No guesses required -- your answers covered the key slots.

**Does this capture your intent? I won't proceed until you approve (or adjust).**

User: Looks good

Claude: Here's your blog post.

[... generated blog post ...]

Here's your blog post. Let me know if you want to:
- Iterate on specific sections
- Adjust tone/depth/scope
- Generate an alternative version
- Save the mega-prompt for reuse
```

## Architecture

### File Tree

```
plugins/interview/
  .claude-plugin/
    plugin.json            # Plugin manifest (name, version, skills path)
  skills/
    interview/
      SKILL.md             # Core interview logic, state machine, escape hatches
      references/
        question-bank.md   # Phase x Domain question matrix + follow-up probes
        synthesis-patterns.md  # Mega-prompt XML templates + assumption taxonomy
  hooks/
    hooks.json             # Hook registration (UserPromptSubmit)
    vague-prompt-detector.js  # Detects underspecified prompts, suggests /interview
  docs/
    .gitkeep               # Documentation directory (future expansion)
  CLAUDE.md                # Behavioral instructions for the plugin
  README.md                # This file
```

### Hook Behavior: vague-prompt-detector

The `UserPromptSubmit` hook runs on every user prompt and scores it for vagueness across four signals:

| Signal | What It Checks |
|--------|---------------|
| No audience | Missing audience/reader/user keywords |
| No scope | Missing scope/boundary/focus keywords |
| No success criteria | Missing goal/outcome/requirement keywords |
| Low specificity | Short prompt (< 10 words) with vague verbs (make, do, create) |

**Threshold**: 2+ missing signals triggers a suggestion to the user (via `additionalContext`, not auto-invocation).

**Guard rails**:
- Skips prompts under 15 characters, greetings, slash commands, and prompts already containing `/interview`
- Suppressed during active interviews (checks flag file)
- Suppressed when dispatch-framework is installed (avoids double-routing)
- Fail-open: any error results in silent exit(0)

### State Management

The plugin maintains interview state across turns and sessions using two files:

| File | Location | Purpose |
|------|----------|---------|
| `interview-state.json` | `~/.claude/cache/` | Full interview state (goal, domain, depth, answers, assumptions, key insights) |
| `interview-active.flag` | `~/.claude/cache/` | Presence flag with 90-second TTL. Prevents hook interference during active interviews |

**State lifecycle**:

```
/interview invoked
     |
     v
Check for existing state file
     |
  [exists?] --yes--> Show summary, ask "Resume or start fresh?"
     |                  (--resume flag skips this prompt)
     no
     |
     v
Create state file + flag file
     |
     v
Per-turn: update state file + refresh flag timestamp
     |
     v
Write validation: read-back + parse check after each write
     |
     v
On completion/abort: delete flag file, keep state file
```

State is written after every answer. If JSON write validation fails, the plugin retries once, then falls back to `interview-state.backup.txt` and warns the user.

## Dispatch Framework Integration

The interview plugin works standalone but is fully compatible with the [dispatch-framework](../dispatch-framework/) if installed. When dispatch is present, the vague-prompt-detector hook auto-disables (dispatch handles routing).

To register the interview plugin with dispatch, add this entry to `registry.json`:

```json
{
  "name": "interview",
  "tool": "Skill",
  "priority": 70,
  "patterns": ["\\b(interview\\s*me|help\\s*me\\s*figure|not\\s*sure\\s*what)\\b"],
  "triggers": ["interview", "figure out", "not sure"],
  "exclusions": []
}
```

When registered, dispatch routes prompts matching interview triggers directly to the skill, bypassing the vague-prompt-detector hook entirely.

## Customization

### Adding Domains

The question bank (`skills/interview/references/question-bank.md`) supports 7 domains. To add a new one:

1. Create 4 phase sections (Strategic, Context, Tactical, Format) with 3-4 questions each
2. Each question must be open-ended (not yes/no), target a specific information slot, and be understandable without domain expertise
3. Add detection keywords to the Domain Detection Heuristics table (8-12 keywords)
4. Add a corresponding synthesis template in `references/synthesis-patterns.md`
5. Test with 3 sample goals to verify domain detection triggers correctly

See the contributor guide at the bottom of `question-bank.md` for the full template.

### Adjusting Depth Defaults

Depth is proposed during Phase 0 (Intake & Calibration) based on complexity assessment. The thresholds are embedded in the SKILL.md logic:

- QUICK: single-domain, clear deliverable, few unknowns
- STANDARD: multi-faceted, some unknowns, moderate scope
- DEEP: complex, multi-stakeholder, high-stakes, or vague goal

To change the default proposal behavior, edit the complexity assessment criteria in the Phase 0 section of `SKILL.md`.

### Adding Synthesis Templates

Domain-specific XML templates live in `references/synthesis-patterns.md`. Each template is self-contained (domain variants override, not merge with, the base template). To add a new template:

1. Copy an existing domain variant as a starting point
2. Define XML slots specific to the domain
3. Ensure every slot maps to at least one question in the question bank
4. Add the pre-synthesis checklist expectations for the new domain

## Known Limitations

- **Plugin-sourced hooks may not fire**: Claude Code issues [#10225](https://github.com/anthropics/claude-code/issues/10225) and [#9708](https://github.com/anthropics/claude-code/issues/9708) may prevent `UserPromptSubmit` hooks from loading via plugin path. If the vague-prompt-detector does not trigger, add the hook manually to your settings.json:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"<path-to-plugin>/hooks/vague-prompt-detector.js\""
          }
        ]
      }
    ]
  }
}
```

Replace `<path-to-plugin>` with the absolute path to your interview plugin directory (e.g., `~/.claude/plugins/interview`).

- **State persistence requires `~/.claude/cache/`**: The directory must exist. If it does not, state writes will fail silently and resume will not work.
- **One active interview at a time**: Starting a new interview while one is in progress overwrites the previous state (with a confirmation prompt unless `--resume` is passed).
- **Token budget estimates**: QUICK ~5K tokens, STANDARD ~15K tokens, DEEP ~30K tokens. Actual usage varies with answer length and follow-up probes.

## FAQ & Troubleshooting

**Q: When should I use /interview vs just asking my question?**
A: Use `/interview` when you have a goal but haven't fully defined the scope, audience, success criteria, or deliverable format. If you already know exactly what you want (specific function, precise spec), skip it and ask directly. Rule of thumb: if your request is under 2 sentences and lacks context, `/interview` will produce a better result.

**Q: Can I resume an interrupted interview?**
A: Yes. If a state file exists at `~/.claude/cache/interview-state.json`, the plugin detects it and offers to resume or start fresh. Use `--resume` to skip the confirmation prompt. On resume, all recorded answers are displayed for verification before continuing.

**Q: Does it work with dispatch-framework?**
A: Yes. When dispatch-framework is installed, the vague-prompt-detector hook auto-disables to avoid double-routing. Register the interview skill in dispatch's `registry.json` (see the Dispatch Framework Integration section) and dispatch will route matching prompts directly to `/interview`.

**Q: What if I give contradictory answers?**
A: The plugin flags contradictions explicitly: "Earlier you said X, but now Y -- which takes priority?" It does not silently pick one interpretation. Contradictions are surfaced during the interview and resolved before synthesis.

**Q: The vague-prompt-detector never fires. What's wrong?**
A: Check three things: (1) Is dispatch-framework installed? The hook auto-disables when dispatch is present. (2) Is the hook registered? Run `claude hooks list` or check your settings.json. (3) Are your prompts detailed enough? The hook only fires when 2+ vagueness signals are detected. See the Known Limitations section for the manual settings.json fallback.

**Q: Can I save the mega-prompt for reuse?**
A: Yes. After the deliverable is generated, select "Save the mega-prompt for reuse" from the iteration options. The mega-prompt is output as a standalone block you can copy and use in future sessions or with other tools.

## License

MIT -- see [LICENSE](../../LICENSE)
