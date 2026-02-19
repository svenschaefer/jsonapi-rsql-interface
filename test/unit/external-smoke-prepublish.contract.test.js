const test = require("node:test");
const assert = require("node:assert/strict");

const { getNpmCommand, parseArgs } = require("../../scripts/run-prepublish-external-smoke.js");

test("getNpmCommand returns platform-specific npm binary", () => {
  const cmd = getNpmCommand();
  if (process.platform === "win32") {
    assert.equal(cmd, "npm.cmd");
  } else {
    assert.equal(cmd, "npm");
  }
});

test("parseArgs allows overriding version and harness values", () => {
  const out = parseArgs([
    "--version",
    "1.0.0",
    "--harness-dir",
    "C:\\tmp\\h",
    "--harness-package",
    "jsonapi-rsql-interface-smoke-test",
    "--package-name",
    "jsonapi-rsql-interface",
    "--workspace",
    "packages/adapter-pg",
    "--timestamp",
    "20260219T213000Z"
  ]);
  assert.equal(out.version, "1.0.0");
  assert.equal(out.harnessDir, "C:\\tmp\\h");
  assert.equal(out.timestamp, "20260219T213000Z");
  assert.equal(out.workspace, "packages/adapter-pg");
});
