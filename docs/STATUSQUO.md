# Status Quo

Short operational snapshot of `jsonapi-rsql-interface`.

## Repo status

- Baseline scaffold is implemented and committed.
- Branch: `main` (tracking `origin/main`).
- Current roadmap phase: `v1.0.0` (GA release handoff).
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
- `v0.9.1` hardening implemented:
  - malformed percent-encoding deterministically maps to `invalid_query_string`
  - canonical `page[size]` / `page[number]` validation with `page_parameter_invalid`
  - validated page values compile into numeric plan fields
- `v0.9.4` progress implemented:
  - relationship-path checks now run on parsed fields (no dot-literal false positives)
  - wildcard rejection is consistent across operators
  - empty in-list rejection is enforced via structural parsed checks
  - sort precedence is preserved in normalized plan semantics
  - cache key format moved to collision-safe tuple encoding
  - `compileRequestSafe` now returns deterministic query-shape errors
- `v0.9.5` progress implemented:
  - pre-parse query length/pair guardrails are enforced before parsing raw query text
  - `compileRequestSafe` now maps unexpected exceptions to deterministic `internal_error`
  - error catalog now includes explicit `internal_error` contract entry
- `v0.9.6` progress implemented:
  - governance permission checks are less brittle to workflow formatting variation
  - runtime audit script has stricter tool-output handling and Windows-safe invocation behavior
  - policy validation now supports explicit `sensitive: true`, plus allowlist overrides for safe heuristic exceptions
  - package-manager pinning is governance-validated (`packageManager: npm@10.9.2`)
  - determinism helper modules are covered by explicit contract tests
- `v1.0.0` GA handoff progress implemented:
  - external versioned smoke harness runner is available via `npm run smoke:external`
  - external harness provisioning helper is available via `npm run smoke:external:prepare`
  - provisioning supports explicit harness source override via `--harness-install-spec`
  - harness bootstrap helper is available via `npm run smoke:external:bootstrap`
  - one-shot local prepublish flow is available via `npm run smoke:external:prepublish`
  - external smoke harness directories are scoped per run as `<timestamp>-<phase>-<version>`
  - external smoke runner performs artifact-level installation surface checks and emits auditable installed-artifact paths
  - release docs now define pre/post publish smoke flow against `C:\code\jsonapi-rsql-interface-smoke-test`
  - GA release-notes draft and migration guide artifacts are now present:
    - `docs/releases/v1.0.0.md`
    - `docs/MIGRATION_0.x_TO_1.0.0.md`

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

## Cache/context safety status

- Context fingerprinting is implemented with non-sensitive metadata only.
- Policy/context/query-bound `plan_cache_key` is emitted for safe cache partitioning.
- Contract tests enforce cache-key changes across policy version and context changes.

## Conformance expansion status

- Added leakage-guard integration tests for error surfaces.
- Added limit-boundary integration tests (`limit` pass, `limit+1` fail).
- Added fixture sanitizer tests to prevent secret-like fixture content.

## Governance hardening status

- Compatibility policy is documented in `docs/COMPATIBILITY_POLICY.md`.
- Release evidence template is documented in `docs/RELEASE_EVIDENCE.md`.
- Governance gate script (`npm run gov:check`) is wired into `ci:check`.
- Workflow governance hardening implemented:
  - CI workflow has explicit least-privilege permissions
  - workflow action references are verified by governance checks
  - dependency risk register is required governance artifact

## Dependency and release status

- `package-lock.json` exists and CI uses `npm ci`.
- Release workflow includes tag/version checks, tarball artifact, and optional publish path.
- Dependency tree still reports known lint-toolchain vulnerabilities in `npm audit` (dev-only path); disposition is recorded as active, expiry-bounded acceptance in `docs/DEPENDENCY_RISK_REGISTER.md`.
- Runtime dependency audit gate is implemented in CI/release workflows via `npm run audit:runtime` (`npm audit --omit=dev`).
- Runtime dependency audit currently passes with `0` vulnerabilities.
- Additional `v0.9.x` hardening tasks are now tracked:
  - deterministic malformed query/decode failure mapping to `invalid_query_string`
  - explicit canonical validation for `page[size]` / `page[number]` with `page_parameter_invalid`
  - CI supply-chain and workflow-permissions hardening gates

## Immediate next steps

- Execute `v1.0.0` readiness package:
  - execute final release flow checks (`release:check`, version/tag alignment workflow)
  - execute external pre/post publish smoke runs for target GA version and record results
  - finalize GA evidence block with concrete release commit/tag/publish outcomes
  - use installed-harness resolution path when root harness directory is initially empty
  - post-publish smoke remains pending until publish step is executed for target GA version
- Keep version line on `0.x` until all pre-GA checklist topics are closed.
