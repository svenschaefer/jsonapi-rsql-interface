const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequest } = require("../../src");
const pgAdapter = require("../../packages/adapter-pg/src");

function makePlan(rawQuery) {
  return compileRequest({
    raw_query: rawQuery,
    policy: {
      version: "v1",
      fields: {
        id: { type: "int", filterable: true, operators: ["==", "=in="] },
        status: {
          type: "enum",
          filterable: true,
          operators: ["==", "!="],
          enum_values: ["active", "disabled"]
        },
        name: {
          type: "string",
          filterable: true,
          operators: ["==", "!="],
          wildcard: {
            enabled: true,
            modes: ["contains", "starts_with", "ends_with"],
            case_sensitive: true
          }
        }
      },
      query_dimensions: {
        include_allowlist: [],
        sortable_fields: ["id", "status"],
        fields_allowlist: {
          users: ["id", "status", "name"]
        }
      },
      limits: {
        max_raw_query_length: 2048,
        max_decoded_query_length: 2048,
        max_param_count: 32,
        max_key_value_pairs: 64,
        max_parameter_value_length: 512,
        max_filter_literal_length: 512,
        max_include_paths: 4,
        max_include_path_length: 64,
        max_sort_keys: 8,
        max_sparse_fields: 12,
        max_ast_depth: 8,
        max_ast_nodes: 64,
        max_in_list_items: 25
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
  });
}

function baseMapping() {
  return {
    version: "map.v1",
    hash: "sha256:demo",
    resource: {
      table: "users",
      type: "users"
    },
    fields: {
      id: { kind: "column", column: "id" },
      status: { kind: "column", column: "status" },
      name: { kind: "column", column: "name" },
      tenant_id: { kind: "column", column: "tenant_id" }
    },
    default_select: ["id", "status"],
    limits: {
      max_predicates: 50,
      max_selected_columns: 20,
      max_order_by_keys: 8,
      max_fragment_count: 8,
      max_fragment_text_length: 50000,
      max_fragment_values: 5000,
      max_sql_text_length: 100000,
      max_bound_values: 10000
    }
  };
}

test("@jsonapi-rsql/pg exports compile and assemble surfaces", () => {
  assert.equal(typeof pgAdapter.compileWhere, "function");
  assert.equal(typeof pgAdapter.compileOrderBy, "function");
  assert.equal(typeof pgAdapter.compileLimitOffset, "function");
  assert.equal(typeof pgAdapter.compileSecurityPredicate, "function");
  assert.equal(typeof pgAdapter.compileSelect, "function");
  assert.equal(typeof pgAdapter.assembleSelectSql, "function");
});

test("compileWhere emits parameterized SQL and deterministic values", () => {
  const plan = makePlan("filter=status==active;name==*ann*&sort=-id&page[size]=10&page[number]=2");
  const where = pgAdapter.compileWhere(plan, baseMapping());
  assert.match(where.text, /^\(.+\) AND \(.+\)$/);
  assert.equal(where.values.length, 2);
  assert.ok(!where.text.includes("active"));
  assert.ok(!where.text.includes("ann"));
});

test("compileSecurityPredicate fails closed when missing", () => {
  const plan = makePlan("filter=status==active");
  delete plan.security;
  assert.throws(
    () => pgAdapter.compileSecurityPredicate(plan, baseMapping()),
    (error) => error && error.code === "pg_security_predicate_required"
  );
});

test("compileSelect rejects include-driven projection", () => {
  const plan = makePlan("filter=status==active");
  plan.include = ["groups"];
  assert.throws(
    () => pgAdapter.compileSelect(plan, baseMapping()),
    (error) => error && error.code === "pg_feature_not_supported"
  );
});

test("assembleSelectSql renumbers placeholders left-to-right", () => {
  const plan = makePlan("filter=status==active&sort=-id&page[size]=5&page[number]=3");
  const mapping = baseMapping();
  const select = pgAdapter.compileSelect(plan, mapping);
  const where = pgAdapter.compileWhere(plan, mapping);
  const security = pgAdapter.compileSecurityPredicate(plan, mapping, {
    tenant_scope: "tenant-a"
  });
  const orderBy = pgAdapter.compileOrderBy(plan, mapping);
  const limitOffset = pgAdapter.compileLimitOffset(plan, mapping);
  const sql = pgAdapter.assembleSelectSql({
    table: pgAdapter.getTableSql(mapping),
    select,
    where,
    security,
    orderBy,
    limitOffset
  }, mapping);

  assert.match(sql.text, /SELECT .+ FROM .+ WHERE .+ ORDER BY .+ LIMIT \$3 OFFSET \$4/);
  assert.deepEqual(sql.values, ["active", "tenant-a", 5, 10]);
});

test("assembleSelectSql rejects non-canonical placeholders", () => {
  const mapping = baseMapping();
  assert.throws(
    () =>
      pgAdapter.assembleSelectSql(
        {
          table: pgAdapter.getTableSql(mapping),
          select: { text: "\"id\"", values: [] },
          where: { text: "status = $01", values: ["active"] }
        },
        mapping
      ),
    (error) => error && error.code === "pg_fragment_invalid"
  );
});

test("expression mapping requires explicit trusted flag", () => {
  const mapping = baseMapping();
  mapping.fields.slug = {
    kind: "expression",
    sql: "lower(name)",
    expression_id: "name_lower"
  };
  assert.throws(
    () => pgAdapter.prepareMapping(mapping),
    (error) => error && error.code === "pg_invalid_mapping_shape"
  );
});

test("compileWhere rejects unsupported operators from plan", () => {
  const plan = makePlan("filter=status==active");
  plan.filter.clauses[0].operator = "=foo=";
  assert.throws(
    () => pgAdapter.compileWhere(plan, baseMapping()),
    (error) => error && error.code === "pg_operator_not_supported"
  );
});
