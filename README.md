# Uriel — Lord of Vows

**Adversarial plan verification for Claude Code.**

Uriel is the angel of wisdom and light — the one who holds others accountable to their commitments. This collection of skills, agents, and MCPs for Claude Code carries that name for a reason: plans should be tested before they are trusted.

No plan survives first contact with reality. Uriel makes sure yours gets that contact *before* you start building.

---

## Plugins Catalog

| Plugin | Description | Status |
|--------|-------------|--------|
| [dispatch-framework](./plugins/dispatch-framework/) | 4-tier agent dispatch framework -- routes prompts to specialized agents via registry scoring, enforces delegation patterns, triggers governance reviews | v1.0.0 |
| [verify-plan](./plugins/verify-plan/) | Adversarial plan verification via convergence-loop debate -- 3-5 agents challenge, research, and synthesize until convergence | v1.0.0 |
| [interview](./plugins/interview/) | Structured interview plugin for context extraction -- one-question-at-a-time interviews with persistent state, 7 domain question banks, three-tier assumption management, and dispatch-framework compatibility | v1.0.0 |

**Install:**

```bash
claude plugin add dispatch-framework@uriel-lord-of-vows
```

See the [dispatch-framework README](./plugins/dispatch-framework/README.md) for full documentation, configuration, and troubleshooting.

> `agents/` and `mcps/` directories are reserved for future additions.

---

## Quick Start

Install any plugin with the Claude Code CLI:

```bash
claude plugin add <plugin-name>@uriel-lord-of-vows
```

For example:

```bash
claude plugin add verify-plan@uriel-lord-of-vows
claude plugin add dispatch-framework@uriel-lord-of-vows
claude plugin add interview@uriel-lord-of-vows
```

Or clone and reference locally:

```bash
git clone https://github.com/contabilidad-source/uriel-lord-of-vows.git
# Plugins are in plugins/<name>/ — point Claude Code to the local directory
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
├── plugins/
│   ├── dispatch-framework/       # 4-tier agent dispatch
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json       # Plugin manifest
│   │   ├── hooks/
│   │   │   ├── hooks.json        # Hook declarations
│   │   │   ├── dispatch-router.js
│   │   │   ├── dispatch-enforcer.js
│   │   │   └── governance-router.js
│   │   ├── agents/
│   │   │   └── registry.json     # Agent routing registry
│   │   ├── skills/               # Plugin-bundled skills
│   │   ├── docs/
│   │   │   └── architecture.md
│   │   ├── CLAUDE.md             # Behavioral instructions
│   │   └── README.md
│   ├── verify-plan/              # Adversarial plan verification
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json       # Plugin manifest
│   │   ├── agents/               # 6 agent definitions
│   │   ├── skills/verify-plan/   # Orchestrator skill
│   │   ├── docs/
│   │   │   └── architecture.md
│   │   ├── CLAUDE.md             # Behavioral instructions
│   │   └── README.md
│   └── interview/                # Structured interview plugin
│       ├── .claude-plugin/
│       │   └── plugin.json       # Plugin manifest
│       ├── hooks/
│       │   ├── hooks.json        # Hook declarations
│       │   └── vague-prompt-detector.js
│       ├── skills/interview/     # Interview orchestrator skill
│       │   └── references/       # Question banks & synthesis patterns
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
