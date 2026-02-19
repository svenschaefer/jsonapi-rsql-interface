const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequest } = require("../../src");

function makeInput(overrides = {}) {
  return {
    raw_query: "filter=status==active&sort=-status",
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
        fields_allowlist: {
          users: ["id", "status"]
        }
      },
      limits: {
        max_raw_query_length: 4096,
        max_decoded_query_length: 4096,
        max_param_count: 16,
        max_key_value_pairs: 32,
        max_parameter_value_length: 512,
        max_filter_literal_length: 512,
        max_include_paths: 8,
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
      auth_context_hash: "role:admin",
      security_predicate: {
        field: "tenant_id",
        operator: "==",
        bound_parameter_key: "tenant_scope"
      }
    },
    ...overrides
  };
}

test("plan cache key changes when context fingerprint changes", () => {
  const a = compileRequest(makeInput());
  const b = compileRequest(
    makeInput({
      context: {
        tenant_context_present: true,
        auth_context_hash: "role:viewer",
        security_predicate: {
          field: "tenant_id",
          operator: "==",
          bound_parameter_key: "tenant_scope"
        }
      }
    })
  );
  assert.notEqual(a.meta.context_fingerprint, b.meta.context_fingerprint);
  assert.notEqual(a.meta.plan_cache_key, b.meta.plan_cache_key);
});

test("plan cache key changes when policy version changes", () => {
  const a = compileRequest(makeInput());
  const b = compileRequest(
    makeInput({
      policy: {
        ...makeInput().policy,
        version: "v2"
      }
    })
  );
  assert.notEqual(a.meta.plan_cache_key, b.meta.plan_cache_key);
});

test("plan cache key is stable JSON tuple encoding (no delimiter concatenation)", () => {
  const out = compileRequest(
    makeInput({
      context: {
        tenant_context_present: true,
        auth_context_hash: "role:admin|trace:sample",
        security_predicate: {
          field: "tenant_id",
          operator: "==",
          bound_parameter_key: "tenant_scope"
        }
      }
    })
  );
  assert.equal(out.meta.plan_cache_key.startsWith("["), true);
});
