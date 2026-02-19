const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { compileRequest } = require("../../src");

function loadJson(fileName) {
  const p = path.resolve(__dirname, `../fixtures/${fileName}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

test("compileRequest is deterministic for identical input", () => {
  const input = loadJson("compile-input.json");
  const a = compileRequest(input);
  const b = compileRequest(input);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});
