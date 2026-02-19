# Status Quo

Short operational snapshot of `jsonapi-rsql-interface`.

## Repo status

- Baseline scaffold is implemented and committed.
- Branch: `main` (tracking `origin/main`).
- Current roadmap phase: `v0.2.0` (core pipeline + v1 semantic core).
- Planning/state docs are active: `TODO.md`, `ROADMAP.md`, `CODEX_CONTEXT.md`.

## Runtime status

- Node package scaffold is active with CommonJS entrypoints.
- CLI baseline exists:
  - `compile`
  - `validate-plan`
- Core compile pipeline skeleton is present:
  - `parse -> normalize -> type-check -> policy-check -> compile`

## Quality status

- `npm test`: passing.
- `npm run ci:check`: passing.
- `npm run smoke:release`: passing.
- Contract tests implemented for:
  - deterministic compile behavior (baseline)
  - key error-code behavior (baseline)
  - package/docs/workflow contracts
  - CLI/config input contracts

## Security and performance status

- Invariant specs are documented:
  - `docs/SECURITY_INVARIANTS.md`
  - `docs/PERFORMANCE_INVARIANTS.md`
- Conformance checklist documented in `docs/CONFORMANCE_TEST_CHECKLIST.md`.
- Full executable conformance suites are not complete yet (tracked in `TODO.md` and `ROADMAP.md`).

## Dependency and release status

- `package-lock.json` exists and CI uses `npm ci`.
- Release workflow includes tag/version checks, tarball artifact, and optional publish path.
- Dependency tree reported known vulnerabilities during initial install; remediation is tracked pre-`v1.0.0`.

## Immediate next steps

- Complete `v0.2.0` semantic implementation gaps (strict type behavior and remaining v1 rules).
- Move to `v0.3.0` to freeze canonical deterministic error codes per scenario.
