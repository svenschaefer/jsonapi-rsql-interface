const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  parseArgs,
  validateOptions,
  buildInstallSpec
} = require("../../scripts/prepare-external-smoke.js");

test("parseArgs reads version and harness options", () => {
  const out = parseArgs([
    "--version",
    "1.0.0",
    "--harness-dir",
    "C:\\tmp\\h",
    "--harness-package",
    "jsonapi-rsql-interface-smoke-test"
  ]);
  assert.equal(out.version, "1.0.0");
  assert.equal(out.harnessDir, "C:\\tmp\\h");
  assert.equal(out.harnessPackage, "jsonapi-rsql-interface-smoke-test");
});

test("validateOptions enforces semantic version", () => {
  assert.throws(
    () =>
      validateOptions({
        version: "v1.0.0",
        harnessDir: "C:\\tmp\\h",
        harnessPackage: "jsonapi-rsql-interface-smoke-test"
      }),
    /Invalid --version/i
  );
});

test("validateOptions allows missing version when harness install spec is provided", () => {
  const out = validateOptions({
    version: "",
    harnessDir: "C:\\tmp\\h",
    harnessPackage: "jsonapi-rsql-interface-smoke-test",
    harnessInstallSpec: "file:../artifact.tgz"
  });
  assert.equal(out.harnessInstallSpec, "file:../artifact.tgz");
});

test("validateOptions creates harness dir if missing", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "jsonapi-rsql-prepare-"));
  const dir = path.join(base, "nested", "harness");
  const out = validateOptions({
    version: "1.0.0",
    harnessDir: dir,
    harnessPackage: "jsonapi-rsql-interface-smoke-test"
  });
  assert.equal(fs.existsSync(out.harnessDir), true);
});

test("buildInstallSpec uses install with --prefix and no-save", () => {
  const spec = buildInstallSpec({
    version: "1.0.0",
    harnessDir: "C:\\code\\jsonapi-rsql-interface-smoke-test",
    harnessPackage: "jsonapi-rsql-interface-smoke-test"
  });
  if (process.platform === "win32") {
    assert.equal(spec.cmd, "cmd.exe");
    assert.match(spec.args[3], /npm install --prefix/);
  } else {
    assert.equal(spec.cmd, "npm");
    assert.equal(spec.args[0], "install");
    assert.equal(spec.args[4], "jsonapi-rsql-interface-smoke-test@1.0.0");
  }
});

test("buildInstallSpec prefers explicit harness install spec", () => {
  const spec = buildInstallSpec({
    version: "1.0.0",
    harnessDir: "C:\\code\\jsonapi-rsql-interface-smoke-test",
    harnessPackage: "jsonapi-rsql-interface-smoke-test",
    harnessInstallSpec: "git+https://example.invalid/harness.git#v1.0.0"
  });
  if (process.platform === "win32") {
    assert.match(spec.args[3], /git\+https:\/\/example\.invalid\/harness\.git#v1\.0\.0/);
  } else {
    assert.equal(spec.args[4], "git+https://example.invalid/harness.git#v1.0.0");
  }
});
