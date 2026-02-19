# CODEX_CONTEXT

This file captures repository context that should remain visible to coding agents and maintainers.

## 1) Project Identity

- Name: `jsonapi-rsql-interface`
- Form: npm package with JavaScript API surface.
- Nature: compiler-style infrastructure API (not app API, not SDK, not ORM, not DB client).
- Role: deterministic boundary between JSON:API + RSQL/FIQL query input and governed query-plan output.

## 2) Public API Intent

- Canonical API entrypoints:
  - `compileRequest(input)`
  - `compileRequestSafe(input)`
- Expected input model:
  - query input (`raw_query` or structured `query`)
  - policy artifact
  - server security context
- Expected output model:
  - deterministic query plan envelope
  - or deterministic machine-readable error envelope

## 3) Canonical Pipeline

Required processing order:

`parse -> normalize -> type-check -> policy-check -> compile`

No shortcut path should bypass validation/policy checks.

## 4) Contract and Invariant Sources

Core specification and governance docs:

- `README.md` (project scope + v1 normative spec)
- `docs/SECURITY_INVARIANTS.md`
- `docs/PERFORMANCE_INVARIANTS.md`
- `docs/CONFORMANCE_TEST_CHECKLIST.md`
- `docs/TEST_REQUIREMENTS.md`
- `docs/ERROR_CATALOG.md`
- `docs/COMPATIBILITY_POLICY.md`
- `docs/RELEASE_EVIDENCE.md`
- `TODO.md`
- `ROADMAP.md`

Operational/process docs:

- `docs/OPERATIONAL.md`
- `docs/REPO_WORKFLOWS.md`
- `docs/NPM_RELEASE.md`
- `docs/DEV_TOOLING.md`
- `docs/GUARANTEES.md`
- `docs/BASELINE_TEST_RUN.md`
- `docs/STATUSQUO.md`

Repository-level standards:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `LICENSE`

## 5) Current Delivery State

- Baseline scaffold is implemented (`v0.1.x` complete).
- Completed cycles: `v0.2.0` through `v0.8.0` (semantic core, error contract, security/performance/cache/context/conformance/governance baselines).
- Completed pre-GA closure cycles: `v0.9.1` through `v0.9.8` (deep hardening, governance/tooling robustness, final `0.x` readiness closure).
- Active roadmap cycle: `v1.1.x` (post-GA wildcard semantics).
- CI baseline currently green via `npm run ci:check`.
- Package metadata is now set to release target version `1.0.0` (pre-publish state).

## 6) Decision Baselines (Must Hold)

- Relationship-path filtering is out of v1 scope.
- Include handling in v1 is allowlist + pass-through (no join compilation).
- Error codes are compatibility contract and should be stabilized per scenario.
- Security predicates are server-injected and mandatory.
- Duplicate query parameters are rejected in baseline behavior.
- Empty `=in=()` / `=out=()` is rejected.
- Compatibility framing baseline:
  - RSQL is a compatibility target for the filter core.
  - JSON:API is a compatibility target for query parameters only (not full server/spec compliance).
  - Execution semantics are adapter territory (for example `@jsonapi-rsql/pg`), not core interface behavior.
  - Post-GA wildcard extension (`v1.1.x`) is policy-gated and opt-in only.

## 7) Working Conventions for Agents

- Treat query input as untrusted; policy/context are authoritative.
- Prefer deterministic behavior over convenience behavior.
- When behavior changes, update:
  - implementation
  - tests
  - docs that define the contract
- Keep markdown placement conventional:
  - root: repository meta docs
  - `docs/`: specifications, operational/process, checklists

## 8) Validation Commands

- `npm test`
- `npm run ci:check`
- `npm run smoke:release`
- `npm run smoke:external:prepare -- --version <x.y.z> --phase all --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test`
- `npm run smoke:external:bootstrap -- --phase <pre|post> --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test"`
- `npm run smoke:external -- --phase <pre|post> --version <x.y.z> [--timestamp <YYYYMMDDTHHMMSSZ>] --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface` (release-time external harness)
- `npm run smoke:external:prepublish -- --version <x.y.z> [--timestamp <YYYYMMDDTHHMMSSZ>] --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface`

## 9) Known Follow-up

- `npm audit` still reports residual dev-toolchain advisories (eslint dependency chain).
- Runtime dependency posture is zero-vulnerability gate (`npm audit --omit=dev`) and currently passing.
- Dev-only advisory disposition is explicitly documented with owner/expiry in `docs/DEPENDENCY_RISK_REGISTER.md` and must be renewed or remediated before expiry.
- `v0.9.x` pre-GA hardening also includes:
  - deterministic malformed query/decode failure handling to canonical `invalid_query_string`
  - explicit canonical validation for `page[size]` / `page[number]` with `page_parameter_invalid`
  - CI supply-chain and workflow least-privilege hardening gates (implemented baseline)
- Deep-review hardening backlog is scheduled in `ROADMAP.md` as:
  - `v0.9.4` filter/parser semantic correctness hardening
  - `v0.9.5` canonicalization/cache/safe-API hardening
  - `v0.9.6` governance/tooling robustness hardening
- Safe API baseline now includes deterministic fallback:
  - unexpected internal failures in `compileRequestSafe` map to stable `internal_error`.
- `v1.0.0` release flow now includes external versioned smoke runs via:
  - `C:\code\jsonapi-rsql-interface-smoke-test` (pre-publish + post-publish).
- External smoke runner resolution rule:
  - if harness root has no `package.json`, resolve and execute from installed harness package under `<harness-dir>/<timestamp>-<phase>-<version>/node_modules`.
- External smoke runner artifact contract:
  - pre-phase enforces `--package-source` presence and file existence before install
  - runner verifies installed package runtime surface and emits:
    - `installed_from`
    - `resolved_package_dir`
    - `resolved_entrypoint`
- Current release state:
  - `jsonapi-rsql-interface@1.0.0` is published
  - external pre/post publish smoke evidence is captured in `docs/RELEASE_EVIDENCE.md`
