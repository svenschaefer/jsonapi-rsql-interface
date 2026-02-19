const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequestSafe } = require("../../src");

function baseInput(rawQuery) {
  return {
    raw_query: rawQuery,
    policy: {
      version: "v1",
      fields: {
        status: {
          type: "enum",
          filterable: true,
          operators: ["==", "!="],
          enum_values: ["active", "disabled"]
        }
      },
      query_dimensions: {
        include_allowlist: ["groups"],
        sortable_fields: ["status"],
        fields_allowlist: { users: ["id", "status"] }
      },
      limits: {
        max_raw_query_length: 4096,
        max_decoded_query_length: 4096,
        max_param_count: 16,
        max_key_value_pairs: 32,
        max_parameter_value_length: 512,
        max_filter_literal_length: 512,
        max_include_paths: 4,
        max_include_path_length: 64,
        max_sort_keys: 4,
        max_sparse_fields: 16,
        max_ast_depth: 8,
        max_ast_nodes: 64,
        max_in_list_items: 20
      }
    },
    context: {
      tenant_context_present: true,
      security_predicate: {
        field: "tenant_id",
        operator: "==",
        bound_parameter_key: "tenant_scope"
      }
    }
  };
}

function assertNoLeakage(errorObj) {
  const body = JSON.stringify(errorObj);
  const forbiddenPatterns = [
    /select\s+/i,
    /from\s+/i,
    /insert\s+/i,
    /update\s+/i,
    /delete\s+/i,
    /stack/i,
    /C:\\\\/i,
    /\/home\//i,
    /node_modules/i
  ];
  for (const pattern of forbiddenPatterns) {
    assert.equal(pattern.test(body), false, `forbidden leakage pattern found: ${pattern}`);
  }
}

test("error output does not leak schema/sql/internal paths for invalid field", () => {
  const out = compileRequestSafe(baseInput("filter=doesNotExist==1"));
  assert.equal(out.ok, false);
  assertNoLeakage(out.errors[0]);
});

test("error output does not leak schema/sql/internal paths for include denial", () => {
  const out = compileRequestSafe(baseInput("filter=status==active&include=memberships"));
  assert.equal(out.ok, false);
  assertNoLeakage(out.errors[0]);
});

test("error output does not leak internals for malformed query encoding", () => {
  const out = compileRequestSafe(baseInput("filter=%E0%A4%A"));
  assert.equal(out.ok, false);
  assertNoLeakage(out.errors[0]);
});
