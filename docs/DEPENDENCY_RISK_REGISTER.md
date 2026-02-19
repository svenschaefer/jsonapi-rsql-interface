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

## Update Rules

- Update this file whenever audit posture, accepted risks, or remediation decisions change.
- Each GA/patch release should reference current disposition in release evidence.

