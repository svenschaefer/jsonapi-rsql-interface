const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  parseArgs,
  resolveHarnessExecutionDir,
  validateOptions,
  buildRunCommand
} = require("../../scripts/run-external-smoke.js");

function makeHarnessDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jsonapi-rsql-smoke-"));
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "smoke-harness", version: "0.0.0", scripts: {} }, null, 2),
    "utf8"
  );
  return dir;
}

function makeHarnessRootWithInstalledPackage() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "jsonapi-rsql-smoke-root-"));
  const installed = path.join(root, "node_modules", "jsonapi-rsql-interface-smoke-test");
  fs.mkdirSync(installed, { recursive: true });
  fs.writeFileSync(
    path.join(installed, "package.json"),
    JSON.stringify({ name: "jsonapi-rsql-interface-smoke-test", version: "1.0.0", scripts: {} }, null, 2),
    "utf8"
  );
  return root;
}

test("parseArgs reads phase/version/harness/package values", () => {
  const out = parseArgs([
    "--phase",
    "pre",
    "--version",
    "1.0.0",
    "--harness-dir",
    "C:\\tmp\\h",
    "--package-name",
    "jsonapi-rsql-interface",
    "--package-source",
    "C:\\tmp\\artifact.tgz"
  ]);
  assert.equal(out.phase, "pre");
  assert.equal(out.version, "1.0.0");
  assert.equal(out.harnessDir, "C:\\tmp\\h");
  assert.equal(out.packageSource, "C:\\tmp\\artifact.tgz");
});

test("parseArgs reads harness package override", () => {
  const out = parseArgs(["--harness-package", "custom-smoke-harness"]);
  assert.equal(out.harnessPackage, "custom-smoke-harness");
});

test("validateOptions requires semantic version without leading v", () => {
  const dir = makeHarnessDir();
  assert.throws(
    () =>
      validateOptions({
        phase: "pre",
        version: "v1.0.0",
        harnessDir: dir,
        packageName: "jsonapi-rsql-interface"
      }),
    /Invalid --version/i
  );
});

test("buildRunCommand maps phase to smoke script", () => {
  const spec = buildRunCommand({
    phase: "post",
    version: "1.0.0",
    harnessDir: "C:\\code\\jsonapi-rsql-interface-smoke-test",
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
        harnessDir: root,
        harnessPackage: "jsonapi-rsql-interface-smoke-test",
        packageName: "jsonapi-rsql-interface",
        packageSource: ""
      }),
    /requires --package-source/i
  );
});

test("resolveHarnessExecutionDir falls back to installed package location", () => {
  const root = makeHarnessRootWithInstalledPackage();
  const resolved = resolveHarnessExecutionDir({
    harnessDir: root,
    harnessPackage: "jsonapi-rsql-interface-smoke-test"
  });
  assert.equal(resolved, path.join(root, "node_modules", "jsonapi-rsql-interface-smoke-test"));
});
