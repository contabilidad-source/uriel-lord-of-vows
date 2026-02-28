#!/usr/bin/env node
/**
 * dispatch-router.js — UserPromptSubmit hook
 * Reads registry.json, regex-scores prompt against patterns[],
 * outputs @DISPATCH:name:tool directive for Claude.
 * Fail-open: any error → silent exit(0).
 */
"use strict";

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME || process.env.USERPROFILE;
const CACHE_DIR = path.join(HOME, ".claude", "cache");
const COMMAND_FLAG = path.join(CACHE_DIR, "command-active.flag");
const SKILL_FLAG = path.join(CACHE_DIR, "skill-active.flag");
const FLAG_TTL_MS = 90000; // 90 seconds

function writeFlag(flagPath) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(flagPath, String(Date.now()));
  } catch (_) {
    // Fail-open
  }
}

function cleanStaleFlags() {
  for (const flagPath of [SKILL_FLAG, COMMAND_FLAG]) {
    try {
      const stat = fs.statSync(flagPath);
      if (Date.now() - stat.mtimeMs > FLAG_TTL_MS) {
        fs.unlinkSync(flagPath);
      }
    } catch (_) {
      // Flag doesn't exist — fine
    }
  }
}

const REGISTRY_PATH = path.join(__dirname, "..", "agents", "registry.json");

// Generic file-extension routing (configurable via registry file_ext_map override)
const FILE_EXT_MAP = {
  ".pdf": "pdf", ".docx": "docx", ".xlsx": "xlsx",
  ".pptx": "pptx", ".csv": "csv"
};

function matchFileExtension(prompt) {
  const lower = prompt.toLowerCase();
  for (const [ext, skill] of Object.entries(FILE_EXT_MAP)) {
    if (lower.includes(ext)) return { name: skill, tool: "Skill" };
  }
  return null;
}

// --- Fast-path checks (no registry load) ---

function isSlashCommand(prompt) {
  return /^\s*\/\S/.test(prompt);
}

function isGreeting(prompt) {
  const p = prompt.trim().toLowerCase();
  if (p.length > 30) return false;
  return /^(hi|hello|hey|hola|buenos?\s*d[ií]as?|buenas?\s*(tardes?|noches?)|thanks?|thank\s*you|ok|okay|yes|no|sure|got\s*it|cool|nice)\b/.test(p);
}

function isShortAnswer(prompt) {
  return prompt.trim().length < 15 && !/\b(build|create|make|deploy|process|run|test|fix|debug|audit)\b/i.test(prompt);
}

// --- Registry-based regex scoring ---

function scoreEntry(prompt, entry) {
  const lower = prompt.toLowerCase();
  let score = 0;

  // Check exclusions first
  const exclusions = entry.exclusions || [];
  for (const excl of exclusions) {
    if (lower.includes(excl.toLowerCase())) return 0;
  }

  // Regex patterns (20 points each match)
  const patterns = entry.patterns || [];
  for (const pat of patterns) {
    try {
      // ReDoS guard: skip patterns with nested quantifiers
      if (/(\+|\*|\{)\s*(\+|\*|\{)/.test(pat)) continue;
      if (new RegExp(pat, "i").test(prompt)) {
        score += 20;
      }
    } catch (_) {
      // Bad regex, skip
    }
  }

  // Trigger keyword matches (10 points each)
  const triggers = entry.triggers || [];
  for (const trig of triggers) {
    if (lower.includes(trig.toLowerCase())) {
      score += 10;
    }
  }

  // Priority bonus (0-5 points)
  score += (entry.priority || 50) * 0.05;

  return score;
}

function findBestMatch(prompt, entries) {
  let best = null;
  let bestScore = 0;

  for (const entry of entries) {
    // Skip governance-only entries
    if (entry.category && entry.category.includes("governance")) continue;
    // Skip workflow entries (no patterns)
    if (entry.category && entry.category.includes("workflow") && (!entry.patterns || entry.patterns.length === 0)) continue;

    const score = scoreEntry(prompt, entry);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    } else if (score === bestScore && score > 0 && best) {
      // Tie-breaking: higher priority wins, then fewer triggers (more specific), then array position
      const bestPri = best.priority || 50;
      const entryPri = entry.priority || 50;
      if (entryPri > bestPri) {
        best = entry;
      } else if (entryPri === bestPri) {
        const bestTrigCount = (best.triggers || []).length;
        const entryTrigCount = (entry.triggers || []).length;
        if (entryTrigCount < bestTrigCount) {
          best = entry;
        }
        // If still tied, keep first match (array position)
      }
    }
  }

  // Minimum threshold: at least one pattern or trigger must match (score > 10)
  if (bestScore < 15) return null;
  return best;
}

// --- Main ---

function emit(name, tool) {
  const out = {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: `@DISPATCH:${name}:${tool}`
    }
  };
  process.stdout.write(JSON.stringify(out));
}

function run(input) {
  const prompt = input.prompt || "";
  if (!prompt || prompt.length < 3) return;

  cleanStaleFlags();

  // Fast-path passthroughs (no registry load needed)
  if (isGreeting(prompt) || isShortAnswer(prompt)) return;
  if (isSlashCommand(prompt)) {
    writeFlag(COMMAND_FLAG);
    return;
  }

  // Step 1.5: File extension routing (before registry scoring)
  const extMatch = matchFileExtension(prompt);
  if (extMatch) {
    return emit(extMatch.name, extMatch.tool);
  }

  // Load registry
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  } catch (_) {
    return; // Fail-open
  }

  const entries = registry.entries || [];

  // 1. General registry match
  const best = findBestMatch(prompt, entries);
  if (best) { emit(best.name, best.tool); return; }

  // 2. No match fallback — dispatch to general-coder catch-all
  if (prompt.trim().length >= 15) {
    emit("general-coder", "Task");
    return;
  }
}

// Read stdin cross-platform
const chunks = [];
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", () => {
  try {
    const raw = chunks.join("").trim();
    if (!raw) { process.exit(0); }
    const input = JSON.parse(raw);
    run(input);
  } catch (_) {
    // Fail-open
  }
  process.exit(0);
});
process.stdin.on("error", () => process.exit(0));
process.stdin.resume();
