# ROADMAP

This roadmap schedules `TODO.md` into implementation cycles from current zero-state baseline to `v1.0`.

## Current Baseline

- Current status: `v0.9.x` pre-GA stabilization
- Present: package scaffold + semantic/compiler baseline + error contract + security/performance/cache/context + conformance/governance gates
- Not complete: final pre-GA dependency-risk disposition and GA release evidence closure
- Cycle status:
  - `v0.1.x`: completed
  - `v1.0.0`: current active cycle

## Versioning Model

- `v0.x`: implementation and hardening cycles (breaking changes allowed)
- `v1.0.0`: first stable contract release

## Execution Ledger

- `v0.1.x`: completed
- `v0.2.0`: completed
- `v0.3.0`: completed
- `v0.4.0`: completed (baseline security hardening implemented)
- `v0.5.0`: completed (performance limits + canonical query key baseline)
- `v0.6.0`: completed (context-bound cache key safety baseline)
- `v0.7.0`: completed (conformance expansion baseline)
- `v0.8.0`: completed (governance gate baseline)
- `v0.9.0`: in progress (umbrella pre-GA stabilization cycle)
- `v0.9.1`: completed (query/error determinism hardening)
- `v0.9.2`: completed (CI supply-chain/workflow hardening)
- `v0.9.3`: completed (pre-GA evidence and docs closure baseline)
- `v0.9.4`: completed (filter/parser semantic correctness hardening baseline)
- `v0.9.5`: completed (canonicalization/cache/safe-API hardening baseline)
- `v0.9.6`: completed (governance/tooling robustness hardening)
- `v0.9.7`: completed (pre-GA dependency/evidence closure)
- `v0.9.8`: completed (final 0.x GA-readiness closure)
- `v1.0.0`: in progress (GA release execution)
- `v1.1.x`: planned (post-GA wildcard semantics)
- `v1.2.x`: planned (PostgreSQL execution adapter package `@jsonapi-rsql/pg`)

## Cycle Plan

### Cycle 0 - `v0.1.x` (Completed baseline)

Scope:
- repo/platform skeleton
- initial compile pipeline structure
- initial deterministic error envelope
- docs/process/workflow scaffolding

Exit:
- `npm run ci:check` green
- baseline smoke checks green

### Cycle 1 - `v0.2.0` (Core pipeline + v1 semantic core)

Scope:
- implement canonical pipeline behavior end-to-end
- lock v1 semantic rules:
  - root-field-only filters
  - null semantics (`==null` / `!=null`)
  - no wildcard semantics
  - empty `=in=()` / `=out=()` rejection
  - include pass-through + allowlist behavior
- implement strict typing surface for declared v1 types

Exit:
- deterministic compile behavior on canonical fixtures
- semantic lock-in tests for each v1 rule

### Cycle 2 - `v0.3.0` (Deterministic error contract freeze)

Scope:
- finalize parser behavior for invalid/edge cases
- freeze one canonical error code per conformance scenario
- publish machine-readable error catalog
- lock internal numeric status + JSON:API string serialization

Exit:
- error-code contract tests in place
- no ambiguous `A or B` error outcomes in conformance matrix

### Cycle 3 - `v0.4.0` (Security invariants implementation)

Scope:
- enforce registry-only identifiers and enum operators
- enforce parameter binding-only value paths
- enforce deny-by-default policy interfaces
- enforce mandatory security predicate injection
- implement fail-closed policy load/reload + atomic policy swaps
- implement error hygiene and diagnostics gating
- enforce read/write policy artifact separation

Exit:
- security invariant behavior implemented in runtime
- regression tests for all forbidden security behaviors

### Cycle 4 - `v0.5.0` (Performance invariants implementation)

Scope:
- canonicalization limits (raw + decoded)
- duplicate parameter policy + param surface caps
- complexity limits across pipeline
- deterministic canonical ordering for cache keys
- remove O(n^2) validation paths
- bound plan size and hot-path allocations
- lock `=in=` parameterization strategy
- add compilation time budget hooks + telemetry constraints

Exit:
- performance boundary tests (`limit-1` pass, `limit+1` fail)
- deterministic canonical cache-key tests

### Cycle 5 - `v0.6.0` (Cache/context safety + observability)

