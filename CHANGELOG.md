# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- Policy-gated wildcard extension for string `==` filters (post-GA `v1.1.x` work-in-progress):
  - supported forms: `*value*`, `value*`, `*value`
  - new deterministic wildcard error codes:
    - `wildcard_not_allowed`
    - `wildcard_operator_not_allowed`
    - `wildcard_type_not_supported`
    - `invalid_wildcard_pattern`

## [1.0.0] - 2026-02-19

### Added

- Deterministic malformed query/decode handling with canonical `invalid_query_string`.
- Canonical `page[size]` / `page[number]` validation with `page_parameter_invalid`.
- Runtime dependency audit script (`npm run audit:runtime`) and CI/release workflow gate.
- Dependency risk register (`docs/DEPENDENCY_RISK_REGISTER.md`).
- External release smoke helper (`npm run smoke:external`) with deterministic `phase/version` invocation.
- External smoke harness provisioning helper (`npm run smoke:external:prepare`) for versioned harness installation.
- External smoke harness provisioning now supports explicit install source override (`--harness-install-spec`).
- Added local harness bootstrap helper (`npm run smoke:external:bootstrap`).
- Added one-shot local prepublish smoke flow (`npm run smoke:external:prepublish`).
- External smoke runner now supports explicit tarball source forwarding for prepublish mode (`--package-source`).
- External smoke harness directories are now timestamp/stage/version scoped: `<timestamp>-<pre|post>-<version>`.
- External smoke runner now validates installed artifact surface and emits auditable artifact-path metadata in smoke JSON.
- GA release-notes draft artifact: `docs/releases/v1.0.0.md`.
- Migration guide artifact: `docs/MIGRATION_0.x_TO_1.0.0.md`.

### Changed

- Query plan now emits validated numeric page values.
- CI workflow now uses explicit least-privilege permissions.
- Governance checks now verify workflow permission posture and approved action references.
- Relationship-path filter checks now validate parsed field tokens (not raw literal text).
- Wildcard rejection now applies consistently across filter operators.
- Empty in-list rejection is now enforced through parsed structural checks.
- Query normalization preserves `sort` precedence order in plan semantics.
- Plan cache keys now use collision-safe tuple encoding.
- `compileRequestSafe` now returns deterministic invalid-query errors for bad input shapes.
- `compileRequestSafe` now maps unexpected internal exceptions to deterministic `internal_error`.
- Error catalog includes explicit `internal_error` contract code (`500`).
- Governance workflow permission checks are now less brittle to benign formatting changes.
- Runtime audit script has stricter handling for empty/invalid npm audit JSON output.
- Runtime audit script now uses Windows-safe `cmd.exe` invocation to avoid `spawnSync npm.cmd EINVAL` failures.
- Policy security validation supports explicit `sensitive: true` and reduced generic-token false positives.
- Policy security validation now supports `security.sensitive_field_allowlist` overrides for heuristic exceptions.
- Governance checks now enforce explicit npm toolchain pinning via `packageManager`.
- Added deterministic helper contract tests for `sortStrings`, `stableObject`, and normalized query key stability.
- Release docs now include external pre/post publish smoke flow via `C:\code\jsonapi-rsql-interface-smoke-test`.
