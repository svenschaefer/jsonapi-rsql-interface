const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..");

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

test("CHANGELOG keeps an Unreleased section", () => {
  const changelog = read("CHANGELOG.md");
  assert.match(changelog, /^## \[?Unreleased\]?\s*$/m);
});

test("README documentation links reference existing files", () => {
  const readme = read("README.md");
  const requiredDocs = [
    "docs/NPM_RELEASE.md",
    "docs/REPO_WORKFLOWS.md",
    "docs/OPERATIONAL.md",
    "docs/DEV_TOOLING.md",
    "docs/RELEASE_NOTES_TEMPLATE.md",
    "docs/BASELINE_TEST_RUN.md",
    "docs/GUARANTEES.md",
    "docs/STATUSQUO.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CHANGELOG.md"
  ];

  for (const doc of requiredDocs) {
    assert.match(readme, new RegExp(doc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.ok(exists(doc), `missing documented file: ${doc}`);
  }
});
