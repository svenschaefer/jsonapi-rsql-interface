# jsonapi-rsql-interface

`jsonapi-rsql-interface` is an infrastructure component that defines a **clear, deterministic interface between JSON:API-style HTTP requests and relational query execution**, using **RSQL/FIQL** for filtering semantics.

It is designed for **enterprise SaaS backends** that need a **named, reusable, and governable standard** for querying resources (e.g. users, groups, memberships) without adopting the full complexity of OData or embedding ad-hoc query logic in every service.

The package is intentionally **not an ORM** and **not a database client**.

## API Classification

`jsonapi-rsql-interface` is published as an npm package and exposes a JavaScript API.

Its interface should be understood as a **compiler/policy boundary API**, not as:

- a consumer-facing application API
- a service SDK
- a data-access API

It is specifically a:

- deterministic compilation API
- policy enforcement API
- backend boundary/kernel API

The JavaScript API exists to:

- accept structured inputs (query + policy + context)
- enforce invariants deterministically
- emit a governed query plan or deterministic error results

---

## Problem Statement

In REST-based enterprise APIs, teams repeatedly face the same issues:

- JSON:API intentionally does **not** standardize filter semantics
- OData provides standardized filtering, but is **too powerful and costly to implement fully**
- Ad-hoc query parameters lead to:
  - inconsistent semantics across services
  - duplicated parsing and validation logic
  - security and governance risks

`jsonapi-rsql-interface` solves this by combining:
- **JSON:API** for representation, pagination, sorting, includes
- **RSQL/FIQL** for a well-defined, compact filter expression language

This yields a solution that is:
- explicitly nameable (“JSON:API + RSQL/FIQL”)
- realistically implementable
- reusable across services
- compatible with enterprise governance and auditing

---

## Scope and Responsibilities

### What this package does

- Parses JSON:API query parameters (`filter`, `sort`, `page`, `fields`, `include`)
- Parses RSQL/FIQL filter expressions into a deterministic AST
- Applies **explicit policies**:
  - field allowlists and mappings
  - operator allowlists
  - complexity and depth limits
- Compiles requests into a **query plan**
- Produces **parameterized query instructions** suitable for SQL builders

### What this package does NOT do

- Does not execute SQL
- Does not manage database connections
- Does not act as an ORM
- Does not expose domain-specific semantics
- Does not attempt full OData compatibility

---

## Conceptual Architecture

```

HTTP Request
|
|  JSON:API Query Params
|  + RSQL/FIQL filter
v
jsonapi-rsql-interface
|
|  validated + governed
|  query plan
v
Service DB Layer
(Query Builder / pg / etc.)

```

The package acts as a **strict boundary** between REST semantics and database execution.

---

## Filtering Model

Filtering is expressed using **RSQL/FIQL** via the `filter` query parameter.

Example:

```

GET /users?
filter=(status==active;created>=2026-01-01),role=in=(admin,owner)&
sort=-created&
page[size]=50

```

Characteristics:

- Boolean logic: AND (`;`), OR (`,`), parentheses
- Comparison operators: `==`, `!=`, `>`, `>=`, `<`, `<=`
- Set membership: `=in=`, `=out=`
- No implicit functions or query DSL extensions
- All semantics are explicitly governed by configuration

---

## Resource Definitions

Each resource is described declaratively via a **resource definition**, which is the only place where domain knowledge is applied.

Typical attributes:

- table or view name
- ID column
- field registry (API field → DB column, type)
- allowed operators per field
- sortable / selectable flags
- default sort
- hard limits (page size, filter complexity)

This allows the same engine to be reused for any resource without duplication.

---

## Output: Query Plan

Instead of generating raw SQL strings, the package produces a **query plan**:

- normalized filters
- validated sort instructions
- pagination limits
- parameter bindings
- deterministic error codes

This plan can then be applied to:
- Knex
- Kysely
- node-postgres
- any other SQL execution layer

---

## Error Semantics

All validation and policy violations are surfaced as **deterministic error codes**, suitable for direct mapping to JSON:API error objects.

Examples:
- `invalid_filter_syntax`
- `unknown_field`
- `operator_not_allowed`
- `value_type_mismatch`
- `filter_complexity_exceeded`

---

## Intended Usage

`jsonapi-rsql-interface` is intended to be:

- implemented once
- reused across all backend services
- versioned and governed as infrastructure
- referenced explicitly in API documentation

Example positioning:

> “This API uses JSON:API for representation and pagination.  
> Filtering is implemented using RSQL/FIQL via `jsonapi-rsql-interface`.”

---

## Non-Goals

To keep the system predictable and maintainable, the following are explicit non-goals:

- dynamic schema introspection
- arbitrary relationship traversal in filters
- implicit joins
- free-form function expressions
- automatic query optimization

---

## Status

This package is designed as a **core infrastructure component**.
Stability, determinism, and explicitness are prioritized over feature breadth.

