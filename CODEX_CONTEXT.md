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
- `docs/ERROR_CATALOG.md`
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
- Active roadmap cycle: `v0.2.0` (core pipeline + v1 semantic core).
- CI baseline currently green via `npm run ci:check`.

## 6) Decision Baselines (Must Hold)

- Relationship-path filtering is out of v1 scope.
- Include handling in v1 is allowlist + pass-through (no join compilation).
- Error codes are compatibility contract and should be stabilized per scenario.
- Security predicates are server-injected and mandatory.
- Duplicate query parameters are rejected in baseline behavior.
- Empty `=in=()` / `=out=()` is rejected.

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

## 9) Known Follow-up

- Dependency tree reported vulnerabilities during initial install (dev-tooling path).
- Track and remediate before public release (`v1.0.0` gate).
