# TODO

## Status Snapshot

- Completed baseline cycle: `v0.1.0`
- Completed cycle: `v0.2.0` (Core pipeline + v1 semantic core)
- Completed cycle: `v0.3.0` (Deterministic error contract freeze)
- Completed cycle: `v0.4.0` (Security hardening baseline)
- Completed cycle: `v0.5.0` (Performance hardening baseline)
- Completed cycle: `v0.6.0` (Cache/context safety baseline)
- Completed cycle: `v0.7.0` (Conformance expansion baseline)
- Completed cycle: `v0.8.0` (Release/governance hardening baseline)
- Current active roadmap cycle: `v1.2.x` (PostgreSQL execution adapter package `@jsonapi-rsql/pg`)

## 0) Core implementation (must exist first)

- [x] Implement one canonical pipeline entrypoint: `parse -> normalize -> type-check -> policy-check -> compile`.
- [x] Keep component pure-compile and non-networked.
- [x] Implement structured input contract: query + policy + security context.
- [x] Implement deterministic output contract: governed plan or deterministic errors.

## 1) V1 semantics lock-in

- Enforce root-resource-only filter fields (reject relationship paths).
- Lock strict parsers for `string`, `int` (signed 64-bit), `float` (strict decimal, no scientific notation), `bool`, `date`, `datetime`, `uuid`, `enum`.
- Enforce datetime explicit offset input and UTC normalization semantics.
- Enforce enum case-sensitive matching.
- Enforce null semantics: only `==null` / `!=null`.
- Reject wildcard semantics in `==` and keep pattern operators out of v1.
- Reject empty `=in=()` / `=out=()` with `empty_in_list_not_allowed`.
- Keep `include` as allowlist + pass-through only (no join compilation in v1).

## 2) Deterministic error contract

- Finalize parser behavior for all invalid/edge-case inputs.
- Freeze one canonical deterministic error code per conformance scenario.
- Publish machine-readable error catalog: `code -> status -> title -> safe detail/meta rules`.
- Keep internal status numeric, serialize JSON:API `status` as string.
- Treat error codes as compatibility contract; add contract tests to prevent churn.

## 3) Security invariants implementation

- Enforce registry-only identifier mapping for `filter/sort/fields/include`.
- Enforce operator allowlist enum only.
- Enforce value parameter binding only (no user literal interpolation paths).
- Enforce deny-by-default policy interfaces for all query dimensions.
- Enforce mandatory server-injected security predicates with deterministic failure when missing (`security_predicate_required`).
- Enforce error hygiene (no SQL/schema/stack/internal path leakage).
- Gate raw literal echo behind explicit diagnostics mode (default off).
- Separate read/query policy artifacts from write/update artifacts (no implicit reuse).
- Ensure fail-closed startup/reload on invalid/missing policy artifacts.
- Implement atomic policy reload (old-or-new policy visibility only, never partial).
- Add hardened mode behavior for existence-leak minimization where needed.

## 4) Performance invariants implementation

- Enforce raw query-length and decoded-length hard caps.
- Enforce parameter surface caps (param count, key/value count, per-value length).
- Enforce deterministic duplicate-parameter handling (baseline: reject duplicates).
- Enforce complexity caps (AST depth/nodes, literal size, `in/out` list size, sort count, fields count, include count/path length).
- Implement canonical ordering for cache keys (query keys, sort, fields lists, include paths).
- Remove O(n^2) validation paths; use precompiled map/set lookups.
- Keep hot path allocation-light (index-based tokenization where feasible, minimal substring churn).
- Bound plan size and avoid storing large literals in plans/logs/caches.
- Lock one consistent `=in=` parameterization strategy for DB plan stability.
- Enforce per-request compilation time/CPU budget at service integration boundary.
- Keep telemetry labels low-cardinality and rate-limit failure metric emission when needed.
- Bound policy compile/reload cost and skip rebuild on identical checksum/version.

## 5) Cache, replay, and context safety

- Include tenant/security context and `policy_version` in plan/response cache keys.
- Prevent shared cache reuse without explicit mandatory security context.
- Bind compiled plans to context + `policy_version`; add TTL when serialized/cached.
- Detect and reject policy-version mismatch at executor/cache boundaries.

