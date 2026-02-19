const test = require("node:test");
const assert = require("node:assert/strict");

const { compileRequest } = require("../../src");
const pgAdapter = require("../../packages/adapter-pg/src");

function makePlan() {
  return compileRequest({
    raw_query: "filter=(status==active;id=in=(1,2,3))&sort=-id,status&page[size]=25&page[number]=2&fields[users]=id,status",
    policy: {
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
        include_allowlist: [],
        sortable_fields: ["id", "status"],
        fields_allowlist: {
          users: ["id", "status"]
        }
      },
      limits: {
        max_raw_query_length: 4096,
        max_decoded_query_length: 4096,
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

function mapping() {
  return {
    version: "map.v1",
    hash: "sha256:golden",
    resource: {
      table: "users",
      type: "users"
    },
    fields: {
      id: { kind: "column", column: "id" },
      status: { kind: "column", column: "status" },
      tenant_id: { kind: "column", column: "tenant_id" }
    },
    default_select: ["id", "status"]
  };
}

test("golden SQL assembly is deterministic and placeholder-stable", () => {
  const plan = makePlan();
  const map = mapping();

  const select = pgAdapter.compileSelect(plan, map);
  const where = pgAdapter.compileWhere(plan, map);
  const security = pgAdapter.compileSecurityPredicate(plan, map, {
    tenant_scope: "tenant-a"
  });
  const orderBy = pgAdapter.compileOrderBy(plan, map);
  const limitOffset = pgAdapter.compileLimitOffset(plan, map);

  const sql = pgAdapter.assembleSelectSql(
    {
      table: pgAdapter.getTableSql(map),
      select,
      where,
      security,
      orderBy,
      limitOffset
    },
    map
  );

  assert.equal(
    sql.text,
    "SELECT \"id\" AS \"id\", \"status\" AS \"status\" FROM \"users\" WHERE ((\"status\" = $1) AND (\"id\" IN ($2, $3, $4))) AND ((\"tenant_id\" = $5)) ORDER BY \"id\" DESC, \"status\" ASC LIMIT $6 OFFSET $7"
  );
  assert.deepEqual(sql.values, ["active", "1", "2", "3", "tenant-a", 25, 25]);
});

test("adapter errors stay code-based and avoid SQL leakage in detail", () => {
  const map = mapping();
  assert.throws(
    () =>
      pgAdapter.assembleSelectSql(
        {
          table: pgAdapter.getTableSql(map),
          select: {
            text: "\"id\"",
            values: []
          },
          where: {
            text: "status = $1",
            values: []
          }
        },
        map
      ),
    (error) => {
      assert.equal(error.code, "pg_fragment_invalid");
      assert.ok(!String(error.detail || "").includes("SELECT"));
      assert.ok(!String(error.detail || "").includes("FROM"));
      return true;
    }
  );
});
