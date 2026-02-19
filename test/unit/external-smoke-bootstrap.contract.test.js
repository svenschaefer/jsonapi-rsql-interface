const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { run } = require("../../scripts/bootstrap-external-smoke-harness.js");

test("bootstrap script creates harness package.json and runner", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jsonapi-rsql-harness-bootstrap-"));
  const argv = process.argv.slice();
  try {
    process.argv = ["node", "script", "--harness-dir", dir];
    run();
  } finally {
    process.argv = argv;
  }
  const pkgPath = path.join(dir, "package.json");
  const runnerPath = path.join(dir, "smoke-runner.js");
  assert.equal(fs.existsSync(pkgPath), true);
  assert.equal(fs.existsSync(runnerPath), true);
});

