const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  parseArgs,
  validateOptions,
  buildInstallSpecs,
  getTimestampScopedHarnessDir,
  createRunTimestamp
} = require("../../scripts/prepare-external-smoke.js");

test("parseArgs reads version and harness options", () => {
  const out = parseArgs([
    "--phase",
    "pre",
    "--version",
    "1.0.0",
    "--timestamp",
    "20260219T213000Z",
    "--harness-dir",
    "C:\\tmp\\h",
    "--harness-package",
    "jsonapi-rsql-interface-smoke-test"
  ]);
  assert.equal(out.phase, "pre");
  assert.equal(out.version, "1.0.0");
  assert.equal(out.timestamp, "20260219T213000Z");
  assert.equal(out.harnessDir, "C:\\tmp\\h");
  assert.equal(out.harnessPackage, "jsonapi-rsql-interface-smoke-test");
});

test("validateOptions enforces semantic version", () => {
  assert.throws(
    () =>
      validateOptions({
        phase: "pre",
        version: "v1.0.0",
        timestamp: "20260219T213000Z",
        harnessDir: "C:\\tmp\\h",
        harnessPackage: "jsonapi-rsql-interface-smoke-test"
      }),
    /Invalid --version/i
  );
});

test("validateOptions enforces timestamp format when provided", () => {
  assert.throws(
    () =>
      validateOptions({
        phase: "pre",
        version: "1.0.0",
        timestamp: "bad",
        harnessDir: "C:\\tmp\\h",
        harnessPackage: "jsonapi-rsql-interface-smoke-test"
      }),
    /Invalid --timestamp/i
  );
});

test("validateOptions requires version even when harness install spec is provided", () => {
  assert.throws(
    () =>
      validateOptions({
        phase: "pre",
        version: "",
        timestamp: "20260219T213000Z",
        harnessDir: "C:\\tmp\\h",
        harnessPackage: "jsonapi-rsql-interface-smoke-test",
        harnessInstallSpec: "file:../artifact.tgz"
      }),
    /Invalid --version/i
  );
});

test("validateOptions creates timestamp-scoped harness dirs", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "jsonapi-rsql-prepare-"));
  const out = validateOptions({
    phase: "all",
    version: "1.0.0",
    timestamp: "20260219T213000Z",
    harnessDir: base,
    harnessPackage: "jsonapi-rsql-interface-smoke-test"
  });
  assert.equal(fs.existsSync(path.join(base, "20260219T213000Z-pre-1.0.0")), true);
  assert.equal(fs.existsSync(path.join(base, "20260219T213000Z-post-1.0.0")), true);
  assert.equal(out.scopedHarnessDirs.length, 2);
});

test("buildInstallSpecs uses install with --prefix and no-save", () => {
  const specs = buildInstallSpecs({
    version: "1.0.0",
    harnessPackage: "jsonapi-rsql-interface-smoke-test",
    scopedHarnessDirs: ["C:\\code\\jsonapi-rsql-interface-smoke-test\\20260219T213000Z-pre-1.0.0"]
  });
  const spec = specs[0];
  if (process.platform === "win32") {
    assert.equal(spec.cmd, "cmd.exe");
    assert.match(spec.args[3], /npm install --prefix/);
  } else {
    assert.equal(spec.cmd, "npm");
    assert.equal(spec.args[0], "install");
    assert.equal(spec.args[4], "jsonapi-rsql-interface-smoke-test@1.0.0");
  }
});

test("buildInstallSpecs prefers explicit harness install spec", () => {
  const specs = buildInstallSpecs({
    version: "1.0.0",
    harnessPackage: "jsonapi-rsql-interface-smoke-test",
    harnessInstallSpec: "git+https://example.invalid/harness.git#v1.0.0",
    scopedHarnessDirs: ["C:\\code\\jsonapi-rsql-interface-smoke-test\\20260219T213000Z-pre-1.0.0"]
  });
  const spec = specs[0];
  if (process.platform === "win32") {
    assert.match(spec.args[3], /git\+https:\/\/example\.invalid\/harness\.git#v1\.0\.0/);
  } else {
    assert.equal(spec.args[4], "git+https://example.invalid/harness.git#v1.0.0");
  }
});

test("getTimestampScopedHarnessDir composes expected folder name", () => {
  const out = getTimestampScopedHarnessDir("C:\\tmp\\h", "20260219T213000Z", "pre", "1.0.0");
  assert.equal(out, path.join(path.resolve("C:\\tmp\\h"), "20260219T213000Z-pre-1.0.0"));
});

test("createRunTimestamp returns UTC basic format", () => {
  const value = createRunTimestamp(new Date("2026-02-19T21:30:45.000Z"));
  assert.equal(value, "20260219T213045Z");
});