## 6) Observability and auditability

- Emit structured non-sensitive telemetry keyed by stable error code/category.
- Include minimal meta footprint on plans/errors: `policy_version`, `tenant_context_present`.
- Keep tenant IDs and raw literals redacted by default in logs/traces/metrics.
- Add optional debug modes that are explicit, bounded, and off by default.
- Emit deterministic security/performance counters for incident response.

## 7) Conformance and test suite

- Convert `docs/CONFORMANCE_TEST_CHECKLIST.md` to executable automated tests.
- Build full performance conformance tests from `docs/PERFORMANCE_INVARIANTS.md`.
- Add boundary tests for every configured limit (`limit-1` passes, `limit+1` fails).
- Add regression tests for all forbidden behaviors from security and v1 scope.
- Add policy misconfiguration tests (sensitive field exposure, missing mandatory predicates).
- Add fixture sanitizer tests (synthetic identifiers only, secret-pattern checks).
- Add leakage tests asserting absence of schema/SQL/stack/internal paths.
- Add contract tests for stable error code namespace and semantics.

## 7.1) Unit test coverage requirements (leakage guardrails)

- Implement/verify all leakage-guardrail requirements defined in `docs/TEST_REQUIREMENTS.md` section `1) Leakage Guardrails`.

## 7.2) Additional explicit unit test requirements

- Implement/verify all explicit unit-test requirements defined in `docs/TEST_REQUIREMENTS.md` section `2) Additional Explicit Unit Test Requirements`.

## 8) Release and governance gates (enterprise readiness)

- Define semver governance for contract surface (error codes, semantics, defaults).
- Require migration guides for any semantic breaking change.
- Require explicit review gate (RFC or equivalent) for semantic expansions/relaxations.
- Make invariants + conformance suites mandatory release blockers.
- Define and monitor SLOs: compile latency, rejection rates by class, policy artifact availability.
- Support policy-version canary rollout and fast config-level rollback.
- Version policy artifacts and retain traceable change history (`who/what/when/why`).
- Preserve conformance/security evidence as release artifacts.

## 8.3) GA release execution (`v1.0.0`)

- Integrate external smoke harness for versioned pre/post publish checks:
  - harness path baseline: `C:\code\jsonapi-rsql-interface-smoke-test`
  - deterministic run dimensions: `phase` (`pre`/`post`) + `version`
  - smoke runner must resolve harness from installed package location when root path is empty
  - deterministic harness provisioning step must install/update harness package by target version before smoke run
  - release docs must capture how to invoke and where evidence is stored
- Ensure external smoke harness invocation is explicit/manual release workflow step (not default CI gate).
- Capture pre-publish and post-publish smoke outcomes in release evidence for `v1.0.0`.
- Confirm harness package install source/name/version used by provisioning command (current default `jsonapi-rsql-interface-smoke-test@<version>` may not resolve in npm registry).
- Support explicit harness install source override in provisioning (`--harness-install-spec`) for private registry/tarball/git/local artifact paths.
- Ensure pre-publish smoke can run fully locally:
  - bootstrap external harness package structure in `C:\code\jsonapi-rsql-interface-smoke-test` when absent
  - run pre-publish smoke against local `npm pack` tarball artifact before publish.
- Enforce run-directory isolation for external smoke harness:
  - use scoped harness folders `<timestamp>-<phase>-<version>`
  - avoid shared `node_modules` between pre/post and cross-version runs
- Extend external smoke artifact-level coverage:
  - pre-phase must fail early when `--package-source` is missing/non-file
  - verify installed artifact surface (`package.json`, exports/main entrypoint resolution, entrypoint file presence)
  - emit auditable smoke summary fields (`installed_from`, `resolved_package_dir`, `resolved_entrypoint`)
  - include exactly one sentinel negative-path call to verify non-throwing safe envelope behavior

## 8.1) Pre-GA stabilization (v0.9.x)

- Complete dependency-risk disposition:
  - remediate where non-breaking fixes are available
  - document explicit risk acceptance where residual dev-only advisories remain
