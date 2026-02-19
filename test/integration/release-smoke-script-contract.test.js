const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const scriptPath = path.resolve(__dirname, "..", "..", "scripts", "release-smoke-check.js");

test("release smoke script checks API exports and CLI usage", () => {
  const script = fs.readFileSync(scriptPath, "utf8");
  assert.match(script, /compileRequest/);
  assert.match(script, /compileRequestSafe/);
  assert.match(script, /Usage:/);
});
