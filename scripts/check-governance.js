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

function extractTopSection(text, marker) {
  const idx = text.indexOf(marker);
  if (idx < 0) return text;
  return text.slice(0, idx);
}

function extractJobSection(workflowText, jobName) {
  const re = new RegExp(`\\n\\s{2}${jobName}:([\\s\\S]+)`);
  const match = workflowText.match(re);
  return match ? match[1] : "";
}

function assertPermission(text, permission, value, label) {
  const re = new RegExp(`${permission}:\\s*${value}\\b`);
  if (!re.test(text)) {
    throw new Error(`Governance check failed: ${label}`);
  }
}

function main() {
  const root = path.resolve(__dirname, "..");
  const roadmap = readFileOrFail(path.join(root, "ROADMAP.md"));
  const todo = readFileOrFail(path.join(root, "TODO.md"));
  const changelog = readFileOrFail(path.join(root, "CHANGELOG.md"));
  const ciWorkflow = readFileOrFail(path.join(root, ".github", "workflows", "ci.yml"));
  const releaseWorkflow = readFileOrFail(path.join(root, ".github", "workflows", "release.yml"));
  readFileOrFail(path.join(root, "docs", "COMPATIBILITY_POLICY.md"));
  readFileOrFail(path.join(root, "docs", "RELEASE_EVIDENCE.md"));
  readFileOrFail(path.join(root, "docs", "DEPENDENCY_RISK_REGISTER.md"));

  assertPattern(roadmap, /## Execution Ledger/, "ROADMAP.md must include execution ledger");
  assertPattern(todo, /## Status Snapshot/, "TODO.md must include status snapshot");
  assertPattern(changelog, /^## \[?Unreleased\]?\s*$/m, "CHANGELOG.md must include Unreleased section");
  const ciTopSection = extractTopSection(ciWorkflow, "\njobs:");
  assertPattern(ciTopSection, /permissions:\s*/m, "CI workflow must define top-level permissions block");
  assertPermission(
    ciTopSection,
    "contents",
    "read",
    "CI workflow must define least-privilege contents: read"
  );

  const releaseJobSection = extractJobSection(releaseWorkflow, "release-check");
  assertPattern(
    releaseJobSection,
    /\n\s+permissions:\s*/m,
    "Release workflow must define explicit job permissions block"
  );
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
  const workflowTexts = [ciWorkflow, releaseWorkflow];
  for (const text of workflowTexts) {
    const matches = text.matchAll(/uses:\s*([^\s]+)/g);
    for (const match of matches) {
      const actionRef = String(match[1]).trim();
      if (!allowedActions.has(actionRef)) {
        throw new Error(`Governance check failed: unapproved workflow action reference ${actionRef}`);
      }
    }
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "execution_ledger_present",
          "todo_status_snapshot_present",
          "changelog_unreleased_present",
          "compatibility_policy_present",
          "release_evidence_present",
          "dependency_risk_register_present",
          "ci_permissions_explicit",
          "release_permissions_explicit",
          "workflow_action_refs_verified"
        ]
      },
      null,
      2
    ) + "\n"
  );
}

main();