---

## Operations and Release

Repository workflow and release baseline documents:

- `docs/NPM_RELEASE.md`
- `docs/REPO_WORKFLOWS.md`
- `docs/OPERATIONAL.md`
- `docs/DEV_TOOLING.md`
- `docs/RELEASE_NOTES_TEMPLATE.md`
- `docs/BASELINE_TEST_RUN.md`
- `docs/GUARANTEES.md`
- `docs/STATUSQUO.md`
- `docs/SECURITY_INVARIANTS.md`
- `docs/PERFORMANCE_INVARIANTS.md`
- `docs/CONFORMANCE_TEST_CHECKLIST.md`
- `docs/TEST_REQUIREMENTS.md`
- `docs/ERROR_CATALOG.md`
- `docs/COMPATIBILITY_POLICY.md`
- `docs/RELEASE_EVIDENCE.md`
- `docs/DEPENDENCY_RISK_REGISTER.md`
- `CODEX_CONTEXT.md`
- `TODO.md`
- `ROADMAP.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CHANGELOG.md`

---

## V1 Normative Spec

The following rules define the v1 contract and are intended to be stable.

### 1) Filter Field Scope

- `filter` expressions MUST target only root resource fields in v1.
- Relationship-path filtering (for example `group.name==...`) MUST be rejected in v1.
- If relationship filtering is added in the future, it SHOULD be explicit and opt-in via a relationship registry with named join definitions.

### 2) Field Type System

Supported field types in v1:

- `string`
- `int`
- `float`
- `bool`
- `date` (ISO 8601 `YYYY-MM-DD`)
- `datetime` (ISO 8601 with explicit offset: `Z` or `+/-HH:MM`)
- `uuid`
- `enum` (explicit allowed values list)

Constraints:

- `json` fields and JSON-specific operators are out of scope for v1.
- Values MUST be parsed and validated deterministically against the declared field type.

### 3) Null Semantics

- `null` MUST be treated as a reserved literal, not a string.
- The only supported null comparisons are:
  - `==null` -> `IS NULL`
  - `!=null` -> `IS NOT NULL`
- Any other null representation MUST be rejected.

### 4) Pattern Matching and Wildcards

- Wildcard semantics in `==` (for example interpreting `*` implicitly) MUST NOT be supported in v1.
- Pattern matching operators (such as `=like=`) are out of scope for v1 unless explicitly standardized with escaping and case-sensitivity rules.

### 5) Include Behavior

- `include` MUST be validated against an allowlist.
- In v1, `include` is validation/pass-through only and MUST NOT be compiled into SQL join instructions by this package.
- If include compilation is added later, it SHOULD be implemented as a separate explicit include-planning stage backed by a relationship registry.

### 6) Stable Error Object Schema

Validation and policy failures MUST map to stable machine-readable errors suitable for JSON:API error objects.

Required fields:

- `code` (stable identifier)
- `status` (HTTP status)
- `title` (short summary)
- `source.parameter` for query parameter errors

Optional fields:

- `detail`
- `source.pointer` (for body-related validation contexts)
- `meta` (for structured diagnostics, such as `field`, `operator`, `expected_type`, `limit`)

Example:

```json
{
  "errors": [
    {
      "code": "value_type_mismatch",
      "status": "400",
      "title": "Invalid filter value",
      "detail": "Expected type 'date' for field 'created'.",
      "source": { "parameter": "filter" },
      "meta": {
        "field": "created",
        "expected_type": "date"
      }
    }
  ]
}
```

### 7) V1 Defaults (Implementation Locks)

To avoid ambiguity in independent implementations, the following defaults are fixed for v1:

- `int` bounds:
  - MUST use signed 64-bit semantics (PostgreSQL `BIGINT` range).
  - MUST parse as base-10 integer strings.
  - Values outside the signed 64-bit range MUST be rejected.
- `float` syntax:
  - Scientific notation (for example `1e-3`) MUST NOT be accepted in v1.
  - Accepted syntax MUST match strict decimal form: `-?(\\d+)(\\.\\d+)?`.
- `datetime` normalization:
  - Datetime values MUST be normalized to UTC internally for query compilation.
  - Original literals MAY be preserved for diagnostics (`detail`/`meta`) only.
  - Query plan semantics MUST use the normalized UTC instant.
  - Implementations SHOULD expose whether normalization occurred (for example, a normalization flag in plan metadata).
- `enum` matching:
  - Enum comparison MUST be case-sensitive in v1.
- Empty set membership:
  - `=in=()` and `=out=()` MUST be rejected.
  - Implementations SHOULD emit a deterministic error code such as `empty_in_list_not_allowed`.
- Error status typing:
  - Internally, status SHOULD be numeric for mapping/comparison.
  - JSON:API output MUST serialize `status` as a string.

---

## License

MIT