Scope:
- context-bound plan/cache behavior (`tenant/security context + policy_version`)
- version mismatch detection at cache/executor boundary
- minimal non-sensitive plan/error meta:
  - `policy_version`
  - `tenant_context_present`
- structured security/performance telemetry (low-cardinality, redacted by default)

Exit:
- replay/cache-context tests pass
- observability redaction and metadata contract tests pass

### Cycle 6 - `v0.7.0` (Conformance suite completion)

Scope:
- convert `docs/CONFORMANCE_TEST_CHECKLIST.md` to full executable suite
- convert `docs/PERFORMANCE_INVARIANTS.md` to executable performance conformance suite
- add policy misconfiguration tests
- add fixture sanitizer tests
- add leakage-absence tests

Exit:
- full conformance suites implemented and green in CI

### Cycle 7 - `v0.8.0` (Release/governance hardening)

Scope:
- semver governance rules for contract surfaces
- migration guide policy for breaking semantic changes
- explicit RFC/review gate for semantic expansions
- policy artifact versioning + traceable change history
- policy-version canary and config-level rollback procedures
- release evidence capture and retention

Exit:
- documented and enforced governance gate in release flow
- release checklist and evidence artifacts validated

### Cycle 8 - `v0.9.0` (Pre-GA hardening and stabilization)

Scope:
- vulnerability remediation for dependency tree
- deterministic malformed-query handling:
  - map percent-decoding/canonicalization failures to `invalid_query_string`
  - ensure safe compile API returns deterministic envelopes on malformed query strings
- explicit page parameter validation:
  - lock canonical validation for `page[size]` / `page[number]`
  - emit canonical `page_parameter_invalid` on violations
- CI/workflow hardening:
  - add dependency audit policy gate (runtime-focused) and residual-risk tracking for dev-only advisories
  - pin/verify workflow action references for integrity
  - enforce least-privilege workflow permissions and governance checks
- remove remaining known TODO blockers
- freeze docs + examples for v1 contract
- final compatibility and upgrade validation pass

Exit:
- all TODO items required for v1 marked complete
- malformed-query decode failures and page validation covered by deterministic contract tests
- CI supply-chain/workflow-hardening checks green
- security/performance/conformance/release gates green

Execution breakdown (planned before implementation):

- `v0.9.1` (completed):
  - deterministic malformed-query/decode handling
  - canonical page parameter validation (`page_parameter_invalid`)
  - contract tests for malformed encoding + page validation boundaries
- `v0.9.2` (completed):
  - runtime-focused dependency audit gate in CI
  - workflow integrity hardening and explicit least-privilege permissions
  - governance checks/tests for workflow posture
- `v0.9.3` (completed):
  - pre-GA evidence updates and closure checks
  - final docs alignment and upgrade/compatibility review
- `v0.9.4` (completed):
  - preserve/lock filter boolean semantics contract (`AND`/`OR`) in plan or explicitly document non-goal
  - move relationship-path rejection to parsed fields (avoid dot-literal false positives)
  - resolve parser/policy dotted-field consistency (`46`/`47` path) with one canonical validation layer
  - remove duplicate empty-membership detection paths; keep structural parsed enforcement only (`48`)
  - align wildcard rejection across operators (including string membership values)
  - remove/parameterize version-specific wildcard error messaging (`49`)
  - lock parser behavior for quoted separators/operator-token edge cases
- `v0.9.5` (completed):
  - prevent semantic mutation of `sort` order in plans
  - separate canonicalization-for-cache from requested-order semantics where needed
  - harden pre-parse gates (raw length and cheap pair-count before decode/parse)
  - ensure raw/decoded query limit checks gate parse/decode cost (`51`)
  - replace delimiter-concatenated cache key with collision-safe tuple encoding/hash
  - eliminate delimiter collision risk in cache key composition (`46`)
  - tighten `compileRequestSafe` contract for unexpected exceptions
  - ensure invalid input-shape errors return deterministic safe envelope (`50`)
  - normalize context fingerprint missing-value handling and expand determinism tests
  - remove `"undefined"` fingerprint sentinel states (`52`)
