# Performance Invariants

This document defines enforceable performance guardrails for `jsonapi-rsql-interface`.

These are boundary-component constraints intended to prevent CPU/memory amplification, cache inefficiency, and downstream execution instability under real traffic and adversarial inputs.

## Definitions

- **Canonicalization**: Normalizing raw query input into one deterministic representation before parse/validation/compile.
- **Compilation pipeline**: parse -> normalize -> type-check -> policy-check -> compile.
- **Plan**: Structured compiler output consumed by an execution layer.

## Invariant 1 - Bounded Canonicalization Cost

- Enforce a hard maximum on raw query string length before any decoding.
- Enforce a hard maximum on decoded/canonicalized length after decoding.
- Reject over-limit inputs deterministically before expensive parsing.
- Canonicalization must not perform repeated re-decoding of the same segments.

## Invariant 2 - Bounded Parameter Surface

- Enforce hard limits on:
  - total query parameter count
  - total key/value pair count after parsing
  - per-parameter value length
- Duplicate parameters (`filter`, `sort`, `fields[...]`, `include`, `page[...]`) must follow one deterministic global rule.
- Recommended baseline: reject duplicates deterministically.

## Invariant 3 - Complexity Limits Across Pipeline

- Enforce hard limits before compilation/execution for:
  - filter AST depth
  - filter AST node count
  - filter literal length
  - `=in=` / `=out=` list size
  - sort key count
  - sparse field count
  - include path count and path length
- Reject limit violations fail-fast and deterministically.

## Invariant 4 - Deterministic Canonical Ordering for Cache Efficiency

Canonicalization used for cache keying must produce stable ordering for:

- query parameter keys
- repeated parameter values (if repeated values are supported)
- `sort` keys
- `fields[type]` lists
- `include` paths

Semantically equivalent requests must map to the same canonical cache key.

## Invariant 5 - Linear-Time Validation

- Validation and policy checks must avoid quadratic scans on large expressions.
- Field/operator/include checks should be O(1) map/set lookups from precompiled policy structures.
- Walk the AST once per phase; avoid repeated full-tree rescans where possible.

## Invariant 6 - Hot-Path Allocation Control

- Keep intermediate structures bounded and compact.
- Avoid unnecessary object churn in tokenization/normalization/plan build.
- Treat large literals and large lists as rejection conditions, not objects to retain.

## Invariant 7 - Plan Size and Serialization Boundaries

- Compiled plans must remain compact and bounded.
- Plans must not embed large user literals.
- If plans are cached or logged, prefer hashed references/IDs over full expanded serialization when feasible.

## Invariant 8 - Database Plan Stability (Execution-Layer Impact)

- Choose one consistent parameterization strategy for membership filters (`=in=`):
  - array binding, or
  - expanded placeholders
- Do not mix strategies opportunistically per request.
- If placeholder expansion is used, cap list size aggressively.
- If array binding is used, ensure operator/index compatibility for stable DB planning.

## Invariant 9 - Include and Query-Shape Amplification Controls

- `include` limits (count/path/depth) are performance controls, not only authorization controls.
- Allowing sort/filter on unindexed or high-cost fields must be policy-restricted.
- "Allowed" should imply "operationally safe under expected load."

## Invariant 10 - Cache and Replay Efficiency Safety

- Plan/response caches must key on canonical query form plus security/policy context.
- Cache key fragmentation from non-canonical ordering is a performance defect.
- In-process cache reuse must still enforce policy-version compatibility.

## Invariant 11 - Budget-Based Backpressure

- In addition to structural hard limits, define a per-request compilation CPU/time budget at the service layer.
- Abort or degrade deterministically when compilation exceeds budget.
- Budget breaches should emit structured non-sensitive telemetry for tuning.

## Minimum Performance Gate

A release is performance-conformant only if:

- hard limits are implemented and covered by automated boundary tests
- canonicalization/keying determinism tests exist for equivalent query permutations
- no known O(n^2) validation paths remain on bounded but large allowed inputs
- compilation budget telemetry is emitted for rejected/aborted budget cases

## Operational Performance Addendum

### 1) Bounded policy compile/reload cost

- Treat policy compilation as bounded work with explicit size and time budgets.
- Cap policy artifact dimensions (fields, includes, operators, limits) and reject oversize artifacts fail-closed.
- Precompute immutable lookup structures once per accepted policy version.
- Record policy checksum + version and skip rebuild/reload when artifacts are identical.
- Reject reloads that exceed configured compile time/size budgets.

### 2) Hot-path branch predictability

- Keep the valid-request path minimal:
  - fast allowlist lookups
  - minimal allocations
  - minimal dynamic/polymorphic dispatch in tight loops
- Move rare/verbose behaviors to failure or explicit diagnostic paths.
- Diagnostic enrichment and deep explanations must not execute on successful hot-path requests.

### 3) String slicing/copy control

- Tokenize/filter parse using index ranges over the canonical string where feasible.
- Avoid per-token substring allocations during normal parsing.
- Materialize strings only when needed for stable lookup keys or output artifacts.
- Prefer normalized/interned token sets for operators and reserved literals where beneficial.

### 4) Metrics pipeline safety under adversarial load

- Prohibit high-cardinality metric labels from this component.
- Do not emit raw literals, tenant identifiers, request IDs, or unbounded user-derived labels.
- Emit counters by stable error code and small bounded category sets.
- Apply rate limiting/aggregation to repeated failure emissions when needed to protect telemetry backends.

### 5) Cache contention and churn control

- Use immutable policy snapshots with atomic swap on reload (copy-on-write style).
- Avoid global lock bottlenecks for plan cache access; prefer sharded or lock-light read paths.
- Keep plan cache entries compact and TTL-bounded.
- Monitor eviction churn and tune capacity/TTL to avoid thrash under bursty workloads.