- Enforce deterministic malformed-query handling:
  - wrap percent-decoding/canonicalization failures and emit `invalid_query_string`
  - ensure `compileRequestSafe` always returns deterministic error envelopes for malformed encodings
- Implement explicit page parameter validation:
  - validate `page[size]` and `page[number]` syntax/range deterministically
  - emit canonical `page_parameter_invalid` for all page validation failures
- Harden CI supply-chain and action integrity baseline:
  - add automated `npm audit` policy gate for production/runtime dependencies
  - add explicit review/track path for residual dev-only advisories
  - pin and/or verify GitHub Action references for workflow integrity
- Strengthen workflow least-privilege posture:
  - set explicit workflow/job permissions in CI (read-only by default)
  - add governance test coverage for required workflow permissions posture
- Add release evidence entry for the final `0.x` pre-GA state.
- Keep project on `0.x` until all pre-GA topics are closed.

## 8.2) Deep review hardening backlog (0.x required before GA)

- Explicit items from deep review set (`46`-`52`):
  - `46` replace delimiter-based `createPlanCacheKey()` with collision-safe encoding/hash
  - `47` resolve dotted-field inconsistency between parser grammar and root-field policy checks
  - `48` remove redundant raw-text empty-membership detection; keep structural parsed check only
  - `49` remove or parameterize version-specific wildcard error text to match active policy version
  - `50` make `compileRequestSafe()` safe for invalid input shapes (no generic throw leaks)
  - `51` move raw query guardrails before parse/decode work (plus cheap pre-scan caps)
  - `52` avoid `"undefined"` sentinel values in context fingerprint partition keys
- Filter semantics and parser correctness:
  - preserve boolean semantics (`AND` / `OR`) in plan output, or explicitly lock/document non-preservation as a contract non-goal
  - make parser quote-aware or explicitly reject quoted separator/operator cases deterministically
  - enforce relationship-path rejection on parsed `clause.field` (not raw filter string) to avoid literal false positives
  - enforce wildcard rejection consistently across all operators (including string values in `=in=` / `=out=`) for v0/v1
  - lock explicit dotted-field policy (dots reserved/rejected unless explicitly supported)
  - lock empty `=in=` / `=out=` error classification (`empty_in_list_not_allowed`) as policy contract
- Canonicalization and query semantics:
  - stop semantic mutation of `sort` precedence in plan semantics (preserve caller order)
  - define whether `include` / `fields[...]` order is semantic or canonical-only; preserve requested form where needed
  - if canonical form is required for cache only, separate requested-order representation from canonical cache representation
  - lock and document `+` decoding behavior in raw query parsing
- Pre-parse DoS protection:
  - apply raw-length gate before any parsing/decoding work
  - add cheap pre-parse pair-count caps (raw `&`/parameter-surface estimate) before decode
  - define and enforce string-size metric (byte length vs JS string length) for security/perf limits
- Cache-key and determinism hardening:
  - replace delimiter-concatenated cache key format with collision-safe tuple encoding (length-prefix or hash)
  - normalize context fingerprint missing values (avoid `"undefined"` partition artifacts)
  - add determinism tests for cache-key stability across key-order/whitespace/input-shape variants
  - add targeted review/tests for deterministic helper modules (`src/core/determinism.js`, normalization dependencies)
- Safe API contract hardening:
  - decide and lock `compileRequestSafe` contract (`never throws` vs `throws unexpected`)
  - if `never throws`, add deterministic `internal_error` mapping for unexpected exceptions
  - ensure non-`CompilationError` paths cannot leak internals
- Error precision and compatibility:
  - improve malformed key-decoding error attribution (consistent `source.parameter` strategy)
  - remove hard-coded version strings in error detail (or parameterize by policy version)
  - lock operator/value ambiguity behavior with explicit rejection rules and tests
- Policy validation and security ergonomics:
  - refine sensitive-field exposure controls to reduce false positives from substring heuristics
  - evaluate explicit policy flags (for example `sensitive: true`) vs name-pattern heuristics
  - keep hardened mode and existence-leak behavior explicit and test-covered
