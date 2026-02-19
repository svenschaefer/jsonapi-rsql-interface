# Security Invariants

This document defines enforceable, non-negotiable security invariants for `jsonapi-rsql-interface`.

These invariants are implementation constraints. They must be enforced by runtime guardrails in the compiler pipeline, non-bypassable policy interfaces, and conformance tests.

## Definitions

- **User input**: Any value derived from HTTP query parameters (`filter`, `sort`, `fields`, `include`, `page`, raw query string).
- **Registry**: A static, allowlisted mapping that defines which API fields exist and how they map to execution targets (e.g., DB columns).
- **Policy**: A non-bypassable interface that controls what is allowed (fields, operators, includes, sorting, limits).
- **Plan**: The compiler output. A plan is a structured representation of a query that can be applied to an execution layer. A plan must not contain raw SQL text derived from user input.

## Invariant 1 - SQL Injection Resistance

1.1 Identifiers
- No user input is ever concatenated into SQL identifiers (table names, column names, aliases, functions).
- All identifiers used by compilation originate exclusively from static registries.

1.2 Operators
- Operators are an allowlisted enum defined by policy.
- No operator token from user input may be used directly as an execution fragment.

1.3 Values
- All values are passed as bound parameters to the execution layer.
- No user-provided literal may appear in compiled SQL fragments.

1.4 Forbidden behavior
- Generating SQL strings that embed user literals.
- Accepting unknown fields and passing them through as identifiers.
- Accepting raw SQL snippets in any parameter.

## Invariant 2 - DoS Resistance via Filter Complexity Limits

2.1 Hard limits
The compiler must enforce hard limits before compilation/execution:
- maximum overall query string length
- maximum filter literal length
- maximum AST depth
- maximum AST node count
- maximum `=in=` / `=out=` list length
- maximum number of sort keys
- maximum number of sparse field selections
- maximum include path count and path length

2.2 Fail-fast
- Violations must fail deterministically before any expensive compilation or database interaction.

2.3 Forbidden behavior
- Parsing or compiling unbounded expressions.
- Allowing user input to drive unbounded joins or expansions.

## Invariant 3 - Authorization Integrity for filter/sort/fields/include

3.1 Allowlists everywhere
- `filter`, `sort`, `fields`, and `include` are subject to allowlists.
- Default is deny: nothing is selectable/sortable/filterable/includable unless explicitly permitted.

3.2 Sensitive field protection
- Fields not explicitly enabled must be non-addressable through any parameter.
- Hidden/sensitive fields must not be inferable through error messages.

3.3 Role/capability awareness
- Policy evaluation may be per-resource and per-capability/role.
- Syntax validation alone is never sufficient.

3.4 Forbidden behavior
- Allowing selection/sorting/filtering on any field not explicitly permitted.
- Allowing `include` paths not explicitly permitted.
- Silent ignoring of disallowed fields (must error deterministically, unless an explicit "ignore" mode is a deliberate policy decision).

## Invariant 4 - Canonical Parsing and Strict Typing

4.1 Single pipeline
- There must be exactly one canonical compiler pipeline: parse -> normalize -> type-check -> policy-check -> compile.
- No alternate or shortcut execution path may bypass validation or policy checks.

4.2 Strict parsing
- Values must be parsed strictly according to the declared field type.
- Ambiguous representations must be rejected (not coerced).

4.3 Deterministic normalization
- Normalizations must be deterministic and explicitly defined (e.g., datetime normalized to UTC internally).
- Normalization must not change meaning silently.

4.4 Forbidden behavior
- Accepting multiple syntaxes for the same semantic value without explicit policy.
- Parsing values differently in validation vs compilation.

## Invariant 5 - Error Hygiene (No Information Leakage)

5.1 Stable error surface
- Errors must expose stable codes and safe, minimal details.
- Errors must not include table names, column names, SQL, join plans, stack traces, or internal file paths.

5.2 Controlled diagnostics
- Raw user literals may appear only in controlled diagnostics metadata when explicitly enabled by configuration.
- Default is to avoid echoing raw values.

5.3 Forbidden behavior
- Returning DB error messages directly.
- Returning SQL fragments or schema identifiers in errors.

## Invariant 6 - Multi-tenant Isolation via Mandatory Security Predicates

6.1 Server-injected predicates
- Tenant/org scoping predicates are injected server-side and are mandatory.
- User filters cannot remove, override, weaken, or negate these predicates.

6.2 Non-addressability
- User filters must not be able to reference the security predicate mechanism as a field/operator.

6.3 Forbidden behavior
- Optional tenant scoping.
- Treating tenant/org constraints as user-provided filter criteria.

