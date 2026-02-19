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
