# Migration Guide: `0.x` -> `1.0.0`

`0.x` was pre-GA and allowed contract evolution.
`1.0.0` is the first stable compatibility contract baseline.

## What Changes in `1.0.0`

- Stability guarantee is now formalized for:
  - public API surface (`compileRequest`, `compileRequestSafe`)
  - deterministic error code namespace
  - documented semantic baselines in `README.md` and invariant docs
- Governance expectations become release-level requirements:
  - evidence tracked in `docs/RELEASE_EVIDENCE.md`
  - compatibility policy tracked in `docs/COMPATIBILITY_POLICY.md`

## Breaking-Change Expectation

- Any behavior not explicitly documented as stable in `0.x` must be treated as potentially changed.
- Starting at `1.0.0`, compatibility changes follow semver policy and documented migration notes.

## Recommended Upgrade Steps

1. Ensure integrations use only documented API/error contracts.
2. Run existing integration tests against latest `0.x` and `1.0.0`.
3. Verify policy artifacts against current security/performance invariants.
4. Execute pre/post publish smoke checks using the external harness if you operate release pipelines.

