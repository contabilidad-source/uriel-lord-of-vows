# Synthesis Patterns — Mega-Prompt Templates

Templates for assembling interview answers into structured mega-prompts.
The interviewer selects a base template by deliverable type, then fills slots from collected answers.

## Three-Tier Assumption Taxonomy

All assumptions use a 3-tier system. Never use bare `[ASSUMED]` tags.

```xml
<assumptions>
  <!-- Tier 1: Safe defaults based on conventions -->
  <convention reason="standard for blog posts">[tone: conversational]</convention>

  <!-- Tier 2: Reasonable inferences from user's answers -->
  <inferred from="user said 'technical team'" reason="team context implies internal docs">[audience: internal engineering]</inferred>

  <!-- Tier 3: Pure guesses with zero signal — MUST be confirmed -->
  <guessed question="What's the target word count?">[length: ~1500 words]</guessed>
</assumptions>
```

**Assumption budgets per depth:**

| Depth | Guessed (max) | Convention/Inferred |
|-------|---------------|---------------------|
| QUICK | 2 | unlimited |
| STANDARD | 4 | unlimited |
| DEEP | 6 | unlimited |

If the guessed budget is exceeded, **stop and ask the user** instead of guessing.

**Zero-signal rule:** When zero signal exists for a slot, use `[NEEDS INPUT: brief question]` instead of inventing a value. This flags slots the user MUST fill.

---

## Base XML Structure (all deliverables)

```xml
<mega-prompt>
  <role>
    <!-- WHO Claude should be for this task -->
    You are a {expertise_descriptor} with deep experience in {domain}.
    Your approach: {style_descriptors}.
  </role>

  <context>
    <!-- SITUATION and background -->
    <objective>{end_outcome — the real WHY}</objective>
    <audience>{primary_audience} — {what_they_know}, {their_emotional_state}</audience>
    <constraints>{hard_constraints — timeline, budget, tech stack, regulations}</constraints>
    <existing_assets>{what_we_can_build_on}</existing_assets>
    <stakeholders>{who_else_cares_and_why}</stakeholders>
  </context>

  <task>
    <!-- WHAT to produce -->
    <deliverable>{exact_format_and_type}</deliverable>
    <scope>{must_haves vs nice_to_haves}</scope>
    <priority>{the_one_thing_that_matters_most}</priority>
  </task>

  <requirements>
    <!-- HOW to approach it -->
    <approach>{structure, methodology, or pattern}</approach>
    <tone>{register — formal/casual/technical/friendly}</tone>
    <quality_bar>{what_good_vs_bad_looks_like}</quality_bar>
    <risks>{known_risks_and_how_to_handle}</risks>
  </requirements>

  <output_spec>
    <!-- EXACT deliverable format -->
    <format>{file_type, structure, sections}</format>
    <length>{word_count, file_count, page_count}</length>
    <includes>{rationale, options, commentary — yes/no}</includes>
    <iteration>{outline_first vs full_draft, versioning}</iteration>
  </output_spec>

  <assumptions>
    <!-- Tier 1: Safe defaults based on conventions -->
    <convention reason="{why_this_is_standard}">{convention_text}</convention>
    <!-- Tier 2: Reasonable inferences from user's answers -->
    <inferred from="{user_signal}" reason="{inference_logic}">{inferred_text}</inferred>
    <!-- Tier 3: Pure guesses — MUST be confirmed -->
    <guessed question="{question_for_user}">{guess_text}</guessed>
    <!-- Zero signal — cannot proceed without user input -->
    <!-- [NEEDS INPUT: brief question] -->
  </assumptions>
</mega-prompt>
```

---

## Domain Variants

> **Rule: Domain variants OVERRIDE the base template.** When a domain variant exists, use ONLY the variant's XML structure. Do NOT merge base + variant — the variant is self-contained. Omit any XML slots that have no answer and no reasonable convention default.

### Writing Deliverable

```xml
<role>
  You are an expert {content_type} writer specializing in {topic_area}.
  Voice: {tone_descriptors}. Style model: {reference_piece_if_provided}.
</role>

<context>
  <objective>{persuade | inform | entertain | establish_authority}</objective>
  <audience>{reader_profile} reading on {platform}</audience>
  <seo>{keywords_if_applicable}</seo>
  <brand_voice>{style_guide_notes}</brand_voice>
</context>

<task>
  <deliverable>{article | blog_post | email | doc | social}</deliverable>
  <thesis>{single_takeaway}</thesis>
  <counterargument>{strongest_objection_to_address}</counterargument>
</task>

<requirements>
  <structure>{listicle | narrative | how-to | comparison}</structure>
  <evidence>{examples | analogies | data | stories}</evidence>
  <sources>{specific_references}</sources>
</requirements>

<output_spec>
  <length>{word_count}</length>
  <sections>{headers, intro, conclusion, CTA}</sections>
  <placeholders>{where_user_adds_own_content}</placeholders>
</output_spec>
```

