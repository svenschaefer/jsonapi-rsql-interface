const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequest, compileRequestSafe } = require("../../src");

function baseInput(rawQuery, extraPolicy = {}) {
  return {
    raw_query: rawQuery,
    policy: {
      version: "v1",
      fields: {
        id: { type: "int", filterable: true, operators: ["==", "!=", "=in=", "=out="] },
        score: { type: "float", filterable: true, operators: ["==", ">=", "<="] },
        enabled: { type: "bool", filterable: true, operators: ["==", "!="] },
        created: { type: "date", filterable: true, operators: ["==", ">=", "<="] },
        seen_at: { type: "datetime", filterable: true, operators: ["==", ">=", "<="] },
        uid: { type: "uuid", filterable: true, operators: ["==", "!="] },
        name: { type: "string", filterable: true, operators: ["==", "!="] },
        status: {
          type: "enum",
          filterable: true,
          operators: ["==", "!=", "=in=", "=out="],
          enum_values: ["active", "disabled"]
        }
      },
      query_dimensions: {
        include_allowlist: ["groups"],
        sortable_fields: ["created", "status"],
        fields_allowlist: {
          users: ["id", "status", "created"]
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
      },
      ...extraPolicy
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

test("strict int parsing rejects scientific notation", () => {
  const result = compileRequestSafe(baseInput("filter=id==1e3"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "value_type_mismatch");
});

test("strict float parsing rejects scientific notation", () => {
  const result = compileRequestSafe(baseInput("filter=score==1e-3"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "value_type_mismatch");
});

test("bool parsing accepts lowercase true/false only", () => {
  const ok = compileRequestSafe(baseInput("filter=enabled==true"));
  const bad = compileRequestSafe(baseInput("filter=enabled==TRUE"));
  assert.equal(ok.ok, true);
  assert.equal(bad.ok, false);
  assert.equal(bad.errors[0].code, "value_type_mismatch");
});

test("date parsing rejects non-ISO formats", () => {
  const result = compileRequestSafe(baseInput("filter=created==02/19/2026"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "value_type_mismatch");
});

test("datetime parsing normalizes timezone offsets to UTC", () => {
  const out = compileRequest(baseInput("filter=seen_at==2026-02-19T10:00:00%2B02:00"));
  const clause = out.filter.clauses[0];
  assert.equal(clause.values[0], "2026-02-19T08:00:00.000Z");
  assert.equal(clause.normalized_from_timezone, true);
});

test("enum matching is case-sensitive", () => {
  const result = compileRequestSafe(baseInput("filter=status==Active"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "value_type_mismatch");
});

test("null literal is allowed only with == or !=", () => {
  const ok = compileRequestSafe(baseInput("filter=status==null"));
  const bad = compileRequestSafe(baseInput("filter=created>=null"));
  assert.equal(ok.ok, true);
  assert.equal(bad.ok, false);
  assert.equal(bad.errors[0].code, "value_type_mismatch");
});

test("include allowlist is enforced", () => {
  const result = compileRequestSafe(baseInput("filter=status==active&include=memberships"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "include_not_allowed");
});

test("sort allowlist is enforced", () => {
  const result = compileRequestSafe(baseInput("filter=status==active&sort=-uid"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "sort_not_allowed");
});

test("sparse field allowlist is enforced", () => {
  const result = compileRequestSafe(baseInput("filter=status==active&fields[users]=id,secret"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "fields_not_allowed");
});

test("wildcard semantics are rejected", () => {
  const result = compileRequestSafe(baseInput("filter=status==act*"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "invalid_filter_syntax");
});

test("wildcard semantics are rejected for membership operators", () => {
  const result = compileRequestSafe(baseInput("filter=status=in=(active,act*)"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "invalid_filter_syntax");
});

test("dot in string literal value is allowed", () => {
  const result = compileRequestSafe(baseInput("filter=name==foo.bar"));
  assert.equal(result.ok, true);
});
