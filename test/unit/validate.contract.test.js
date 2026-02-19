const test = require("node:test");
const assert = require("node:assert/strict");

const { validatePlan } = require("../../src/validate");

test("validatePlan accepts minimal valid query plan", () => {
  const result = validatePlan({
    kind: "query_plan",
    meta: {
      policy_version: "v1",
      tenant_context_present: true
    }
  });

  assert.equal(result.ok, true);
});