### Code / Technical Deliverable

```xml
<role>
  You are a senior {language/framework} developer with expertise in {domain}.
  Coding style: {patterns, conventions}. Priority: {correctness | performance | readability}.
</role>

<context>
  <objective>{problem_being_solved_for_end_user}</objective>
  <codebase>{greenfield | existing — description}</codebase>
  <stack>{languages, frameworks, databases, infra}</stack>
  <maintainer>{who_maintains — skill_level}</maintainer>
</context>

<task>
  <deliverable>{script | module | API | full_app | refactor}</deliverable>
  <mvp>{simplest_useful_version}</mvp>
  <scope>{must_have_features} | nice-to-have: {stretch_features}</scope>
</task>

<requirements>
  <architecture>{monolith | microservice | serverless | script}</architecture>
  <error_handling>{fail_fast | graceful_degradation | retry}</error_handling>
  <testing>{unit | integration | manual | none}</testing>
  <performance>{latency, throughput, scale targets}</performance>
</requirements>

<output_spec>
  <structure>{single_file | multi_file — layout}</structure>
  <includes>{tests | docs | comments | setup_instructions}</includes>
  <ready_state>{production | prototype | pseudocode}</ready_state>
</output_spec>
```

### Strategy / Business Deliverable

```xml
<role>
  You are a {strategy | operations | finance} advisor with experience in {industry}.
  Approach: {data-driven | framework-based | narrative}. Rigor: {executive_summary | deep_analysis}.
</role>

<context>
  <objective>{decision_to_support}</objective>
  <decision_maker>{who_decides — what_they_value}</decision_maker>
  <landscape>{competition, market, constraints}</landscape>
  <resources>{budget, team, timeline}</resources>
</context>

<task>
  <deliverable>{analysis | proposal | plan | comparison | memo}</deliverable>
  <options>{top_options_being_evaluated}</options>
  <success_metrics>{how_success_is_measured}</success_metrics>
</task>

<requirements>
  <evidence>{what_data_supports_recommendation}</evidence>
  <risk_analysis>{plan_b, failure_modes}</risk_analysis>
  <rollout>{pilot | phased | big_bang}</rollout>
</requirements>

<output_spec>
  <format>{deck | memo | one-pager | detailed_report}</format>
  <visuals>{charts | diagrams | matrices — yes/no}</visuals>
  <includes>{recommendations | findings_only | both}</includes>
</output_spec>
```

### Prompt / AI Deliverable

```xml
<role>
  You are a prompt engineer specializing in {model_family} with expertise in {use_case_domain}.
  Approach: {structured | minimal | conversational}. Priority: {reliability | creativity | safety}.
</role>

<context>
  <objective>{what_the_prompt_needs_to_accomplish}</objective>
  <model>{target_model — capabilities_and_limits}</model>
  <deployment>{one-off | daily | high-volume}</deployment>
  <maintainer>{who_iterates_on_prompt}</maintainer>
</context>

<task>
  <deliverable>{system_prompt | task_prompt | agent_config | skill}</deliverable>
  <input_spec>{expected_input_format_and_variability}</input_spec>
  <failure_modes>{known_edge_cases_and_hallucination_risks}</failure_modes>
</task>

<requirements>
  <rigidity>{predictable_output | creative_range}</rigidity>
  <output_format>{JSON | markdown | plain_text | structured}</output_format>
  <guardrails>{safety, scope, hallucination_prevention}</guardrails>
  <tools>{available_tools_and_capabilities}</tools>
</requirements>

<output_spec>
  <format>{raw_text | XML | JSON}</format>
  <includes>{test_cases | usage_guide | version_notes}</includes>
</output_spec>
```

### Research/Analysis Deliverable

