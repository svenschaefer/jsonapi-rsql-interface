# Developer Tooling (Non-Public)

This document describes repository development tooling only.
It is not part of the package compatibility contract.

## Scope

These scripts are for local quality analysis and CI hygiene:

- `npm run dev:check`
- `npm run dev:report:metrics`
- `npm run dev:report:maturity`
- `npm run audit:runtime` (runtime dependency audit gate used by CI/release workflows)
- `npm run smoke:external:prepare -- --version <x.y.z> [--harness-dir <path>] [--harness-package <name>]`
  - release-only helper to install/update the harness package in the harness root
  - supports `--harness-install-spec` for private registry/git/tarball/local harness artifacts
- `npm run smoke:external -- --phase <pre|post> --version <x.y.z> [--harness-dir <path>] [--harness-package <name>]`
  - release-only helper for external smoke harness invocation by target version
  - supports installed-harness resolution from `<harness-dir>/node_modules/<harness-package>`

## Contract Boundary

Public/stable interfaces are the package exports in `package.json`.
`npm run dev:*` scripts are internal workflow tooling and may evolve between releases.

## Toolchain Pinning Strategy

- Package-level intent is pinned via `package.json#engines.node` and `package.json#packageManager`.
- CI pinning:
  - validation matrix remains explicit in `.github/workflows/ci.yml` (`20.x`, `22.x`)
  - release validation is pinned to `22.x` in `.github/workflows/release.yml`
- Dependency graph pinning is lockfile-based (`npm ci` with committed `package-lock.json`).
