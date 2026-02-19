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
    process.argv = [
      "node",
      "script",
      "--phase",
      "pre",
      "--version",
      "1.0.0",
      "--timestamp",
      "20260219T213000Z",
      "--harness-dir",
      dir
    ];
    run();
  } finally {
    process.argv = argv;
  }
  const scoped = path.join(dir, "20260219T213000Z-pre-1.0.0");
  const pkgPath = path.join(scoped, "package.json");
  const runnerPath = path.join(scoped, "smoke-runner.js");
  assert.equal(fs.existsSync(pkgPath), true);
  assert.equal(fs.existsSync(runnerPath), true);
  const runnerText = fs.readFileSync(runnerPath, "utf8");
  assert.match(runnerText, /Pre-publish smoke requires --package-source\./);
  assert.match(runnerText, /installed_from/);
  assert.match(runnerText, /resolved_package_dir/);
  assert.match(runnerText, /resolved_entrypoint/);
  assert.match(runnerText, /inspectInstalledArtifact/);
  assert.match(runnerText, /compileRequestSafe\(sentinel_negative\)/);
  assert.match(runnerText, /assertAdapterContract/);
  assert.match(runnerText, /@jsonapi-rsql\/pg/);
  assert.match(runnerText, /getTableSql/);
  assert.match(runnerText, /placeholder\/value alignment/);
});
