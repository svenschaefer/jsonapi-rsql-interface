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

function main() {
  const root = path.resolve(__dirname, "..");
  const roadmap = readFileOrFail(path.join(root, "ROADMAP.md"));
  const todo = readFileOrFail(path.join(root, "TODO.md"));
  const changelog = readFileOrFail(path.join(root, "CHANGELOG.md"));
  readFileOrFail(path.join(root, "docs", "COMPATIBILITY_POLICY.md"));
  readFileOrFail(path.join(root, "docs", "RELEASE_EVIDENCE.md"));

  assertPattern(roadmap, /## Execution Ledger/, "ROADMAP.md must include execution ledger");
  assertPattern(todo, /## Status Snapshot/, "TODO.md must include status snapshot");
  assertPattern(changelog, /^## \[?Unreleased\]?\s*$/m, "CHANGELOG.md must include Unreleased section");

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "execution_ledger_present",
          "todo_status_snapshot_present",
          "changelog_unreleased_present",
          "compatibility_policy_present",
          "release_evidence_present"
        ]
      },
      null,
      2
    ) + "\n"
  );
}

main();
