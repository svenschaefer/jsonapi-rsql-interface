# jsonapi-rsql-interface-pg

`jsonapi-rsql-interface-pg` is a deterministic PostgreSQL execution adapter for plans produced by `jsonapi-rsql-interface`.

Core scope:
- compile-only adapter surfaces:
  - `compileWhere(plan, mapping)`
  - `compileOrderBy(plan, mapping)`
  - `compileLimitOffset(plan, mapping)`
  - `compileSecurityPredicate(plan, mapping, securityContext)`
  - `compileSelect(plan, mapping)` (root-table projection only in `v1.2.x`)
- optional convenience helper:
  - `assembleSelectSql(...)` (assembly-only, no new semantics)

Utilities:
- `prepareMapping(mapping)`
- `ensurePreparedMapping(mapping)`
- `getTableSql(mapping)`
- `ADAPTER_DIALECT_PROFILE` (`postgresql-v1-core`)

Non-goals in `v1.2.x`:
- no policy expansion
- no implicit feature fallbacks
- no SQL execution
- no include/join SQL planning

## Mapping contract (baseline)

```js
{
  dialect_profile: "postgresql-v1-core",
  version: "map.v1",
  hash: "sha256:...",
  resource: {
    table: "users",   // ASCII identifier tokens only
    type: "users"
  },
  fields: {
    id: { kind: "column", column: "id" },
    status: { kind: "column", column: "status" },
    name_lc: {
      kind: "expression",
      trusted: true,
      sql: "lower(name)",
      expression_id: "name_lower"
    }
  },
  default_select: ["id", "status"],
  limits: {
    max_predicates: 200,
    max_selected_columns: 100,
    max_order_by_keys: 25,
    max_fragment_count: 8,
    max_fragment_text_length: 100000,
    max_fragment_values: 10000,
    max_sql_text_length: 250000,
    max_bound_values: 50000
  }
}
```

Notes:
- dialect profile is pinned by adapter version. Any unsupported profile is rejected with `pg_feature_not_supported`.
- expression mappings require explicit `trusted: true`.
- operator-to-SQL mapping is closed in adapter code.
- mapping cannot provide SQL operator templates.

## Security predicate input

`compileSecurityPredicate(plan, mapping, securityContext)` requires a runtime security context value for `plan.security.predicate.bound_parameter_key`.

Accepted lookup forms:
- `securityContext[bindingKey]`
- `securityContext.values[bindingKey]`

Missing value fails deterministically with `pg_security_predicate_required`.

## Assembly helper contract

`assembleSelectSql(...)` accepts only structured fragments:

```js
{
  table: "\"users\"",
  select: { text: "\"id\" AS \"id\"", values: [] },
  where: { text: "(\"status\" = $1)", values: ["active"] },
  security: { text: "(\"tenant_id\" = $1)", values: ["tenant-a"] },
  orderBy: { text: "ORDER BY \"id\" DESC", values: [] },
  limitOffset: { text: "LIMIT $1 OFFSET $2", values: [25, 0] }
}
```

Behavior:
- `table` must be the exact value from `getTableSql(mapping)` (mapping-derived only)
- strict fragment-shape validation
- deterministic placeholder renumbering to contiguous `$1..$n`
- deterministic left-to-right value ordering
- no semantic inference, defaults, or SQL execution

## Error model

Stable adapter error code namespace:
- `pg_invalid_plan_shape`
- `pg_invalid_mapping_shape`
- `pg_mapping_missing`
- `pg_operator_not_supported`
- `pg_feature_not_supported`
- `pg_security_predicate_required`
- `pg_fragment_invalid`
- `pg_limits_exceeded`

Authoritative constraints:
- `docs/ADAPTER_PG_SECURITY_PERFORMANCE_CONSTRAINTS.md` (repo root)

