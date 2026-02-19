const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequest, compileRequestSafe } = require("../../src");

function basePolicy(limits = {}) {
  return {
    version: "v1",
    fields: {
      id: { type: "int", filterable: true, operators: ["==", "=in="] },
      status: {
        type: "enum",
        filterable: true,
        operators: ["==", "!="],
        enum_values: ["active", "disabled"]
      }
    },
    query_dimensions: {
      include_allowlist: ["groups", "memberships"],
      sortable_fields: ["status", "id"],
      fields_allowlist: {
        users: ["id", "status"]
      }
    },
    limits: {
      max_raw_query_length: 4096,
      max_decoded_query_length: 4096,
      max_param_count: 8,
      max_key_value_pairs: 12,
      max_parameter_value_length: 128,
      max_filter_literal_length: 128,
      max_include_paths: 4,
      max_include_path_length: 32,
      max_sort_keys: 4,
      max_sparse_fields: 8,
      max_ast_depth: 8,
      max_ast_nodes: 64,
      max_in_list_items: 10,
      ...limits
    }
  };
}

function input(rawQuery, limits) {
  return {
    raw_query: rawQuery,
    policy: basePolicy(limits),
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

test("parameter count limit is enforced", () => {
  const out = compileRequestSafe(input("a=1&b=2&c=3&d=4", { max_param_count: 2 }));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "invalid_query_string");
});

test("filter literal length limit is enforced", () => {
  const longValue = "x".repeat(150);
  const out = compileRequestSafe(
    input(`filter=status==${longValue}`, {
      max_filter_literal_length: 20,
      max_parameter_value_length: 512
    })
  );
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "filter_complexity_exceeded");
});

test("include path length limit is enforced", () => {
  const out = compileRequestSafe(
    input("filter=status==active&include=groups,veryveryveryveryveryveryverylongpath", {
      max_include_path_length: 10
    })
  );
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "filter_complexity_exceeded");
});

test("normalized query key is stable across equivalent ordering", () => {
  const a = compileRequest(input("filter=status==active&include=groups,memberships&sort=-status,id"));
  const b = compileRequest(input("sort=id,-status&include=memberships,groups&filter=status==active"));
  assert.equal(a.meta.normalized_query_key, b.meta.normalized_query_key);
});
