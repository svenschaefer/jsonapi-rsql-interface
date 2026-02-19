# Guarantees

This file defines core behavior guarantees for `jsonapi-rsql-interface`.

## Core Guarantees

- Deterministic behavior:
  - identical input + policy + context produce identical plan/error envelopes within the same version.
- Fail-fast validation:
  - malformed input and policy violations are rejected explicitly.
- Clear authority boundary:
  - user query input is untrusted; policy and server-injected security context are authoritative.
- Stable error surface:
  - validation/policy failures use stable error codes suitable for branching.

## Non-Goals

- hidden retries
- silent auto-repair of invalid input
- implicit execution-layer behavior
- undocumented public API surfaces

## Design Rule

Prefer small, explicit mechanics over broad abstractions.
If behavior is important, make it contract-tested.