```xml
<role>
  You are a {research_methodology} specialist with expertise in {topic_domain}.
  Approach: {analytical_framework}. Rigor: {confidence_threshold}.
</role>

<context>
  <research_question>{core_question_being_investigated}</research_question>
  <type>{exploratory | confirmatory | meta-analysis}</type>
  <data_sources>{available_sources — primary, secondary, literature}</data_sources>
  <prior_work>{what_exists_and_what_it_concluded}</prior_work>
  <constraints>{methodological, ethical, temporal, budgetary}</constraints>
</context>

<task>
  <deliverable>{research_brief | full_report | executive_summary | data_viz}</deliverable>
  <decisions_supported>{what_decisions_hinge_on_findings}</decisions_supported>
  <uncertainty_handling>{confidence_intervals | caveats | risk_flags}</uncertainty_handling>
</task>

<requirements>
  <methodology>{quantitative | qualitative | mixed_methods}</methodology>
  <conflict_resolution>{weight_by_quality | present_both | flag_uncertainty}</conflict_resolution>
  <reproducibility>{share_methodology | share_data | share_code}</reproducibility>
</requirements>

<output_spec>
  <format>{report_structure_and_sections}</format>
  <includes>{recommendations | analysis_only | appendices | methodology}</includes>
  <audience_adaptation>{technical_depth_level}</audience_adaptation>
</output_spec>
```

### Design/UX Deliverable

```xml
<role>
  You are a {design_discipline} designer specializing in {platform} experiences.
  Approach: {user-centered | data-driven | brand-led}. Fidelity: {wireframe | mockup | prototype}.
</role>

<context>
  <user_problem>{pain_point_being_solved}</user_problem>
  <personas>{primary_and_secondary_users}</personas>
  <platform>{web | mobile | desktop | responsive}</platform>
  <design_system>{component_library_or_custom}</design_system>
  <existing_research>{usability_data, analytics, feedback}</existing_research>
  <accessibility>{WCAG_level, assistive_tech_requirements}</accessibility>
</context>

<task>
  <deliverable>{wireframes | user_flows | component_specs | design_system_updates}</deliverable>
  <target_behavior>{what_users_should_do_differently}</target_behavior>
  <scope>{screens_or_flows_included}</scope>
</task>

<requirements>
  <interaction_model>{click | touch | voice | gesture}</interaction_model>
  <edge_cases>{empty_states, errors, loading, first-time_use}</edge_cases>
  <information_architecture>{flat | hierarchical | hub-and-spoke}</information_architecture>
</requirements>

<output_spec>
  <fidelity>{wireframe | mockup | prototype | production-ready}</fidelity>
  <responsive>{mobile_tablet_desktop_variants}</responsive>
  <includes>{journey_maps | interaction_specs | annotations}</includes>
</output_spec>
```

---

## Pre-Synthesis Checklist (show to user)

Before presenting the mega-prompt, run this checklist and display results:

| Check | Status | Action if FAIL |
|-------|--------|----------------|
| Every guessed assumption has a fallback question | pass/fail | Ask the missing questions before synthesizing |
| No slot left as placeholder `{...}` | pass/fail | Fill with `[NEEDS INPUT]` or ask user |
| User's #1 priority prominently reflected | pass/fail | Reposition priority in task/scope section |
| Tone matches user's words, not "professional" default | pass/fail | Recheck user's actual tone words |
| Scope is bounded (no "and more" language) | pass/fail | Cut unbounded clauses |
| Output spec is concrete enough to judge "done" | pass/fail | Add measurable criteria |
| Contradictions flagged, not papered over | pass/fail | Surface contradiction to user |
| Assumption budget not exceeded | pass/fail | Ask user for missing inputs |

**Gate rule**: If ANY check fails, fix it before presenting. Show the user which checks passed/failed.

## Presentation Format

When presenting the synthesized prompt to the user:

```
## Synthesized Mega-Prompt

Here's what I'll use to generate your deliverable:

[XML mega-prompt block]

### Assumptions (review required)

**Conventions** (safe defaults — change if wrong):
- [convention: ...]

**Inferences** (from your answers — verify):
- [inferred from "X": ...]

**Guesses** (I need your input on these):
- [guessed: ...] <- What should this be?

**Needs Input** (can't proceed without):
- [NEEDS INPUT: ...]

### Key Decisions
- Priority: {what I'm optimizing for}
- Trade-off: {what I'm deprioritizing and why}

**Does this capture your intent? I won't proceed until you approve (or adjust).**
```

## Post-Deliverable Quality Check (Phase 3.5)

After presenting the deliverable, ask for a quality rating:

> "On a scale of 1-5, how well does this match what you had in mind?"

| Rating | Action |
|--------|--------|
| 5 | Done! Offer to save mega-prompt for reuse |
| 4 | "What's the one thing that would make it a 5?" — adjust and regenerate |
| 3 | "What's off — tone, scope, depth, or something else?" — targeted revision |
| 1-2 | "This missed the mark. Let me ask 2-3 more questions to recalibrate." — mini re-interview on gaps — re-synthesize |
