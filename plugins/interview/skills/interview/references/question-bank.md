# Question Bank — Reverse Prompt Interview

Questions organized by **Phase x Domain**. The interviewer selects dynamically based on:
1. Detected domain from the user's initial goal statement
2. Current interview phase (Strategic → Context → Tactical → Format)
3. What's already been answered (skip redundant questions)

---

## Phase: Strategic (Why / What)

Purpose: Establish the real objective, challenge assumptions, surface XY problems.

### Universal (all domains)
- What's the **end outcome** you need? Not the deliverable — what changes in your world when this is done?
- Why now? What triggered this request today?
- What happens if we do nothing? What's the cost of inaction?
- Who benefits from this and how will they use it?
- Have you tried solving this before? What worked / didn't?
- Is this a one-off or the start of a recurring need?
- What does "done well" look like vs "done badly"? Give me a concrete example of each.

### Writing
- What's the single takeaway you want readers to walk away with?
- Is this meant to persuade, inform, entertain, or establish authority?
- What existing piece (article, post, doc) is closest to what you want?
- What's the strongest counterargument to your thesis?

### Code / Technical
- What problem does this solve for the end user (not the developer)?
- Is this greenfield or modifying existing code? If existing, what's the current pain?
- What are the hard constraints? (language, framework, infra, budget, timeline)
- What's the simplest version that would be useful?

### Strategy / Business
- What decision does this support? Who's the decision-maker?
- What are the top 2-3 options you're already considering?
- What would make you choose option A over B?
- What's the risk you're most worried about?

### Prompts / AI
- What model and context will this prompt run in?
- What does the prompt need to handle that a human instruction wouldn't?
- What failure modes have you seen with current prompts?
- Is this for a single task or a persistent system prompt?

### Research / Analysis
- What question are you trying to answer? What would change your mind about the answer?
- Is this exploratory (discovery) or confirmatory (testing a hypothesis)?
- What decisions hinge on the outcome of this research?
- Who's the audience for the findings — technical peers, executives, or general public?

### Design / UX
- What user problem does this design solve? What's the current pain point?
- Is this a new experience or improving an existing one? What's broken about the current state?
- What does success look like from the user's perspective? What behavior change are you targeting?
- Who are the primary and secondary user personas?

---

## Phase: Context (Who / Where)

Purpose: Map the environment — audience, constraints, existing assets, stakeholders.

### Universal
- Who's the primary audience? Describe them in one sentence.
- What do they already know? What can you assume vs must explain?
- What tone/register fits this audience? (formal, casual, technical, friendly)
- Are there brand guidelines, style guides, or existing conventions to follow?
- What existing assets can we build on? (docs, data, templates, prior work)
- Who else has a stake in this? Anyone who needs to approve or will be affected?

### Writing
- Where will this be published? (blog, internal doc, social, email, presentation)
- What's the reader's emotional state when they encounter this? (searching, browsing, assigned)
- Are there SEO keywords or topics you need to hit?
- What's the word count / length expectation?

### Code / Technical
- What's the tech stack? (languages, frameworks, databases, deployment target)
- Who maintains this after you? What's their skill level?
- What's the testing strategy? (unit, integration, manual, none)
- Are there performance requirements? (latency, throughput, scale)

### Strategy / Business
- What's the competitive landscape? Who else is doing this?
- What resources (budget, team, time) are available?
- What's the timeline? Hard deadline or flexible?
- Are there regulatory or compliance requirements?

### Prompts / AI
- What's the expected input format and variability?
- What tools/capabilities does the model have access to?
- What's the volume? (one-off, daily, thousands/day)
- Who will maintain and iterate on this prompt?

### Research / Analysis
- What data sources are available? (primary research, existing datasets, literature, expert interviews)
- What prior work exists on this topic? What did it conclude?
- What's the time frame — historical analysis, current snapshot, or forward-looking projection?
- Are there methodological constraints? (IRB, data privacy, sample size, budget)

### Design / UX
- What platform(s)? (web, mobile, desktop, kiosk, embedded)
- What's the design system / component library? (Material, custom, none)
- What accessibility requirements apply? (WCAG level, assistive tech support)
- What existing research or user feedback informs this? (usability tests, analytics, support tickets)

---

## Phase: Tactical (How)

Purpose: Nail down approach, structure, sequence, and trade-offs.

### Universal
- Of everything we've discussed, what's the #1 priority if we have to cut scope?
- What's the biggest risk or unknown in this project?
- Are there dependencies or blockers I should know about?
- What's your preferred approach — should I propose options or go with best judgment?

### Writing
- What structure works best? (listicle, narrative, how-to, comparison, Q&A)
- Should I use examples, analogies, data, or stories to support points?
- Are there specific sources or references to cite?
- How much original analysis vs synthesis of existing knowledge?

### Code / Technical
- What's the architecture preference? (monolith, microservice, serverless, script)
- How should errors be handled? (fail fast, graceful degradation, retry)
- What's the migration/rollback strategy if this breaks?
- Are there specific patterns or anti-patterns to follow/avoid?

