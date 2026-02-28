#!/usr/bin/env node
/**
 * dispatch-enforcer.js — PreToolUse hook
 * Injects warning context when execution tools (Edit, Write, Bash, NotebookEdit)
 * are used outside of a skill or slash-command context.
 *
 * Also WRITES the skill-active flag when tool_name === "Skill".
 *
 * WARNING ONLY — does NOT block. Soft enforcement layer.
 * Fail-open: any error → silent exit(0) with no output.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME || process.env.USERPROFILE;
const CACHE_DIR = path.join(HOME, ".claude", "cache");

// Flag files
const SKILL_FLAG = path.join(CACHE_DIR, "skill-active.flag");
const COMMAND_FLAG = path.join(CACHE_DIR, "command-active.flag");

// TTL: 90 seconds
const FLAG_TTL_MS = 90000;

// Tools that should trigger a warning when used directly (not via skill/command)
const EXECUTION_TOOLS = new Set(["Edit", "Write", "Bash", "NotebookEdit"]);

function writeFlag(flagPath) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(flagPath, String(Date.now()));
  } catch (_) {
    // Fail-open
  }
}

function isFlagActive(flagPath) {
  try {
    const stat = fs.statSync(flagPath);
    const ageMs = Date.now() - stat.mtimeMs;
    return ageMs < FLAG_TTL_MS;
  } catch (_) {
    return false;
  }
}

function emitWarning(toolName) {
  const warning = [
    `WARNING: You are about to use ${toolName} directly on the main thread.`,
    "The dispatch protocol requires execution work to be delegated to agents via Task tool.",
    "If you are executing a Skill or /slash command, this is expected — continue.",
    "Otherwise, STOP and dispatch this work to an agent:",
    '  Task(subagent_type="general-coder", prompt="<your task description>")'
  ].join(" ");

  const out = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: warning
    }
  };
  process.stdout.write(JSON.stringify(out));
}

function run(input) {
  const toolName = input.tool_name || "";

  // When Skill tool is called, write the skill-active flag and return (no warning)
  if (toolName === "Skill") {
    writeFlag(SKILL_FLAG);
    return;
  }

  // Only care about execution tools
  if (!EXECUTION_TOOLS.has(toolName)) return;

  // If EITHER flag is active, don't warn (expected behavior)
  if (isFlagActive(SKILL_FLAG) || isFlagActive(COMMAND_FLAG)) return;

  // Emit warning (soft enforcement — does NOT block)
  emitWarning(toolName);
}

// Read stdin cross-platform (Windows-safe)
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
