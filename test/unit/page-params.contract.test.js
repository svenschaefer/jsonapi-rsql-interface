const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequestSafe } = require("../../src");

function input(rawQuery, overrides = {}) {
  return {
    raw_query: rawQuery,
    policy: {
      version: "v1",
      fields: {
        status: {
          type: "enum",
          filterable: true,
          operators: ["=="],
          enum_values: ["active", "disabled"]
        }
      },
      query_dimensions: {
        include_allowlist: [],
        sortable_fields: [],
        fields_allowlist: { users: ["id", "status"] }
      },
      limits: {
        max_page_size: 50,
        max_page_number: 1000
      },
      ...(overrides.policy || {})
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

test("page parameters compile as validated numeric values", () => {
  const out = compileRequestSafe(input("filter=status==active&page[size]=25&page[number]=3"));
  assert.equal(out.ok, true);
  assert.equal(out.plan.page.size, 25);
  assert.equal(out.plan.page.number, 3);
});

test("page[size] above limit fails with page_parameter_invalid", () => {
  const out = compileRequestSafe(input("filter=status==active&page[size]=51"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "page_parameter_invalid");
});

test("page[number] above limit fails with page_parameter_invalid", () => {
  const out = compileRequestSafe(input("filter=status==active&page[number]=1001"));
  assert.equal(out.ok, false);
  assert.equal(out.errors[0].code, "page_parameter_invalid");
});