### Strategy / Business
- What metrics define success? How will you measure?
- What's the rollout plan? (pilot, phased, big bang)
- What's plan B if the primary approach fails?
- Who needs to be convinced and what evidence do they need?

### Prompts / AI
- Should the prompt be rigid (predictable output) or flexible (creative range)?
- What output format? (JSON, markdown, plain text, structured)
- How should the prompt handle edge cases and ambiguity?
- What guardrails are needed? (safety, scope, hallucination prevention)

### Research / Analysis
- What analytical approach fits? (quantitative, qualitative, mixed methods, meta-analysis)
- How should conflicting evidence be handled? (weight by source quality, present both sides, flag uncertainty)
- What's the confidence threshold — is directional good enough, or do you need statistical significance?
- Should the analysis be reproducible? (share methodology, data sources, code)

### Design / UX
- What fidelity level? (wireframe, mockup, prototype, production-ready)
- What's the interaction model? (click, touch, voice, gesture)
- How should edge cases be handled? (empty states, errors, loading, first-time use)
- What's the information architecture approach? (flat, hierarchical, hub-and-spoke)

---

## Phase: Format (What Exactly)

Purpose: Pin down the exact deliverable spec — no ambiguity about what gets produced.

### Universal
- What format should the final deliverable be? (doc, code, spreadsheet, presentation, prompt)
- What's the expected length/size?
- Are there sections or components that are must-haves vs nice-to-haves?
- Do you want a single polished output or options to choose from?
- Should I include rationale/commentary or just the deliverable?

### Writing
- Do you need an outline first or go straight to full draft?
- Should I include a title, subtitle, meta description?
- Any specific formatting? (headers, bullets, callouts, images placeholders)
- Should I flag places where you need to add your own examples/data?

### Code / Technical
- Single file or multi-file? What's the file structure?
- Include tests? Documentation? Comments?
- Ready to run or pseudocode/architecture first?
- Should I include setup instructions?

### Strategy / Business
- Executive summary or detailed analysis?
- Include recommendations or just findings?
- Visual aids? (charts, diagrams, matrices)
- What's the presentation format? (deck, memo, one-pager)

### Prompts / AI
- Deliver as raw text, XML-structured, or JSON?
- Include test cases / example inputs-outputs?
- Should I include a usage guide with the prompt?
- Version it or deliver as final?

### Research / Analysis
- What format — research brief, full report, annotated bibliography, executive summary, data visualization?
- Should findings include recommendations or just analysis?
- How should uncertainty be communicated? (confidence intervals, caveats section, risk flags)
- Are appendices/methodology sections needed?

### Design / UX
- What deliverable — wireframes, user flows, component specs, design system updates, annotated screenshots?
- Should it include user journey maps or just the interface?
- Do you need responsive variants? (mobile, tablet, desktop)
- Include interaction specifications? (hover states, transitions, micro-animations)

---

## Follow-Up Probes (for vague answers)

Use these when an answer lacks specificity:

| Vague Signal | Probe |
|-------------|-------|
| "I don't know" | "If you had to guess, what would you say? We can adjust later." |
| "Everything" / "All of it" | "If you could only pick ONE aspect, which matters most?" |
| "Whatever you think" | "I'll propose something, but first: what would make you reject my suggestion?" |
| "It depends" | "Give me the most common case. We'll handle exceptions after." |
| "Something like X" | "What specifically about X appeals to you? What would you change?" |
| "Make it good" | "Show me an example of 'good' in this context — a link, screenshot, or description." |
| "ASAP" | "Is this blocking other work? What's the actual deadline?" |
| One-word answer | "Can you expand on that? I want to make sure I capture the nuance." |

---

## Domain Detection Heuristics

Match user's goal statement against these keywords to select domain-specific questions:

| Domain | Keywords |
|--------|----------|
| Writing | blog, article, post, copy, content, write, draft, newsletter, email |
| Code | build, implement, create app, fix bug, refactor, API, function, script |
| Strategy | plan, strategy, decide, evaluate, compare, analyze, roadmap, proposal |
| Prompts | prompt, system prompt, instructions, persona, chatbot, agent, LLM |
| Research / Analysis | research, analyze, study, investigate, survey, data, findings, report, literature, evidence, hypothesis, methodology |
| Design / UX | design, UX, UI, wireframe, prototype, mockup, user flow, interface, layout, component, accessibility, persona |
| Mixed | Multiple domains detected → use Universal + primary domain questions |

---

## Adding New Domains (Contributor Guide)

To add a new domain to the question bank:

1. **Create 4 phase sections** (Strategic, Context, Tactical, Format) with 3-4 questions each
2. **Each question should**:
   - Be open-ended (not yes/no)
   - Target a specific information slot
   - Be understandable without domain expertise
3. **Add detection heuristics** to the Domain Detection table (8-12 keywords)
4. **Add a synthesis template** in `synthesis-patterns.md` (domain variant XML)
5. **Test with 3 sample goals** to verify domain detection triggers correctly

Template for a new domain section:

### [Domain Name]
- [Strategic question targeting the WHY behind the request]
- [Strategic question challenging assumptions]
- [Strategic question about success criteria]
