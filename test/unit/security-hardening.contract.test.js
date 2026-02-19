const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequestSafe } = require("../../src");

function basePolicy() {
  return {
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
      max_include_paths: 10,
      max_sort_keys: 8,
      max_sparse_fields: 25,
      max_ast_depth: 8,
      max_ast_nodes: 64,
      max_in_list_items: 50
    }
  };
}

function input(rawQuery, policy) {
  return {
    raw_query: rawQuery,
    policy,
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

test("hardened mode collapses unknown_field into field_not_allowed", () => {
  const policy = {
    ...basePolicy(),
    security: {
      hardened_mode: true
    }
  };
  const out = compileRequestSafe(input("filter=ghost==x", policy));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "field_not_allowed");
});

test("policy security validation blocks sensitive field exposure", () => {
  const policy = {
    ...basePolicy(),
    fields: {
      ...basePolicy().fields,
      password_hash: {
        type: "string",
        filterable: true,
        operators: ["=="]
      }
    },
    security: {
      validate_artifacts: true
    }
  };
  const out = compileRequestSafe(input("filter=status==active", policy));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "field_not_allowed");
});

test("policy security validation blocks write flags in read policy artifact", () => {
  const policy = {
    ...basePolicy(),
    fields: {
      ...basePolicy().fields,
      status: {
        ...basePolicy().fields.status,
        writable: true
      }
    },
    security: {
      validate_artifacts: true
    }
  };
  const out = compileRequestSafe(input("filter=status==active", policy));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "field_not_allowed");
});
