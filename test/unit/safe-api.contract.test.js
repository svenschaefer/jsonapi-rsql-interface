const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequestSafe } = require("../../src");

test("compileRequestSafe returns deterministic error envelope for invalid input shape", () => {
  const out = compileRequestSafe(null);
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "invalid_query_string");
});

test("compileRequestSafe converts unexpected internal exceptions to internal_error", () => {
  const out = compileRequestSafe({
    raw_query: "filter=status==active",
    policy: {
      version: "v1",
      get fields() {
        throw new Error("boom");
      },
      query_dimensions: {
        include_allowlist: [],
        sortable_fields: [],
        fields_allowlist: {}
      },
      limits: {}
    },
    context: {
      tenant_context_present: true,
      security_predicate: {
        field: "tenant_id",
        operator: "==",
        bound_parameter_key: "tenant_scope"
      }
    }
  });

  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "internal_error");
  assert.equal(out.errors[0].status, "500");
});
