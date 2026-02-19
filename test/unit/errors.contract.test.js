const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequestSafe } = require("../../src");

test("relationship-path filter is rejected with deterministic code", () => {
  const result = compileRequestSafe({
    raw_query: "filter=group.name==x",
    policy: { version: "v1", limits: {} },
    context: {
      tenant_context_present: true,
      security_predicate: { field: "tenant_id", operator: "==", bound_parameter_key: "tenant_scope" }
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "invalid_filter_syntax");
  assert.equal(result.errors[0].status, "400");
});

test("empty in-list is rejected with deterministic code", () => {
  const result = compileRequestSafe({
    raw_query: "filter=status=in=()",
    policy: { version: "v1", limits: {} },
    context: {
      tenant_context_present: true,
      security_predicate: { field: "tenant_id", operator: "==", bound_parameter_key: "tenant_scope" }
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "empty_in_list_not_allowed");
  assert.equal(result.errors[0].status, "400");
});
