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
grep -ri "test-malla" skills/
grep -ri "C:\\Users" skills/
grep -ri "config.local" skills/
```

Skills must not reference:

- Personal usernames, paths, or namespaces
- Specific MCP servers as hard dependencies (use "if available" pattern)
- Platform-specific commands without alternatives (provide both Unix + Windows)

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
