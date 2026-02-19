const test = require("node:test");
const assert = require("node:assert/strict");

const { ERROR_CATALOG, compileRequestSafe } = require("../../src");

function input(rawQuery, overrides = {}) {
  return {
    raw_query: rawQuery,
    policy: {
      version: "v1",
      fields: {
        id: { type: "int", filterable: true, operators: ["==", "!=", "=in=", "=out="] },
        score: { type: "float", filterable: true, operators: ["=="] },
        status: {
          type: "enum",
          filterable: true,
          operators: ["==", "!="],
          enum_values: ["active", "disabled"]
        },
        name: { type: "string", filterable: true, operators: ["==", "!="] }
      },
      query_dimensions: {
        include_allowlist: ["groups"],
        sortable_fields: ["status"],
        fields_allowlist: { users: ["id", "status"] }
      },
      limits: {
        max_raw_query_length: 4096,
        max_decoded_query_length: 4096,
        max_include_paths: 2,
        max_sort_keys: 2,
        max_sparse_fields: 2,
        max_ast_depth: 8,
        max_ast_nodes: 64,
        max_in_list_items: 3
      },
      ...overrides.policy
    },
    context: {
      tenant_context_present: true,
      security_predicate: {
        field: "tenant_id",
        operator: "==",
        bound_parameter_key: "tenant_scope"
      },
      ...(overrides.context || {})
    }
  };
}

test("error catalog baseline codes remain present", () => {
  const expected = [
    "invalid_query_string",
    "invalid_filter_syntax",
    "filter_complexity_exceeded",
    "unknown_field",
    "field_not_allowed",
    "operator_not_allowed",
    "value_type_mismatch",
    "wildcard_not_allowed",
    "wildcard_operator_not_allowed",
    "wildcard_type_not_supported",
    "invalid_wildcard_pattern",
    "empty_in_list_not_allowed",
    "sort_not_allowed",
    "include_not_allowed",
    "fields_not_allowed",
    "page_parameter_invalid",
    "security_predicate_required",
    "internal_error"
  ];
  for (const code of expected) {
    assert.equal(typeof ERROR_CATALOG[code], "object", `missing error catalog code: ${code}`);
    assert.equal(typeof ERROR_CATALOG[code].status, "number", `status must be numeric: ${code}`);
    assert.equal(typeof ERROR_CATALOG[code].title, "string", `title must be string: ${code}`);
  }
});

test("canonical code: invalid_query_string for duplicate params", () => {
  const out = compileRequestSafe(input("", { context: { security_predicate: { field: "t", operator: "==" } } }));
  assert.equal(out.ok, true);

  const dup = compileRequestSafe({
    ...input(""),
    query: { filter: ["a", "b"] }
  });
  assert.equal(dup.ok, false);
  assert.equal(dup.errors[0].code, "invalid_query_string");
});

test("canonical code: invalid_filter_syntax for malformed clause", () => {
  const out = compileRequestSafe(input("filter=id="));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "invalid_filter_syntax");
});

test("canonical code: invalid_query_string for malformed query encoding", () => {
  const out = compileRequestSafe(input("filter=%E0%A4%A"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "invalid_query_string");
});

test("canonical code: unknown_field for non-registered field", () => {
  const out = compileRequestSafe(input("filter=ghost==1"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "unknown_field");
});

test("canonical code: operator_not_allowed when field operator is disallowed", () => {
  const out = compileRequestSafe(input("filter=score!=1"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "operator_not_allowed");
});

test("canonical code: value_type_mismatch when value type is invalid", () => {
  const out = compileRequestSafe(input("filter=id==1.2"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "value_type_mismatch");
});

test("canonical code: empty_in_list_not_allowed for empty set", () => {
  const out = compileRequestSafe(input("filter=id=in=()"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "empty_in_list_not_allowed");
});

test("canonical code: include_not_allowed for forbidden include", () => {
  const out = compileRequestSafe(input("filter=status==active&include=memberships"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "include_not_allowed");
});

test("canonical code: sort_not_allowed for forbidden sort", () => {
  const out = compileRequestSafe(input("filter=status==active&sort=-id"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "sort_not_allowed");
});

test("canonical code: fields_not_allowed for forbidden sparse field", () => {
  const out = compileRequestSafe(input("filter=status==active&fields[users]=id,secret"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "fields_not_allowed");
});

test("canonical code: page_parameter_invalid for invalid page size", () => {
  const out = compileRequestSafe(input("filter=status==active&page[size]=0"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "page_parameter_invalid");
});

test("canonical code: filter_complexity_exceeded for membership list limit", () => {
  const out = compileRequestSafe(input("filter=id=in=(1,2,3,4)"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "filter_complexity_exceeded");
});

test("canonical code: wildcard_not_allowed when field has no wildcard policy", () => {
  const out = compileRequestSafe(input("filter=name==act*"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "wildcard_not_allowed");
});

test("canonical code: invalid_wildcard_pattern for unsupported wildcard form", () => {
  const out = compileRequestSafe(
    input("filter=name==a*b", {
      policy: {
        fields: {
          id: { type: "int", filterable: true, operators: ["==", "!=", "=in=", "=out="] },
          score: { type: "float", filterable: true, operators: ["=="] },
          name: {
            type: "string",
            filterable: true,
            operators: ["==", "!="],
            wildcard: { enabled: true, modes: ["contains", "starts_with", "ends_with"] }
          }
        }
      }
    })
  );
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "invalid_wildcard_pattern");
});

test("canonical code: wildcard_operator_not_allowed for non-== wildcard usage", () => {
  const out = compileRequestSafe(input("filter=name!=act*"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "wildcard_operator_not_allowed");
});

test("canonical code: wildcard_type_not_supported for non-string fields", () => {
  const out = compileRequestSafe(input("filter=id==1*"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "wildcard_type_not_supported");
});

test("canonical code: security_predicate_required when context is missing predicate", () => {
  const out = compileRequestSafe(
    input("filter=status==active", {
      context: { security_predicate: null }
    })
  );
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "security_predicate_required");
});
