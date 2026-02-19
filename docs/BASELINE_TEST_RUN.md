# Baseline Test Run

Purpose: define a stable end-to-end verification baseline.

## Verify Stable Invariants

- API/CLI wiring works end-to-end.
- Rejected paths do not produce partial/invalid plan envelopes.
- Required plan metadata fields are present.
- Exit codes follow contract (`0` success, non-zero failure).

## Do Not Over-Constrain Surfaces

Avoid hard-locking incidental ordering/formatting not declared as contract.

## Suggested Run Checklist

- `npm test`
- `npm run pack:check`
- `npm run smoke:release`
