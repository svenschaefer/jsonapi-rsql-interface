# Status Quo

Short operational snapshot of `jsonapi-rsql-interface`.

## Repo status

- Baseline scaffold is implemented and committed.
- Branch: `main` (tracking `origin/main`).
- Current roadmap phase: `v0.5.0` (performance invariants implementation).
- Planning/state docs are active: `TODO.md`, `ROADMAP.md`, `CODEX_CONTEXT.md`.

## Runtime status

- Node package scaffold is active with CommonJS entrypoints.
- CLI baseline exists:
  - `compile`
  - `validate-plan`
- Core compile pipeline skeleton is present:
  - `parse -> normalize -> type-check -> policy-check -> compile`
- `v0.2.0` semantic core is implemented:
  - strict type checks (int/float/bool/date/datetime/uuid/enum)
  - root-only filters, null handling guardrails, wildcard rejection
  - include/sort/fields allowlist enforcement baseline

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
- Error catalog is published in `docs/ERROR_CATALOG.md` and locked by contract tests.
- Security hardening baseline implemented:
  - optional policy artifact validation for sensitive-field/read-write misconfiguration checks
  - hardened-mode field error behavior for existence-leak minimization
- Full executable conformance suites are not complete yet (tracked in `TODO.md` and `ROADMAP.md`).

## Performance baseline status

- Parameter surface hard limits implemented (parameter count, key/value count, value length).
- Filter/include literal/path length limits implemented.
- Deterministic `normalized_query_key` emitted in plan metadata.
- Performance-limit contract tests added for deterministic enforcement.

## Dependency and release status

- `package-lock.json` exists and CI uses `npm ci`.
- Release workflow includes tag/version checks, tarball artifact, and optional publish path.
- Dependency tree reported known vulnerabilities during initial install; remediation is tracked pre-`v1.0.0`.

## Immediate next steps

- Continue `v0.5.0` with additional performance guardrails (remaining limits and budget tuning).
- Begin `v0.6.0` cache/context safety and observability hardening after current performance cycle closes.
