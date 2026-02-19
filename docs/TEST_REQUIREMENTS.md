# Test Requirements

This document defines explicit test requirements for `jsonapi-rsql-interface`.

## 1) Leakage Guardrails

Unit tests MUST verify that error objects never leak internal execution or environment details.
This applies across all rejection paths (parse/type/policy/limit failures).

### 1.1 No SQL leakage

Serialized errors MUST NOT contain recognizable SQL statement patterns, including at least:

- `SELECT ... FROM`
- `INSERT INTO ...`
- `UPDATE ... SET`
- `DELETE FROM ...`
- `JOIN ...`
- `WHERE ...`

Use pattern-based detection (not single keywords) to avoid false positives.

### 1.2 No stack traces or exception internals

Serialized errors MUST NOT contain stacktrace-like frames, including:

- newline + `at <function> (<file>:<line>:<col>)`
- `Error:` followed by stack frames
- references to `node_modules` inside stack frames

### 1.3 No filesystem path leakage

Serialized errors MUST NOT contain environment path details, including:

- Windows paths (`C:\...`, `C:/...`)
- Linux paths (`/home/...`, `/usr/...`, `/var/...`)
- macOS paths (`/Users/...`)
- `node_modules` path segments

### 1.4 No schema/identifier leakage

Serialized errors MUST NOT reveal internal schema identifiers:

- table names
- column names
- SQL aliases
- raw SQL fragments (including quoted identifiers like `"table"."column"`)

Only API-level field names (if any) plus stable error codes may be surfaced.

### 1.5 No raw literal echo by default

With diagnostics disabled (default), errors MUST NOT echo raw user literals verbatim in `title`, `detail`, or `meta`.

If diagnostics mode exists, it MUST be explicitly opt-in and covered by separate tests.

### 1.6 Deterministic safe error shape

Each error response MUST remain JSON:API-compatible with approved stable fields:

- `code`
- `status` (string in output)
- `title`
- `source.parameter` (for query errors)

Optional fields (`detail`, `meta`) MUST still satisfy leakage rules.

### 1.7 Failure-class coverage

Leakage assertions MUST run for at least one case in each class:

- invalid query string/decoding
- invalid filter syntax
- unknown field
- field/operator denied
- type mismatch
- complexity limit exceeded
- include/fields/sort denial
- missing mandatory security predicate

## 2) Additional Explicit Unit Test Requirements

### 2.1 Canonicalization and duplicate handling

Tests MUST lock behavior for:

- percent-decoding and `+` handling
- duplicate parameters (`filter`, `sort`, `page[size]`, `fields[type]`, `include`)
- deterministic duplicate rule (baseline: reject duplicates)

### 2.2 Deterministic error-code mapping

Tests MUST lock one canonical error code per finalized scenario and assert:

- code stability policy
- `status` serialized as string in output

### 2.3 Security predicate injection invariants

Tests MUST assert:

- compilation fails when mandatory tenant/org scope is missing
- user input cannot override/negate mandatory predicates
- compiled plans always AND mandatory predicates with user filters
- predicate mechanism is not user-addressable unless explicitly allowed

### 2.4 Deny-by-default allowlist enforcement

Tests MUST assert:

- unknown fields are rejected
- known-but-disallowed fields are rejected
- deny-by-default applies to `filter`, `sort`, `fields`, `include`
- disallowed items are not silently ignored (unless explicit mode exists and is tested)

### 2.5 Strict and stable type parsing

Tests MUST lock:

- `int` 64-bit bounds + base-10 only
- `float` strict decimal (no scientific notation in v1)
- `bool` strict `true|false`
- `date` strict `YYYY-MM-DD`
- `datetime` explicit offset + stable UTC normalization
- `uuid` strict format
- `enum` case-sensitive

### 2.6 Pre-execution complexity/size boundaries

Boundary tests (`limit-1` pass, `limit+1` fail) MUST exist for:

- query length
- literal length
- AST depth
- AST node count
- `=in=` list size
- sort key count
- include count/path length
- sparse field count

### 2.7 Plan determinism and non-ambiguity

Tests MUST assert:

- semantically identical inputs produce identical normalized plans (or plan hashes)
- ordering is normalized where applicable
- no nondeterministic data in plan output (timestamps/random IDs)

### 2.8 Diagnostics mode separation

If diagnostics mode exists:

- default mode remains safe
- diagnostics mode is explicit and separately tested
- diagnostics mode still forbids SQL/schema/stack/path leakage
