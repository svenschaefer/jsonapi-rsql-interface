const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  parseArgs,
  getScopedHarnessDir,
  resolveLatestScopedHarnessDir,
  resolveHarnessExecutionDir,
  validateOptions,
  buildRunCommand
} = require("../../scripts/run-external-smoke.js");

function makeHarnessRootWithInstalledPackage(timestamp = "20260219T213000Z") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "jsonapi-rsql-smoke-root-"));
  const scoped = path.join(root, `${timestamp}-pre-1.0.0`);
  const installed = path.join(scoped, "node_modules", "jsonapi-rsql-interface-smoke-test");
  fs.mkdirSync(installed, { recursive: true });
  fs.writeFileSync(
    path.join(installed, "package.json"),
    JSON.stringify({ name: "jsonapi-rsql-interface-smoke-test", version: "1.0.0", scripts: {} }, null, 2),
    "utf8"
  );
  return root;
}

test("getScopedHarnessDir appends timestamp-phase-version under harness root", () => {
  const root = "C:\\code\\jsonapi-rsql-interface-smoke-test";
  assert.equal(
    getScopedHarnessDir(root, "20260219T213000Z", "pre", "1.0.0"),
    path.join(path.resolve(root), "20260219T213000Z-pre-1.0.0")
  );
});

test("parseArgs reads timestamp and package-source", () => {
  const out = parseArgs([
    "--phase",
    "pre",
    "--version",
    "1.0.0",
    "--timestamp",
    "20260219T213000Z",
    "--harness-dir",
    "C:\\tmp\\h",
    "--package-name",
    "jsonapi-rsql-interface",
    "--package-source",
    "C:\\tmp\\artifact.tgz"
  ]);
  assert.equal(out.phase, "pre");
  assert.equal(out.version, "1.0.0");
  assert.equal(out.timestamp, "20260219T213000Z");
  assert.equal(out.harnessDir, "C:\\tmp\\h");
  assert.equal(out.packageSource, "C:\\tmp\\artifact.tgz");
});

test("validateOptions requires semantic version without leading v", () => {
  const root = makeHarnessRootWithInstalledPackage();
  assert.throws(
    () =>
      validateOptions({
        phase: "pre",
        version: "v1.0.0",
        timestamp: "20260219T213000Z",
        harnessDir: root,
        harnessPackage: "jsonapi-rsql-interface-smoke-test",
        packageName: "jsonapi-rsql-interface",
        packageSource: "C:\\tmp\\artifact.tgz"
      }),
    /Invalid --version/i
  );
});

test("validateOptions requires timestamp format when provided", () => {
  const root = makeHarnessRootWithInstalledPackage();
  assert.throws(
    () =>
      validateOptions({
        phase: "post",
        version: "1.0.0",
        timestamp: "bad",
        harnessDir: root,
        harnessPackage: "jsonapi-rsql-interface-smoke-test",
        packageName: "jsonapi-rsql-interface",
        packageSource: ""
      }),
    /Invalid --timestamp/i
  );
});

test("buildRunCommand maps phase to smoke script", () => {
  const spec = buildRunCommand({
    phase: "post",
    version: "1.0.0",
    harnessDir: "C:\\code\\jsonapi-rsql-interface-smoke-test\\20260219T213000Z-post-1.0.0",
    packageName: "jsonapi-rsql-interface",
    packageSource: ""
  });
  if (process.platform === "win32") {
    assert.equal(spec.cmd, "cmd.exe");
    assert.match(spec.args[3], /smoke:postpublish/);
  } else {
    assert.equal(spec.cmd, "npm");
    assert.equal(spec.args[2], "smoke:postpublish");
  }
});

test("validateOptions requires package-source for pre phase", () => {
  const root = makeHarnessRootWithInstalledPackage();
  assert.throws(
    () =>
      validateOptions({
        phase: "pre",
        version: "1.0.0",
        timestamp: "20260219T213000Z",
        harnessDir: root,
        harnessPackage: "jsonapi-rsql-interface-smoke-test",
        packageName: "jsonapi-rsql-interface",
        packageSource: ""
      }),
    /requires --package-source/i
  );
});

test("resolveLatestScopedHarnessDir picks lexically latest timestamp", () => {
  const root = makeHarnessRootWithInstalledPackage("20260219T213000Z");
  const newer = path.join(root, "20260219T213100Z-pre-1.0.0");
  fs.mkdirSync(path.join(newer, "node_modules", "jsonapi-rsql-interface-smoke-test"), { recursive: true });
  fs.writeFileSync(
    path.join(newer, "node_modules", "jsonapi-rsql-interface-smoke-test", "package.json"),
    JSON.stringify({ name: "jsonapi-rsql-interface-smoke-test", version: "1.0.0", scripts: {} }, null, 2),
    "utf8"
  );
  const resolved = resolveLatestScopedHarnessDir(root, "pre", "1.0.0");
  assert.equal(resolved, newer);
});

test("resolveHarnessExecutionDir falls back to installed package location", () => {
  const root = makeHarnessRootWithInstalledPackage();
  const resolved = resolveHarnessExecutionDir({
    phase: "pre",
    version: "1.0.0",
    timestamp: "20260219T213000Z",
    harnessDir: root,
    harnessPackage: "jsonapi-rsql-interface-smoke-test"
  });
  assert.equal(
    resolved,
    path.join(root, "20260219T213000Z-pre-1.0.0", "node_modules", "jsonapi-rsql-interface-smoke-test")
  );
});
