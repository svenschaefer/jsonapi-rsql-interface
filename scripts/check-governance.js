const fs = require("fs");
const path = require("path");

function readFileOrFail(fullPath) {
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, "utf8");
}

function assertPattern(text, pattern, label) {
  if (!pattern.test(text)) {
    throw new Error(`Governance check failed: ${label}`);
  }
}

function getLines(text) {
  return String(text || "").replace(/\r\n/g, "\n").split("\n");
}

function getTopSectionBeforeJobs(workflowText) {
  const lines = getLines(workflowText);
  const idx = lines.findIndex((line) => /^\s*jobs:\s*$/.test(line));
  if (idx < 0) return lines.join("\n");
  return lines.slice(0, idx).join("\n");
}

function extractJobSection(workflowText, jobName) {
  const lines = getLines(workflowText);
  const headerRe = new RegExp(`^\\s{2}${jobName}:\\s*$`);
  const start = lines.findIndex((line) => headerRe.test(line));
  if (start < 0) return "";

  const out = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s{2}[A-Za-z0-9_-]+:\s*$/.test(line)) break;
    out.push(line);
  }
  return out.join("\n");
}

function hasPermissionBlock(text) {
  return /^\s*permissions:\s*$/m.test(text);
}

function assertPermission(text, permission, value, label) {
  const re = new RegExp(`^\\s*${permission}:\\s*${value}\\s*$`, "m");
  if (!re.test(text)) {
    throw new Error(`Governance check failed: ${label}`);
  }
}

function extractWorkflowActionRefs(workflowText) {
  const refs = [];
  const lines = getLines(workflowText);
  for (const line of lines) {
    const match = line.match(/^\s*(?:-\s*)?uses:\s*([^\s#]+)\s*(?:#.*)?$/);
    if (match) refs.push(String(match[1]).trim());
  }
  return refs;
}

function runChecks({ root }) {
  const roadmap = readFileOrFail(path.join(root, "ROADMAP.md"));
  const todo = readFileOrFail(path.join(root, "TODO.md"));
  const changelog = readFileOrFail(path.join(root, "CHANGELOG.md"));
  const packageJson = JSON.parse(readFileOrFail(path.join(root, "package.json")));
  const ciWorkflow = readFileOrFail(path.join(root, ".github", "workflows", "ci.yml"));
  const releaseWorkflow = readFileOrFail(path.join(root, ".github", "workflows", "release.yml"));
  readFileOrFail(path.join(root, "docs", "COMPATIBILITY_POLICY.md"));
  readFileOrFail(path.join(root, "docs", "RELEASE_EVIDENCE.md"));
  readFileOrFail(path.join(root, "docs", "DEPENDENCY_RISK_REGISTER.md"));

  assertPattern(roadmap, /## Execution Ledger/, "ROADMAP.md must include execution ledger");
  assertPattern(todo, /## Status Snapshot/, "TODO.md must include status snapshot");
  assertPattern(changelog, /^## \[?Unreleased\]?\s*$/m, "CHANGELOG.md must include Unreleased section");

  const ciTopSection = getTopSectionBeforeJobs(ciWorkflow);
  if (!hasPermissionBlock(ciTopSection)) {
    throw new Error("Governance check failed: CI workflow must define top-level permissions block");
  }
  assertPermission(
    ciTopSection,
    "contents",
    "read",
    "CI workflow must define least-privilege contents: read"
  );

  const releaseJobSection = extractJobSection(releaseWorkflow, "release-check");
  if (!releaseJobSection || !hasPermissionBlock(releaseJobSection)) {
    throw new Error("Governance check failed: Release workflow must define explicit job permissions block");
  }
  assertPermission(
    releaseJobSection,
    "contents",
    "read",
    "Release workflow job must set contents: read"
  );
  assertPermission(
    releaseJobSection,
    "id-token",
    "write",
    "Release workflow job must set id-token: write"
  );

  const allowedActions = new Set([
    "actions/checkout@v4",
    "actions/setup-node@v4",
    "actions/upload-artifact@v4"
  ]);
  const refs = [
    ...extractWorkflowActionRefs(ciWorkflow),
    ...extractWorkflowActionRefs(releaseWorkflow)
  ];
  for (const actionRef of refs) {
    if (!allowedActions.has(actionRef)) {
      throw new Error(`Governance check failed: unapproved workflow action reference ${actionRef}`);
    }
  }

  if (!/^npm@\d+\.\d+\.\d+$/.test(String(packageJson.packageManager || ""))) {
    throw new Error("Governance check failed: package.json must pin packageManager to npm@<major>.<minor>.<patch>");
  }

  return {
    ok: true,
    checks: [
      "execution_ledger_present",
      "todo_status_snapshot_present",
      "changelog_unreleased_present",
      "compatibility_policy_present",
      "release_evidence_present",
      "dependency_risk_register_present",
      "package_manager_pinned",
      "ci_permissions_explicit",
      "release_permissions_explicit",
      "workflow_action_refs_verified"
    ]
  };
}

function main() {
  const root = path.resolve(__dirname, "..");
  const payload = runChecks({ root });
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  getTopSectionBeforeJobs,
  extractJobSection,
  hasPermissionBlock,
  assertPermission,
  extractWorkflowActionRefs,
  runChecks,
  main
};