- Governance and tooling robustness:
  - harden `audit-runtime` parsing/diagnostics against npm output/schema variance
  - define deterministic policy for audit gate exceptions/dispositions (expiry-bounded)
  - reduce regex brittleness in governance workflow checks (prefer YAML-aware validation or strict formatting contract)
  - pin/lock CI toolchain behavior where needed to avoid audit/governance drift

## 9) Template-derived repo/platform baseline

- [x] Initialize npm package contract for this compiler component:
  - `package.json` with explicit `exports` surface and `engines.node >= 20`.
  - `private` mode until first public release decision.
  - packlist via `files` allowlist (include docs + security artifacts).
- [x] Add minimal source layout:
  - `src/index.js` public entrypoint.
  - canonical compile entrypoint module (`compile` API).
  - deterministic error type + error catalog module.
- [x] Add script baseline (adapted from template):
  - `lint`, `test`, `pack:check`, `ci:check`, `release:check`.
  - `release:check` must enforce clean worktree + full quality gates.
- [x] Add CI workflow baseline:
  - PR + `main` CI with Node matrix and `npm ci`, `npm test`, `npm run pack:check`.
  - include deterministic smoke checks for API export contract.
- [x] Add release workflow baseline:
  - manual `workflow_dispatch` release check by tag.
  - verify tag format, tag ancestry, version/tag match, tarball artifact.
  - optional npm publish path gated by explicit input and token presence.
- [x] Add docs/process baseline:
  - `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md` with `Unreleased` section.
  - release process doc with non-destructive commit/tag flow.
  - repo workflow doc that encodes "no amend tagged release" rule.
- [x] Add contract tests inspired by template:
  - package export subpath contract tests.
  - docs consistency tests (README references existing docs).
  - release smoke script contract tests.
  - stable validation/error-code contract tests.
- [x] Add deterministic dev-report scripts (internal only):
  - maturity/metrics reports for local and CI visibility.
  - mark `dev:*` scripts as non-public workflow tooling.
- [x] Add operational snapshot discipline:
  - maintain a concise `docs/STATUSQUO.md` with repo/runtime/quality/docs state.
- [x] Add release evidence template:
  - `docs/RELEASE_NOTES_TEMPLATE.md` with version, commit, tag, CI result, smoke evidence, change summary.
- [x] Add baseline smoke doctrine:
  - create `docs/BASELINE_TEST_RUN.md` to define invariant-only smoke assertions.
  - keep smoke checks focused on stable contract invariants, not brittle full-output matching.
- [x] Add stricter release-doc guardrails:
  - require explicit staged paths in release docs/scripts.
  - forbid broad staging commands in release flow (`git add -A`) via docs consistency tests.
- [x] Add changelog and docs contract checks:
  - enforce `CHANGELOG.md` has `Unreleased`.
  - enforce README references only existing docs/files.
- [x] Add CLI/config contract checks:
  - exactly-one-input-source rule for run command.
  - explicit failure on missing required config path.
  - config loader rejects invalid JSON and non-object config shape.
- [x] Add deterministic API behavior tests:
  - identical input/options must produce byte-equivalent plan/error output envelopes.
  - validation layer emits stable code-based errors for branching.

## 10) Post-GA (1.x) planned topic: string wildcard semantics in RSQL

Progress (`v1.1.x`):
- Core policy-gated wildcard behavior and deterministic wildcard error codes are implemented and released in `1.1.0`.

- Scope:
  - only after `v1.0.0`
  - not enabled in `v0.x` or v1.0 baseline
- Target model:
  - use RSQL de-facto wildcard semantics (`*` with `==`) for string matching
  - no regex or DSL expansion
- Supported forms:
  - contains (`*value*`)
  - startsWith (`value*`)
  - endsWith (`*value`)
- Explicitly rejected:
  - middle wildcards (`a*b`)
  - multi-segment wildcards (`*a*b*`)
  - empty-only wildcard forms
  - non-string usage
- Policy controls:
  - per-field opt-in only
  - explicit case-sensitivity mode
  - explicit length/performance guards
  - substring capability separate from plain equality capability