- `v0.9.6` (completed):
  - refine sensitive-field validation approach (heuristics vs explicit policy flags)
  - harden audit/governance scripts against tool output and formatting brittleness
  - define explicit audit-disposition policy and CI toolchain pinning strategy
  - review and lock determinism helper modules with dedicated conformance tests
  - execution batches (planned before implementation):
    - `v0.9.6.1`: completed (sensitive-field policy ergonomics + contract tests + docs)
    - `v0.9.6.2`: completed (runtime audit script hardening + expiry-bounded disposition policy)
    - `v0.9.6.3`: completed (governance-check robustness hardening + integration tests)
    - `v0.9.6.4`: completed (determinism-helper conformance tests + status/evidence refresh)
- `v0.9.7` (completed):
  - finalize pre-GA dependency-risk disposition evidence with explicit expiry-bounded acceptance
  - complete final `0.x` release-evidence closure package before `v1.0.0`
  - run final docs/state synchronization pass for GA readiness
- `v0.9.8` (completed):
  - run final `0.x` readiness dry-run (quality, governance, runtime-audit)
  - publish final pre-GA evidence snapshot tied to latest 0.x commit
  - freeze remaining 0.x roadmap/todo state ahead of `v1.0.0` planning handoff

### Cycle 8.4 - `v0.9.4` (Filter/parser semantic correctness hardening)

Scope:
- resolve filter semantic ambiguities discovered in deep review
- make relationship-path, wildcard, and operator parsing behavior field-aware and deterministic
- lock boolean-structure contract in plan output (preserved AST vs explicit non-goal)

Exit:
- no raw-filter false positives for dotted literals
- wildcard/relationship/parser edge cases covered by deterministic contract tests
- filter semantic contract documented in README/spec docs

### Cycle 8.5 - `v0.9.5` (Canonicalization/cache/safe API hardening)

Scope:
- preserve query semantics while retaining canonical cache determinism
- move parse-cost guardrails to true pre-parse stage
- eliminate cache-key delimiter collision risk
- lock `compileRequestSafe` behavior for unexpected failures

Exit:
- sort precedence preserved in compiled plans
- cache keys collision-safe by construction
- safe API behavior contract and tests finalized

### Cycle 8.6 - `v0.9.6` (Governance/tooling robustness hardening)

Scope:
- reduce governance-script brittleness
- harden runtime audit tooling behavior
- refine policy-validation ergonomics and false-positive risk
- add targeted determinism-helper conformance coverage

Exit:
- governance/audit checks remain strict but resilient to benign formatting/tooling variance
- policy validation behavior is explicit, predictable, and test-covered

### Cycle 8.7 - `v0.9.7` (Pre-GA dependency/evidence closure)

Scope:
- finalize dependency-risk disposition details (runtime zero-tolerance + expiry-bounded dev-only acceptance)
- complete pre-GA release evidence and status synchronization across root/docs markdown set
- execute final `0.x` docs/state consistency pass before `v1.0.0` gating

Exit:
- dependency-risk disposition is explicit, current, and governance-checked
- `TODO.md`, `ROADMAP.md`, `docs/STATUSQUO.md`, and `docs/RELEASE_EVIDENCE.md` are synchronized
- `npm run ci:check` remains green after documentation/governance updates

### Cycle 8.8 - `v0.9.8` (Final 0.x GA-Readiness Closure)

Scope:
- execute final `0.x` gate dry-run (`ci:check`, governance checks, runtime-only audit)
- refresh release evidence with concrete latest-commit proof points
- freeze planning/state docs for `0.x` completion and `v1.0.0` handoff

Exit:
- final `0.x` evidence block is complete and references latest stable commit
- planning/state docs are synchronized and explicitly point to GA handoff state
- no unresolved `0.x` blocker remains in roadmap execution notes

### Cycle 9 - `v1.0.0` (GA release)

Scope:
- tag and publish first stable contract release
- publish release notes with evidence
- lock v1 compatibility expectations
- integrate external versioned pre/post publish smoke harness:
  - `C:\code\jsonapi-rsql-interface-smoke-test`
  - deterministic pre-publish and post-publish run hooks by target version

Exit:
- `v1.0.0` released with full gate compliance

Execution breakdown (planned before implementation):

