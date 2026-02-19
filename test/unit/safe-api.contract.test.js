const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequestSafe } = require("../../src");

test("compileRequestSafe returns deterministic error envelope for invalid input shape", () => {
  const out = compileRequestSafe(null);
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "invalid_query_string");
});

