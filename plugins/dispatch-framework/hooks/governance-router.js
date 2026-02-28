#!/usr/bin/env node
/**
 * governance-router.js — PostToolUse hook (matcher: Write|Edit)
 * Reads registry.json governance section, counts code lines,
 * checks thresholds, outputs @GOVERNANCE directive.
 * Fail-open: any error → silent exit(0).
 */
"use strict";

const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(__dirname, "..", "agents", "registry.json");

// Code file extensions
const CODE_EXTENSIONS = new Set([
  ".py", ".js", ".ts", ".tsx", ".jsx", ".go", ".rs", ".java",
  ".rb", ".php", ".c", ".cpp", ".h", ".cs", ".swift", ".kt",
  ".scala", ".sh", ".bash", ".ps1", ".sql", ".mjs", ".cjs"
]);

/**
 * Count non-empty, non-comment lines of code.
 */
function countCodeLines(content) {
  if (!content) return 0;

  const lines = content.split("\n");
  let count = 0;
  let inMultiline = false;

  for (const line of lines) {
    const stripped = line.trim();

    // Skip empty lines
    if (!stripped) continue;

    // Handle Python multiline strings/comments
    if (stripped.includes('"""') || stripped.includes("'''")) {
      inMultiline = !inMultiline;
      continue;
    }
    if (inMultiline) continue;

    // Skip single-line comments
    if (stripped.startsWith("#")) continue;
    if (stripped.startsWith("//")) continue;
    if (stripped.startsWith("/*") && stripped.endsWith("*/")) continue;
    if (stripped.startsWith("--")) continue; // SQL
    if (stripped.startsWith("*") && !stripped.startsWith("*/")) continue; // JSDoc mid-line

    count++;
  }

  return count;
}

// --- Main ---

function run(input) {
  const toolName = input.tool_name || "";
  const toolInput = input.tool_input || {};

  // Only process Write and Edit
  if (toolName !== "Write" && toolName !== "Edit") return;

  // Get file path
  const filePath = toolInput.file_path || "";
  if (!filePath) return;

  // Check if it's a code file
  const ext = path.extname(filePath).toLowerCase();
  if (!CODE_EXTENSIONS.has(ext)) return;

  // Get content
  let content = "";
  if (toolName === "Write") {
    content = toolInput.content || "";
  } else if (toolName === "Edit") {
    content = toolInput.new_string || "";
  }

  if (!content) return;

  // Count code lines
  const lineCount = countCodeLines(content);

  // Load registry governance section
  let governance;
  try {
    const reg = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    governance = reg.governance || {};
  } catch (_) {
    return; // Fail-open
  }

  const contentLower = content.toLowerCase();
  const triggers = [];

  // Check council-protocol first (highest stakes)
  const councilCfg = governance["council-protocol"];
  if (councilCfg) {
    const councilKw = (councilCfg.triggers && councilCfg.triggers.keywords_any) || [];
    if (councilKw.some(kw => contentLower.includes(kw))) {
      triggers.push({
        name: "council-protocol",
        tool: councilCfg.tool || "Task",
        reason: "financial/legal/security keywords detected"
      });
    }
  }

  // Check multipersona-audit (30+ lines or keywords)
  const mpCfg = governance["multipersona-audit"];
  if (mpCfg) {
    const mpMin = (mpCfg.triggers && mpCfg.triggers.code_lines_min) || 30;
    const mpKw = (mpCfg.triggers && mpCfg.triggers.keywords_any) || [];
    const mpKeywordHit = mpKw.some(kw => contentLower.includes(kw));

    if (lineCount >= mpMin || mpKeywordHit) {
      const reason = lineCount >= mpMin
        ? `${lineCount} code lines (threshold: ${mpMin})`
        : "high-stakes keyword detected";
      triggers.push({
        name: "multipersona-audit",
        tool: mpCfg.tool || "Task",
        reason: reason
      });
    }
  }

  // Check audit-loop (20+ lines or keywords)
  const alCfg = governance["audit-loop"];
  if (alCfg) {
    const alMin = (alCfg.triggers && alCfg.triggers.code_lines_min) || 20;
    const alKw = (alCfg.triggers && alCfg.triggers.keywords_any) || [];
    const alKeywordHit = alKw.some(kw => contentLower.includes(kw));

    if (lineCount >= alMin || (alKeywordHit && lineCount >= 10)) {
      const reason = lineCount >= alMin
        ? `${lineCount} code lines (threshold: ${alMin})`
        : "governance keyword detected";
      if (!triggers.some(t => t.name === "audit-loop")) {
        triggers.push({
          name: "audit-loop",
          tool: alCfg.tool || "Task",
          reason: reason
        });
      }
    }
  }

  if (triggers.length === 0) return;

  // Output the highest-priority governance trigger
  const primary = triggers[0];
  const fileName = path.basename(filePath);
  const out = {
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: `@GOVERNANCE:${primary.name}:${primary.tool}:${fileName}:${primary.reason}`
    }
  };
  process.stdout.write(JSON.stringify(out));
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
