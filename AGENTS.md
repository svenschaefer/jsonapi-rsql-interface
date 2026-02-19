# AGENTS.md

Repository constraints for `jsonapi-rsql-interface`:

- Language/runtime: JavaScript (CommonJS), Node.js `>=20`.
- Architecture: compiler-style boundary component, not app/business SDK.
- Canonical pipeline: `parse -> normalize -> type-check -> policy-check -> compile`.
- Determinism: identical input + policy + context must yield identical plan/error envelopes within a version.
- Security posture: deny-by-default policy evaluation and mandatory server-injected security predicates.
- Error contract: stable code-based errors are part of public compatibility surface.
- Performance posture: enforce hard limits and deterministic canonicalization before expensive work.

Public API contract baseline:

1) `compileRequest(input)`
- Accepts structured input (`query` or `raw_query`, `policy`, `context`).
- Returns deterministic query plan on success.

2) `compileRequestSafe(input)`
- Same input contract.
- Returns `{ ok: true, plan }` or `{ ok: false, errors }` with deterministic error codes.

Tooling layer:

- CLI is a thin wrapper over the API and must not alter core semantics.
- Validation/tooling helpers must not mutate compiled plan semantics.

Change discipline:

- Any semantic expansion (operators/types/limits/include behavior) requires tests and docs updates.
- Security/performance invariants and conformance checklists are release-blocking references.
