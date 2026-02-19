# ROADMAP

This roadmap schedules `TODO.md` into implementation cycles from current zero-state baseline to `v1.0`.

## Current Baseline

- Current status: `v0.9.x` pre-GA stabilization
- Present: package scaffold + semantic/compiler baseline + error contract + security/performance/cache/context + conformance/governance gates
- Not complete: final pre-GA dependency-risk disposition and GA release evidence closure
- Cycle status:
  - `v0.1.x`: completed
  - `v0.9.3`: current active cycle

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
- `v0.9.3`: in progress (pre-GA evidence closure)
- `v1.0.0`: planned GA

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
- `v0.9.3` (in progress):
  - pre-GA evidence updates and closure checks
  - final docs alignment and upgrade/compatibility review

### Cycle 9 - `v1.0.0` (GA release)

Scope:
- tag and publish first stable contract release
- publish release notes with evidence
- lock v1 compatibility expectations

Exit:
- `v1.0.0` released with full gate compliance

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

## Per-Cycle Execution Rules

- Each cycle must end with:
  - updated docs for changed behavior
  - updated automated tests
  - green `npm run ci:check`
- No cycle closes with unresolved contract ambiguity in implemented scope.
