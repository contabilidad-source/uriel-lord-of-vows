# Contributing to uriel-lord-of-vows

Thanks for your interest in contributing! This guide covers how to propose, build, and submit skills (and other resources) to this repository.

---

## How to Propose Skills

1. **Open an issue first** describing the skill concept.
2. Include in the issue:
   - What problem the skill solves
   - Target user / use case
   - Rough scope (how many files, what tools it needs)
3. **Wait for feedback** before building. This avoids wasted effort on skills that overlap or need a different approach.

---

## Skill Structure Requirements

Every skill must:

- Have a `SKILL.md` with YAML frontmatter (`name` and `description` fields)
- Have a `README.md` with install instructions, usage examples, and FAQ
- Contain **NO** personal data, **NO** hardcoded namespaces, **NO** memory-router dependencies
- Use fallback-capable language for all agent references (e.g., "if available" for optional tools)
- Live in `skills/<skill-name>/` directory

---

## Portability Rules Checklist

Before submitting a PR, run these grep checks from the repo root. **ALL must return empty:**

```bash
grep -ri "test-malla" skills/ plugins/
grep -ri "C:\\Users" skills/ plugins/
grep -ri "config.local" skills/ plugins/
```

Skills must not reference:

- Personal usernames, paths, or namespaces
- Specific MCP servers as hard dependencies (use "if available" pattern)
- Platform-specific commands without alternatives (provide both Unix + Windows)

---

## Plugin Structure Requirements

Plugins extend Claude Code with agents, skills, hooks, and behavioral instructions. Every plugin must:

- Live in `plugins/<plugin-name>/` directory
- Have a `.claude-plugin/plugin.json` manifest with `name`, `description`, `version`, and `author` fields
- Have a `hooks/hooks.json` declaring all hook registrations (if the plugin uses hooks)
- Have a `CLAUDE.md` with behavioral instructions wrapped in `<plugin-name>` tags
- Have a `README.md` with install instructions, usage documentation, and troubleshooting
- Contain **NO** personal data, **NO** hardcoded paths, **NO** user-specific namespaces

### Required Plugin Files

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest (required)
├── hooks/                   # Hook system (if applicable)
│   ├── hooks.json           # Hook declarations
│   └── *.js                 # Hook scripts
├── agents/                  # Agent configurations (if applicable)
├── skills/                  # Bundled skills (if applicable)
├── docs/                    # Documentation (recommended)
├── CLAUDE.md                # Behavioral instructions (required)
└── README.md                # User-facing documentation (required)
```

### Plugin Portability Rules

Plugins must be portable across machines and users. Before submitting a plugin PR, run these grep checks:

```bash
grep -ri "test-malla\|cucina\|dgii\|adm.cloud\|rosa\|malla" plugins/
grep -ri "C:\\\\Users" plugins/
grep -ri "config.local" plugins/
```

All must return empty. Plugins must not reference:

- Personal usernames, paths, or namespaces
- Specific MCP servers as hard dependencies (use "if available" pattern)
- Platform-specific commands without alternatives (provide both Unix + Windows)
- Hardcoded absolute paths (use `CLAUDE_PLUGIN_ROOT` variable in hooks.json)

---

## PR Process

1. Fork the repo
2. Create a branch: `skill/<skill-name>` or `fix/<description>`
3. Follow skill structure requirements above
4. Run the portability grep checks
5. Open a PR with: what changed, why, and how you tested it

---

## Skill Template

Minimal example of a compliant skill:

```
skills/my-skill/
├── SKILL.md
└── README.md
```

**`SKILL.md`:**

```markdown
---
name: my-skill
description: Brief description of what this skill does. Invoked with /my-skill.
---

# My Skill

[Skill instructions here]
```

**`README.md`:**

```markdown
# my-skill

## What it does
[Description]

## Install
[Symlink or copy instructions]

## Usage
[Examples]

## FAQ
[Common questions]
```

---

## Credits

Created by [Pedro Malla](https://github.com/contabilidad-source).
