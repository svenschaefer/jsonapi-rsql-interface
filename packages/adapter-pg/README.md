# @jsonapi-rsql/pg

`@jsonapi-rsql/pg` is a deterministic PostgreSQL execution adapter for plans produced by `jsonapi-rsql-interface`.

Scope:
- compile-only adapter surfaces:
  - `compileWhere(plan, mapping)`
  - `compileOrderBy(plan, mapping)`
  - `compileLimitOffset(plan, mapping)`
  - `compileSecurityPredicate(plan, mapping)`
  - `compileSelect(plan, mapping)` (root-table projection only in `v1.2.x`)
- optional convenience helper:
  - `assembleSelectSql(...)` (assembly-only, no new semantics)

Non-goals:
- no policy expansion
- no implicit feature fallbacks
- no SQL execution

Authoritative constraints:
- `docs/ADAPTER_PG_SECURITY_PERFORMANCE_CONSTRAINTS.md` (repo root)