## Invariant 7 - Policy Stability and Security-Relevant Change Control

7.1 Versioned policy artifacts
- Resource definitions and policy configurations are versioned artifacts.
- Changes to allowed fields/operators/includes/sort/limits are explicit and reviewable.

7.2 Relaxations are security-relevant
- Any relaxation (new field exposed, new operator enabled, higher limits) is security-relevant and must be intentionally introduced.

7.3 Conformance lock-in
- Forbidden behaviors are protected by conformance tests to prevent regressions.

## Required Deterministic Error Codes (Baseline)

The implementation must provide stable error codes for at least:
- `invalid_query_string`
- `invalid_filter_syntax`
- `filter_complexity_exceeded`
- `unknown_field`
- `field_not_allowed`
- `operator_not_allowed`
- `value_type_mismatch`
- `empty_in_list_not_allowed`
- `sort_not_allowed`
- `include_not_allowed`
- `fields_not_allowed`
- `page_parameter_invalid`
- `security_predicate_required`

## Non-goals (Explicit)

- No full OData compatibility.
- No relationship-path filtering in v1 unless explicitly introduced by policy and conformance tests.
- No implicit join creation driven solely by user input.

## Additional Security Considerations

These concerns are also security-relevant for an enterprise boundary component and should be captured as explicit controls in implementation and tests.

### Canonicalization and parsing boundaries

- Canonicalization differentials across layers:
  - Canonicalize the raw query string exactly once before parsing.
  - Parse only from canonicalized input.
  - Ensure consistent handling for percent-decoding, `+` vs space semantics, and repeated parameters.
- Duplicate parameter ambiguity:
  - For repeated parameters (`filter`, `sort`, `page[size]`, etc.), enforce one deterministic rule globally.
  - Recommended baseline: reject duplicates deterministically.
- Regex/parser backtracking risk:
  - Parser/tokenizer behavior must be resistant to catastrophic backtracking on crafted inputs.
- Canonical parsing surface:
  - Preserve a single canonical pipeline and avoid alternate parse paths that could interpret bytes differently.

### Identifiers and SQL generation hygiene

- Identifier quoting and reserved words:
  - Route all generated identifiers through one quoting/escaping routine.
  - Do not rely on caller behavior for quoting safety.
  - Protect against registry misconfiguration (reserved words, case-folding surprises).
- Query fragments:
  - Continue to enforce static registries for identifiers and enum-only operators.
  - Keep all runtime values bound as parameters.

### Datetime, date, and numeric edge safety

- Timezone/calendar traps:
  - `datetime` must require explicit offset and normalize to UTC internally.
  - `date` must remain a pure calendar date and must not be converted as local midnight with timezone shifts.
- Numeric edge cases:
  - Reject `NaN`, `Infinity`, overflow, and excessive precision for `float`.
  - For `int`, reject whitespace-padded or non-canonical forms.

### Authorization, workload, and amplification controls

- Pagination abuse:
  - Enforce hard max page size and bounded offset/window limits.
- Query-shape performance abuse:
  - Restrict expensive sort/filter shapes (e.g., unindexed fields) through policy.
- Include-driven amplification:
  - Treat include allowlists and include count/path limits as both authorization and DoS controls.
  - Even in pass-through mode, prevent include inputs that can trigger unbounded downstream expansion.

### Multi-layer operational security

- Unicode confusables:
  - Normalize and validate field/operator tokens with an ASCII-safe policy to prevent lookalike bypasses.
- Cache key safety:
  - If caching plans/responses, key only on canonicalized query representations to avoid poisoning/collision differentials.
- Audit/log hygiene:
  - Log stable codes and structured metadata; redact or avoid sensitive raw values by default.
- Supply-chain hygiene:
  - Pin dependencies, run vulnerability scanning, and gate releases on security checks.

### Misconfiguration as a first-class security risk

- Policy misconfiguration controls:
  - Treat resource/policy configuration errors as security failures.
  - Add startup validation for insecure exposures (e.g., sensitive field patterns like `password_hash` marked selectable/filterable).
  - Fail startup when mandatory security predicates are not configured.
- Misconfiguration conformance:
  - Add tests where policy artifacts are intentionally misconfigured and assert secure failure behavior.

### Operational hardening invariants (first-class)

- Side-channel leakage controls:
  - Normalize rejection behavior with consistent status classes and bounded comparable work for common invalid cases.
  - Avoid code paths that do materially more work only when hidden fields/relationships exist.
  - Support a hardened mode that collapses existence-revealing distinctions (e.g., `unknown_field` vs `field_not_allowed`) when required.
