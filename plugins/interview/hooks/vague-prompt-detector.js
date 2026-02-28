#!/usr/bin/env node
/**
 * vague-prompt-detector.js — UserPromptSubmit hook
 * Detects underspecified prompts and suggests /interview.
 * Fail-open: any error → silent exit(0).
 */
"use strict";

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME || process.env.USERPROFILE;
const CACHE_DIR = path.join(HOME, ".claude", "cache");
const INTERVIEW_FLAG = path.join(CACHE_DIR, "interview-active.flag");
const FLAG_TTL_MS = 90000; // 90 seconds

// --- Fast-exit checks ---

function isShort(prompt) {
  return prompt.trim().length < 15;
}

function isGreeting(prompt) {
  const p = prompt.trim().toLowerCase();
  if (p.length > 30) return false;
  return /^(hi|hello|hey|hola|buenos?\s*d[ií]as?|buenas?\s*(tardes?|noches?)|thanks?|thank\s*you|ok|okay|yes|no|sure|got\s*it|cool|nice)\b/.test(p);
}

function isSlashCommand(prompt) {
  return /^\s*\/\S/.test(prompt);
}

function containsInterview(prompt) {
  return /\/interview\b/i.test(prompt);
}

// --- Guard checks ---

function isInterviewActive() {
  try {
    const stat = fs.statSync(INTERVIEW_FLAG);
    if (Date.now() - stat.mtimeMs < FLAG_TTL_MS) return true;
    // Stale flag — clean up
    fs.unlinkSync(INTERVIEW_FLAG);
  } catch (_) {}
  return false;
}

function isDispatchFrameworkInstalled() {
  // Check common plugin locations for dispatch-framework
  const locations = [
    path.join(HOME, ".claude", "plugins", "dispatch-framework"),
    path.resolve(__dirname, "..", "..", "dispatch-framework")
  ];
  for (const loc of locations) {
    try {
      fs.statSync(path.join(loc, ".claude-plugin", "plugin.json"));
      return true;
    } catch (_) {}
  }
  return false;
}

// --- Vague detection scoring ---

function scoreVagueness(prompt) {
  const lower = prompt.toLowerCase();
  let score = 0;
  const signals = [];

  // Signal 1: No audience mentioned
  if (!/\b(for|audience|reader|user|client|team|stakeholder|manager|developer|customer)\b/i.test(prompt)) {
    score++;
    signals.push("no audience");
  }

  // Signal 2: No scope/boundary
  if (!/\b(about|regarding|for|specific|focus|scope|limit|only|just)\b/i.test(prompt)) {
    score++;
    signals.push("no scope");
  }

  // Signal 3: No success criteria
  if (!/\b(should|must|need|require|goal|objective|outcome|result|expect|deliver)\b/i.test(prompt)) {
    score++;
    signals.push("no success criteria");
  }

  // Signal 4: Low specificity (short + vague verbs)
  if (prompt.trim().split(/\s+/).length < 10 && /\b(make|do|create|build|write|help|something|thing)\b/i.test(prompt)) {
    score++;
    signals.push("low specificity");
  }

  return { score, signals };
}

// --- Output ---

function emitSuggestion(signals) {
  const signalList = signals.join(", ");
  const out = {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: `This prompt may benefit from a structured interview to clarify requirements (missing: ${signalList}). Consider suggesting /interview to the user if the request seems underspecified. Do NOT auto-invoke — let the user decide.`
    }
  };
  process.stdout.write(JSON.stringify(out));
}

// --- Main ---

function run(input) {
  const prompt = input.prompt || "";
  if (!prompt || prompt.length < 3) return;

  // Fast exits
  if (isShort(prompt)) return;
  if (isGreeting(prompt)) return;
  if (isSlashCommand(prompt)) return;
  if (containsInterview(prompt)) return;

  // Guard: don't suggest during active interview
  if (isInterviewActive()) return;

  // Guard: dispatch-framework handles routing
  if (isDispatchFrameworkInstalled()) return;

  // Score vagueness
  const { score, signals } = scoreVagueness(prompt);

  // Threshold: 2+ missing signals = suggest
  if (score >= 2) {
    emitSuggestion(signals);
  }
}

// Read stdin (cross-platform)
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
