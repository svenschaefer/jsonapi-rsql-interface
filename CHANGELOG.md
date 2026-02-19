# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- Deterministic malformed query/decode handling with canonical `invalid_query_string`.
- Canonical `page[size]` / `page[number]` validation with `page_parameter_invalid`.
- Runtime dependency audit script (`npm run audit:runtime`) and CI/release workflow gate.
- Dependency risk register (`docs/DEPENDENCY_RISK_REGISTER.md`).

### Changed

- Query plan now emits validated numeric page values.
- CI workflow now uses explicit least-privilege permissions.
- Governance checks now verify workflow permission posture and approved action references.
