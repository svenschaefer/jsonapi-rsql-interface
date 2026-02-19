# Compatibility Policy

This project is treated as protocol/compiler infrastructure. Compatibility is governed explicitly.

## Contract Surface

The following are compatibility-critical:

- error `code` namespace and semantics
- operator/type semantics
- default policy behaviors that affect acceptance/rejection
- plan metadata fields required by downstream integrations

## Versioning

- `v0.x`: breaking changes allowed while contract is being finalized.
- `v1.x`: stable contract line; breaking changes require major version bump.

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
