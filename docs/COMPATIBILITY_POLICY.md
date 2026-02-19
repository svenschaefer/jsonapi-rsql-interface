# Compatibility Policy

This project is treated as protocol/compiler infrastructure. Compatibility is governed explicitly.

## Contract Surface

The following are compatibility-critical:

- error `code` namespace and semantics
- operator/type semantics
- default policy behaviors that affect acceptance/rejection
- plan metadata fields required by downstream integrations
- RSQL compatibility target and documented divergence behavior

## Versioning

- `v0.x`: breaking changes allowed while contract is being finalized.
- `v1.x`: stable contract line; breaking changes require major version bump.

## RSQL Compatibility Position

- Core position: `jsonapi-rsql-interface` targets an RSQL-compatible core for filter grammar and operator semantics.
- Intentional divergence: wildcard matching is an explicit extension capability and is not implicit `==` behavior.
- Version gating:
  - `v1.0.x` baseline: wildcard extension is not enabled by default contract.
  - later `v1.x`: wildcard extension may be introduced explicitly with documented policy/plan semantics.
- Boundary rule: this package owns parse/validate/compile contract; execution behavior belongs to adapter packages (for example `@jsonapi-rsql/pg`).

## Breaking-Change Process

Any semantic breaking change requires:

1. explicit proposal/review
2. migration notes
3. contract test updates
4. changelog entry

## Deprecation Policy

- prefer additive changes first
- deprecate with clear migration path
- remove only in coordinated major release windows
