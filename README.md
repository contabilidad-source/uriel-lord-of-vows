# Uriel — Lord of Vows

**Adversarial plan verification for Claude Code.**

Uriel is the angel of wisdom and light — the one who holds others accountable to their commitments. This collection of skills, agents, and MCPs for Claude Code carries that name for a reason: plans should be tested before they are trusted.

No plan survives first contact with reality. Uriel makes sure yours gets that contact *before* you start building.

---

## Skills Catalog

| Skill | Description | Status |
|-------|-------------|--------|
| [verify-plan](./skills/verify-plan/) | Multi-agent adversarial plan verification | v1.0.0 |

---

## Plugins Catalog

| Plugin | Description | Status |
|--------|-------------|--------|
| [dispatch-framework](./plugins/dispatch-framework/) | 4-tier agent dispatch framework -- routes prompts to specialized agents via registry scoring, enforces delegation patterns, triggers governance reviews | v1.0.0 |

**Install:**

```bash
claude plugin add dispatch-framework@uriel-lord-of-vows
```

See the [dispatch-framework README](./plugins/dispatch-framework/README.md) for full documentation, configuration, and troubleshooting.

> `agents/` and `mcps/` directories are reserved for future additions.

---

## Quick Start

### Option 1: Symlink (recommended)

Symlinks keep the skill updated — just `git pull` to get new versions.

**Linux / macOS:**

```bash
git clone https://github.com/contabilidad-source/uriel-lord-of-vows.git
ln -s "$(pwd)/uriel-lord-of-vows/skills/verify-plan" ~/.claude/skills/verify-plan
```

**Windows (PowerShell as Administrator):**

```powershell
git clone https://github.com/contabilidad-source/uriel-lord-of-vows.git
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\skills\verify-plan" -Target "$(Get-Location)\uriel-lord-of-vows\skills\verify-plan"
```

> **Note:** Creating symlinks on Windows requires **Administrator PowerShell** or **Developer Mode** enabled (Settings > For Developers). If neither is available, use Option 2 (copy) or create a junction instead:
> ```cmd
> cmd /c mklink /J "%USERPROFILE%\.claude\skills\verify-plan" "uriel-lord-of-vows\skills\verify-plan"
> ```

### Option 2: Direct copy

```bash
git clone https://github.com/contabilidad-source/uriel-lord-of-vows.git
cp -r uriel-lord-of-vows/skills/verify-plan ~/.claude/skills/verify-plan
```

---

## How Claude Code Skills Work

Skills are markdown instruction files that give Claude Code specialized capabilities. They act as reusable expertise modules — Claude reads them and gains domain-specific knowledge, workflows, and decision frameworks.

- Skills live in `~/.claude/skills/` (global) or `.claude/skills/` (project-scoped)
- Each skill contains a `SKILL.md` file with YAML frontmatter defining its `name` and `description`
- Claude Code discovers installed skills automatically
- Invoke a skill with `/skill-name` in any Claude Code session

No compilation, no build step, no runtime dependencies. Just markdown that makes Claude smarter at specific tasks.

---

## Prerequisites

- **Claude Code** — Anthropic's CLI tool ([documentation](https://docs.anthropic.com/en/docs/claude-code))

- **TeamCreate (optional):** The verify-plan skill supports a scaled team mode where 5 agents run adversarial analysis in parallel. To enable it, set the environment variable:

  ```bash
  export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
  ```

  Without this flag, the skill falls back to sequential single-agent mode. It still works — just slower for complex plans.

---

## Security & Trust

This project is designed to be safe by default:

- **Read-only** — the skill reads your plan files and codebase but never modifies code
- **Local processing** — no data leaves your machine beyond normal Claude API calls
- **No telemetry** — no external API calls, no analytics, no data collection
- **Standard permissions** — spawned subagents inherit your existing Claude Code permission settings
- **Open source** — MIT licensed, inspect every line yourself

---

## Repository Structure

```
uriel-lord-of-vows/
├── skills/
│   └── verify-plan/              # Adversarial plan verification
│       └── SKILL.md
├── plugins/
│   └── dispatch-framework/       # 4-tier agent dispatch
│       ├── .claude-plugin/
│       │   └── plugin.json       # Plugin manifest
│       ├── hooks/
│       │   ├── hooks.json        # Hook declarations
│       │   ├── dispatch-router.js
│       │   ├── dispatch-enforcer.js
│       │   └── governance-router.js
│       ├── agents/
│       │   └── registry.json     # Agent routing registry
│       ├── skills/               # Plugin-bundled skills
│       ├── docs/
│       │   └── architecture.md
│       ├── CLAUDE.md             # Behavioral instructions
│       └── README.md
├── agents/                       # Reserved for future additions
├── mcps/                         # Reserved for future additions
├── docs/                         # Documentation
├── LICENSE                       # MIT
└── README.md                     # You are here
```

---

## Community

- [Issues](https://github.com/contabilidad-source/uriel-lord-of-vows/issues) — Bug reports and feature requests
- [Discussions](https://github.com/contabilidad-source/uriel-lord-of-vows/discussions) — Questions, ideas, and show-and-tell

Contributions welcome. If you build a skill, agent, or MCP that fits the Uriel philosophy — holding AI work accountable — open a PR.

---

## License

MIT — see [LICENSE](./LICENSE)
