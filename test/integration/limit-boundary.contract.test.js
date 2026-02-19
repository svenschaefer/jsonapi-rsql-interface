const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequestSafe } = require("../../src");

function input(rawQuery, maxInList) {
  return {
    raw_query: rawQuery,
    policy: {
      version: "v1",
      fields: {
        id: { type: "int", filterable: true, operators: ["=in=", "=out=", "=="] }
      },
      query_dimensions: {
        include_allowlist: [],
        sortable_fields: [],
        fields_allowlist: { users: ["id"] }
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
        max_in_list_items: maxInList
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

test("max_in_list_items boundary: limit passes, limit+1 fails", () => {
  const pass = compileRequestSafe(input("filter=id=in=(1,2,3)", 3));
  const fail = compileRequestSafe(input("filter=id=in=(1,2,3,4)", 3));

  assert.equal(pass.ok, true);
  assert.equal(fail.ok, false);
  assert.equal(fail.errors[0].code, "filter_complexity_exceeded");
});