- `v1.0.0.1` (completed):
  - add explicit external smoke-harness integration contract (docs + tooling hook)
  - define deterministic invocation shape (`phase`, `version`, harness path)
  - keep CI unaffected (manual release-time invocation only)
- `v1.0.0.2` (completed):
  - finalize GA evidence bundle (`CHANGELOG`, `RELEASE_EVIDENCE`, release notes template instance)
  - freeze `v1.0.0` compatibility statement and migration note (if needed)
- `v1.0.0.3` (in progress):
  - execute final release flow (`release:check`, version bump, tag alignment)
  - run pre/post publish smoke runs via external harness and capture evidence pointers
  - harness resolution rule:
    - resolve execution from installed harness package when root path has no `package.json`
  - progress:
    - pre-publish smoke executed successfully against local packed artifact
  - remaining:
    - post-publish smoke remains pending until package publish step is executed
- `v1.0.0.4` (completed):
  - add deterministic harness provisioning step (`npm install` into harness root) before smoke execution
  - add tooling/docs hooks so pre/post smoke flow is executable from a clean harness directory
- `v1.0.0.5` (completed):
  - support explicit harness install source override (`--harness-install-spec`) for private/unpublished harness artifacts
  - keep default package@version path, but allow tarball/git/local source to unblock release execution
- `v1.0.0.6` (completed):
  - bootstrap local external harness package in `C:\code\jsonapi-rsql-interface-smoke-test`
  - run deterministic pre-publish smoke against local packed tarball of `jsonapi-rsql-interface`
- `v1.0.0.7` (completed):
  - enforce stage/version/timestamp scoped harness directories (`<timestamp>-<phase>-<version>`)
  - isolate pre/post smoke runs with separate per-run `node_modules` trees

### Cycle 10 - `v1.1.x` (Post-GA controlled wildcard semantics)

Scope:
- add string wildcard semantics using RSQL `*` with `==` only
- keep feature policy-gated and disabled by default
- support only:
  - contains (`*value*`)
  - startsWith (`value*`)
  - endsWith (`*value`)
- reject:
  - `a*b`
  - `*a*b*`
  - empty wildcard forms
  - non-string usage
- add deterministic error codes and full conformance coverage

Exit:
- feature merged as opt-in `1.x` capability with no regression to v1 baseline guarantees

### Cycle 11 - `v1.2.x` (Post-GA PostgreSQL Execution Adapter `@jsonapi-rsql/pg`)

Scope:
- create separate package `@jsonapi-rsql/pg` (workspace package layout, independent npm package identity)
- enforce explicit mapping contract:
  - resource table mapping
  - field-to-SQL mapping
  - optional include/join mapping if enabled
  - no reflection/heuristics/inference
- implement deterministic adapter compile surfaces:
  - `compileWhere(plan, mapping)` -> parameterized output
  - `compileOrderBy(plan, mapping)` -> deterministic ordered SQL fragment
  - `compileLimitOffset(plan)` -> deterministic limit/offset representation
  - `compileSelect(plan, mapping)` when projection support is in-scope
  - `compileSecurityPredicate(plan, mapping)` with mandatory enforcement
- enforce adapter safety constraints:
  - user values always parameterized
  - unsupported plan features rejected explicitly with stable adapter errors
  - no semantic reinterpretation of core interface
  - no implicit wildcard/regex/collation/case-insensitive behavior
- add adapter test suites:
  - per-function unit tests
  - deterministic golden SQL/placeholder tests
  - negative tests for unknown mapping, unsupported operator/type, missing security mapping, unsupported feature toggles
- document compatibility and versioning:
  - independent adapter release flow
  - `peerDependencies` compatibility range for `jsonapi-rsql-interface` `v1.x`
  - compatibility matrix/docs

Exit:
- adapter compiles valid query plans into deterministic parameterized PostgreSQL SQL/fragments
- mandatory security predicate enforcement is non-bypassable in adapter output
- unsupported features are rejected deterministically (never ignored)
- adapter package tests and cross-package compatibility checks are green

## Per-Cycle Execution Rules

- Each cycle must end with:
  - updated docs for changed behavior
  - updated automated tests
  - green `npm run ci:check`
- No cycle closes with unresolved contract ambiguity in implemented scope.
