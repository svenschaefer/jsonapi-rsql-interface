# Developer Tooling (Non-Public)

This document describes repository development tooling only.
It is not part of the package compatibility contract.

## Scope

These scripts are for local quality analysis and CI hygiene:

- `npm run dev:check`
- `npm run dev:report:metrics`
- `npm run dev:report:maturity`

## Contract Boundary

Public/stable interfaces are the package exports in `package.json`.
`npm run dev:*` scripts are internal workflow tooling and may evolve between releases.
