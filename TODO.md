# TODO

## Status Snapshot

- Completed baseline cycle: `v0.1.0`
- Completed cycle: `v0.2.0` (Core pipeline + v1 semantic core)
- Completed cycle: `v0.3.0` (Deterministic error contract freeze)
- Current active roadmap cycle: `v0.4.0` (Security invariants implementation)

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

## 8) Release and governance gates (enterprise readiness)

- Define semver governance for contract surface (error codes, semantics, defaults).
- Require migration guides for any semantic breaking change.
- Require explicit review gate (RFC or equivalent) for semantic expansions/relaxations.
- Make invariants + conformance suites mandatory release blockers.
- Define and monitor SLOs: compile latency, rejection rates by class, policy artifact availability.
- Support policy-version canary rollout and fast config-level rollback.
- Version policy artifacts and retain traceable change history (`who/what/when/why`).
- Preserve conformance/security evidence as release artifacts.

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