- Cross-tenant cache isolation:
  - Cache keys for compiled plans/responses must include tenant/security context and policy version, not only query params.
  - Required context includes tenant/org identity and role/capability context (or equivalent authorization context hash).
  - Default posture should avoid shared plan caching unless tenant/security context is explicit and mandatory.
- End-to-end resource budgets:
  - Enforce CPU/memory-aware limits across canonicalization, tokenization, AST build, normalization, and plan construction.
  - Add hard caps for token count, normalized literal size, predicate count, selected field count, and include count/path size.
  - Optional soft per-request time budget may be used in addition to structural hard caps.
- Fail-closed policy loading:
  - Policy/registry load or validation failures must abort startup (or reject reload), never degrade to permissive mode.
  - No default-allow fallback and no silent partial policy loads.
- Concurrency-safe policy lifecycle:
  - Hot reload, if supported, must be atomic (copy-on-write or equivalent).
  - Each request must see either the full old policy or full new policy, never mixed/partial state.
  - Include `policy_version` in compiled plans for auditability.
- CI/CD and artifact integrity:
  - Treat the package as security-critical compiler infrastructure.
  - Gate releases on lockfile integrity and dependency vulnerability checks.
  - Prefer reproducible build checks and signed tags/artifacts with provenance verification in CI.
- Observability data classification:
  - Logs/traces/metrics must redact query literals and tenant identifiers by default.
  - Emit stable codes and bounded non-sensitive metadata by default.
  - Any literal-logging debug mode must be explicit, time-bounded, and disabled by default.
- Pure-compile boundary and network egress:
  - This component should remain non-networked and compile-only.
  - Any relationship/include expansion that can trigger outbound calls must be implemented in a separate resolver layer with deny-by-default egress policy.
  - `include` input must not control outbound destinations; fanout/depth limits must still apply.
- Read/write policy separation:
  - Query/read allowlists and write/update allowlists must be separate artifacts with separate validation APIs.
  - No implicit reuse of query registries for write authorization decisions (or vice versa).
- Policy version skew controls:
  - Compiled plans must embed `policy_version`.
  - In strict deployments, requests should be rejectable when expected policy/API version is stale or unknown.
  - Downstream executors/caches must be able to detect and reject mismatched policy versions.
- Test/fixture secret hygiene:
  - Fixtures must use synthetic identifiers only (tenant IDs, tokens, emails, UUIDs).
  - Test pipelines should include secret-pattern/sanitization checks for fixtures, snapshots, and logs.
  - Redaction should remain on by default for test logging outputs.
- Incident response telemetry:
  - Emit deterministic structured security events/counters keyed by error code/category and `policy_version`.
  - Component output should remain non-identifying; service layers may add attribution context.
  - Eventing/alerts should be aggregated/throttled to prevent alert flooding.

### Cross-cutting auditability principle

- Every compiled plan and emitted error should carry a minimal non-sensitive meta footprint including:
  - `policy_version`
  - `tenant_context_present` (`true`/`false`)
- This metadata must not expose tenant identifiers or raw query literals, and should be sufficient to detect cache keying and policy-state regressions.

### Last-mile governance and resilience controls

- Low-cardinality inference support boundaries:
  - Privacy suppression and throttling are primarily service-layer controls, not compiler responsibilities.
  - The compiler should expose stable query-shape classification signals (for example narrow equality lookups) to support downstream privacy/rate-limit policy.
  - Result count behavior should be policy-controlled by consumers when privacy risk is relevant.
- Replay resistance for compiled plans:
  - Compiled plans must be context-bound artifacts (tenant/security context + `policy_version`).
  - If plans are serialized/cached beyond process memory, include bounded lifetime (TTL) and context checks.
  - In-process plan caches still require tenant/security-aware cache keys and policy-version mismatch detection.
- Stable error-code contract governance:
  - Error `code` values are a compatibility contract and must be locked by contract tests.
  - Changes to stable error codes are breaking changes unless explicitly versioned.
  - Prefer a stable minimal code set with optional diagnostic `meta` over proliferating brittle specialized codes.
- Emergency kill-switch policy controls:
  - High-risk features/operators must be centrally controllable in policy.
  - Examples include disabling `=in=`, disabling include processing, reducing max page size, and tightening complexity limits.
  - Disabled features must fail closed with deterministic denial codes.
- Threat-model drift control:
  - Any semantic expansion (new operators/types, include compilation, relationship-path filtering, wildcard support, policy relaxations) is security-relevant.
  - Require lightweight threat review and conformance-suite updates before rollout.
