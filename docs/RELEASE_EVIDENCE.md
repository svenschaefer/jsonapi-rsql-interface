# Release Evidence

Use this file (or release artifacts linked from it) to track governance evidence per release.

## Required Evidence per Release

- version + tag + commit SHA
- CI result for release commit
- smoke check result
- conformance status summary
- policy/version governance note (breaking vs non-breaking)
- migration notes link (if applicable)

## Current Status

- Pre-GA evidence entries are tracked below.

## Pre-GA Cycle Evidence

### `v0.9.1` - Query/Error Determinism Hardening

- Commit: `33b6604`
- Scope:
  - deterministic malformed query/decode handling
  - canonical page validation + error mapping
  - contract/leakage test expansion
- Evidence:
  - `npm run ci:check`: pass
  - `npm run audit:runtime`: pass (`0` runtime vulnerabilities)

### `v0.9.2` - CI/Workflow Hardening

- Commit: `52ceea3`
- Scope:
  - runtime dependency audit gate in CI/release workflows
  - explicit CI least-privilege permissions
  - workflow action reference governance verification
  - dependency risk register governance artifact
- Evidence:
  - `npm run ci:check`: pass
  - `npm run audit:runtime`: pass (`0` runtime vulnerabilities)

### `v0.9.3` - Pre-GA Evidence/Docs Closure Baseline

- Commit: `053f65f`
- Scope:
  - status/context alignment for planned `v0.9.4`-`v0.9.6` cycles
  - pre-GA evidence trail continuity for remaining hardening work
- Evidence:
  - `npm run gov:check`: pass
  - docs sync checks: pass

### `v0.9.4` - Filter/Parser Semantic Correctness Hardening

- Commit: `e83f7fb`
- Scope:
  - parsed-field relationship-path validation (no dot-literal false positives)
  - wildcard rejection consistency across operators
  - structural-only empty membership enforcement
  - sort precedence preservation + collision-safe cache key composition
  - deterministic safe-envelope behavior for invalid compile input shape
- Evidence:
  - `npm run ci:check`: pass

### `v0.9.5` - Canonicalization/Cache/Safe-API Hardening

- Commit: `b04b4df`
- Scope:
  - preserve sort precedence in normalized query semantics
  - pre-parse guardrail enforcement before raw query parse/decode
  - collision-safe plan cache key encoding
  - deterministic safe-envelope behavior for unexpected compiler exceptions (`internal_error`)
- Evidence:
  - `npm run ci:check`: pass

### `v0.9.6` - Governance/Tooling Robustness Hardening (completed)

- Commit: `e1351d8`
- Scope:
  - governance workflow permission checks hardened for formatting resilience
  - runtime dependency audit script hardened for execution/output variance
  - policy security validation refined with explicit sensitivity support, allowlist overrides, and lower false-positive risk
  - determinism helper conformance coverage added for normalization/cache-key stability guarantees
  - governance now validates explicit npm toolchain pinning (`packageManager`)
  - compatibility framing hardened for `v1+`:
    - RSQL-compatible core target
    - JSON:API query-surface-only compatibility target
    - explicit non-claim of full JSON:API server/spec compliance
- Evidence:
  - `npm run ci:check`: pass

### `v0.9.7` - Pre-GA Dependency/Evidence Closure (completed)

- Commit: `c918766`
- Scope:
  - finalize explicit dependency-risk disposition policy (runtime zero-tolerance, expiry-bounded dev-only acceptance)
  - complete synchronized pre-GA status/evidence closure across planning/state docs
- Evidence:
  - `npm audit --omit=dev --json`: pass (`0` runtime vulnerabilities)
  - `npm audit --json`: `6` dev-only vulnerabilities (eslint chain), covered by active dated disposition entry

### `v0.9.8` - Final `0.x` GA-Readiness Closure (completed)

- Scope:
  - final pre-GA quality/governance/runtime-audit dry-run
  - latest-commit evidence refresh and docs-state freeze before GA planning handoff
  - runtime audit command invocation hardened for Windows host compatibility (`cmd.exe` wrapper)
- Evidence:
  - `npm run ci:check`: pass
  - `npm run gov:check`: pass
  - `npm run audit:runtime`: pass (`0` runtime vulnerabilities)

### `v1.0.0.1` - External Smoke Harness Integration (completed)

- Scope:
  - integrate release-time external smoke harness invocation by version/phase
  - lock release docs with explicit pre/post publish commands and evidence expectations
- Harness baseline:
  - path: `C:\code\jsonapi-rsql-interface-smoke-test`
  - command surface: `npm run smoke:external -- --phase <pre|post> --version <x.y.z> ...`
- Evidence:
  - contract/unit tests for argument parsing and command construction
  - `npm run ci:check`: pass

### `v1.0.0.2` - GA Evidence/Migration Bundle (completed)

- Scope:
  - materialize concrete GA release-notes draft artifact
  - publish explicit `0.x -> 1.0.0` migration guidance
  - wire release docs references in `README.md`
- Evidence:
  - release notes draft: `docs/releases/v1.0.0.md`
  - migration guide: `docs/MIGRATION_0.x_TO_1.0.0.md`
  - `npm run ci:check`: pass

### `v1.0.0.3` - GA Release Execution (in progress)

- Scope:
  - execute final release flow steps (release checks, version/tag alignment, publish flow)
  - execute external pre/post smoke runs with target GA version and capture results
- Evidence:
  - `npm run release:check`: pass
  - external pre-smoke (`phase=pre`): blocked (`npm install` returned `E404` for `jsonapi-rsql-interface-smoke-test@1.0.0`)
  - external post-smoke (`phase=post`): pending

### `v1.0.0.4` - Harness Provisioning Step (completed)

- Scope:
  - add deterministic harness provisioning command to install/update harness package for target version
  - update release/process docs to run provisioning before pre/post smoke execution
- Evidence:
  - provisioning helper: `npm run smoke:external:prepare`
  - contract tests: pass
  - `npm run ci:check`: pass
