# Dependency Risk Register

Tracks dependency security posture for pre-GA and release decisions.

## Scope

- Runtime dependency risk (release blocker).
- Dev/test/tooling dependency risk (tracked with explicit acceptance/remediation plan).

## Current Entry (`v0.9.x`)

- Runtime dependencies:
  - Status: no runtime dependency vulnerabilities expected (`npm audit --omit=dev` gate in CI/release workflows).
  - Gate: fail release workflow on any runtime vulnerability.
- Dev/tooling dependencies:
  - Status: known advisories may exist in lint/tooling chain.
  - Tracking rule:
    - remediate non-breaking updates when available
    - document explicit risk acceptance if residual advisories remain pre-GA

## Audit Snapshot (`2026-02-19`)

- Runtime audit (`npm audit --omit=dev --json`):
  - vulnerabilities: `0`
  - disposition: pass (release-blocking gate remains enabled)
- Full tree audit (`npm audit --json`):
  - vulnerabilities: `6` (`4` high, `2` moderate)
  - affected chain: eslint dev-tooling stack
  - disposition: accepted as dev-only pre-GA residual risk, tracked until compatible remediation path is available

## Update Rules

- Update this file whenever audit posture, accepted risks, or remediation decisions change.
- Each GA/patch release should reference current disposition in release evidence.

## Disposition Policy (Deterministic, Expiry-Bounded)

- Runtime dependency advisories (`npm audit --omit=dev`) are release-blocking and have no exception path.
- Dev/tooling advisories can be temporarily accepted only with:
  - explicit advisory scope (package chain + severity),
  - justification,
  - owner,
  - expiry date.
- Expired dispositions are treated as failed governance state until renewed or remediated.

## Current Accepted Dispositions

| Scope | Class | Owner | Expires | Status | Notes |
|---|---|---|---|---|---|
| Dev/tooling (`eslint` chain) | `4 high`, `2 moderate` | Maintainers | 2026-06-30 | Active | Tracked residual risk; runtime gate remains zero-tolerance |
