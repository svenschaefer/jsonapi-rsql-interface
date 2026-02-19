const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..", "..");

test("governance check script passes and emits structured JSON", () => {
  const result = spawnSync(process.execPath, [path.join(repoRoot, "scripts", "check-governance.js")], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.ok(Array.isArray(payload.checks));
  assert.ok(payload.checks.includes("execution_ledger_present"));
});