- SQL behavior:
  - deterministic `LIKE` semantics
  - fully parameterized values
  - no implicit optimizer/index magic
- Error contract:
  - deterministic codes for invalid wildcard patterns and disallowed usage
- Non-goals:
  - regex
  - fuzzy search
  - implicit cross-field behavior

## 11) Post-GA (1.x) planned topic: PostgreSQL execution adapter package `@jsonapi-rsql/pg`

Create a separate npm package `@jsonapi-rsql/pg` that executes a `jsonapi-rsql-interface` query plan against PostgreSQL in a strictly parameterized, deterministic, and policy-respecting way.

Authoritative adapter constraints for `v1.2.x`:
- `docs/ADAPTER_PG_SECURITY_PERFORMANCE_CONSTRAINTS.md`

Progress (`v1.2.x`):
- Workspace package skeleton implemented at `packages/adapter-pg/`.
- Implemented compile surfaces:
  - `compileWhere`
  - `compileOrderBy`
  - `compileLimitOffset`
  - `compileSecurityPredicate`
  - `compileSelect` (root-table-only scope)
- Implemented optional assembly-only helper:
  - `assembleSelectSql(...)`
- Added stable adapter error namespace and deterministic fragment/mapping validation.
- Added adapter contract tests in `test/unit/adapter-pg.contract.test.js`.
- Added golden determinism and error-hygiene adapter tests in `test/unit/adapter-pg-golden.contract.test.js`.
- Added adapter package/readme contract tests in `test/unit/adapter-pg-package.contract.test.js`.

- Scope:
  - new package `@jsonapi-rsql/pg`
  - depends on `jsonapi-rsql-interface` core
  - output is parameterized SQL (`text` + `values`) or deterministic compiled fragments
  - non-goal: changing interface semantics or introducing implicit DB-specific behavior into core
- Deliverables:
  - workspace package layout (for example `packages/adapter-pg/`)
  - package contract (`package.json`, `README.md`, `src/`, tests)
  - explicit mapping contract (resource table + field mappings + optional include/join mappings)
  - no reflection, heuristics, or naming-based inference
- Core adapter API:
  - accept `query_plan` + `mapping`
  - deterministic parameterized outputs only
  - deterministic placeholder assignment/formatting
  - minimum compile surfaces:
    - `compileWhere(plan, mapping)`
    - `compileOrderBy(plan, mapping)`
    - `compileLimitOffset(plan)`
    - `compileSelect(plan, mapping)` when projection support is enabled
    - `compileSecurityPredicate(plan, mapping)` with mandatory enforcement
  - optional convenience helper:
    - add `assembleSelectSql(...)` that only assembles already-compiled fragments into final `{ text, values }`
    - helper inputs are explicit-only (`table`, `select`, `where`, `security`, `orderBy`, `limitOffset`, `values`)
    - helper must be assembly-only:
      - no new semantics
      - no validation/policy inference
      - no defaults that change behavior
      - no feature enablement/disablement logic
    - helper must preserve deterministic placeholder and value ordering from provided fragments
    - unsupported/unknown features must not be silently ignored; semantic decisions remain outside helper scope
- Safety/correctness requirements:
  - always parameterize user values (no interpolation)
  - reject unsupported plan features explicitly with stable adapter errors
  - preserve semantic `sort` order exactly
  - do not add wildcard/regex/collation/case-insensitive semantics unless already explicit in plan/policy
  - if include/join compilation is out-of-scope, reject deterministically (no silent ignore)
- Testing requirements:
  - unit tests per compile surface
  - golden tests for deterministic SQL/placeholder output
  - negative tests for unknown mapping, unsupported operator/type, missing security predicate mapping, and unsupported feature toggles
- Versioning/compatibility:
  - independent package publishing
  - `peerDependencies` on `jsonapi-rsql-interface` with compatible `v1.x` range
  - explicit compatibility documentation across interface versions
- Acceptance criteria:
  - valid query plans compile into deterministic parameterized PostgreSQL SQL
  - security predicate is mandatory in compiled execution outputs
  - adapter cannot reinterpret core interface semantics
  - unsupported features are rejected deterministically
