# jsonapi-rsql-interface-pg – Security and Performance Constraints (Final)

This document captures the complete, consolidated list of security and performance concerns discussed for the `jsonapi-rsql-interface-pg` adapter, together with the locked answer/decision for each point.
These constraints are binding for `v1.2.x` implementation.

---

## Security Constraints

### 1. Placeholder collision / renumbering safety
Concern: Confusion, collisions, or gaps in `$n` placeholders across fragments.
Decision:
- Strict placeholder validation.
- Deterministic contiguous renumbering to `$1..$n` in final left-to-right order.
- Reject gaps, duplicates, invalid tokens, or non-canonical forms deterministically.

---

### 2. Fragment boundary injection
Concern: SQL injection via free-form or malformed fragments.
Decision:
- Accept only structured fragments `{ text, values }`.
- Strict shape and type validation.
- Reject unknown keys or unsupported fragment shapes deterministically.
- No raw SQL strings accepted from callers.

---

### 3. Trusted-config integrity
Concern: Mapping/config drift or runtime tampering.
Decision:
- Treat mappings as security artifacts.
- Versioned and code-reviewed.
- Validated at startup.
- Atomic reload only (old-or-new visibility).
- Fail-closed on invalid mappings.

---

### 4. Expression blast radius
Concern: Arbitrary SQL execution via expressions.
Decision:
- Expressions allowed only via explicit `{ kind: "expression" }`.
- Per-field allowlist required.
- Trusted-admin/static config only.
- Optional `expression_id` meta for audit.
- Never emit expression SQL text in outputs or errors.

---

### 5. Error / meta leakage
Concern: Leaking SQL internals or mapping details.
Decision:
- Stable, code-based adapter errors only.
- No raw SQL, no table/column names, no expression SQL, no stack traces.
- Minimal, safe `meta` only.

---

### 6. Resource exhaustion at adapter layer
Concern: Malicious-but-valid plans causing excessive SQL assembly cost.
Decision:
- Adapter-side caps enforced independently of core:
  - Max predicates/clauses
  - Max selected columns
  - Max ORDER BY keys
  - Max SQL text length
- Deterministic failure on exceed.

---

### 7. Cache contamination (adapter cache)
Concern: Cross-tenant or cross-policy cache poisoning.
Decision:
- Cache keys must include:
  - `policy_version`
  - tenant/security context fingerprint
  - mapping version or hash
  - adapter version
- Never key cache on plan text alone.

---

### 8. Unicode / confusable identifiers
Concern: Lookalike identifiers bypassing policy.
Decision:
- Default strict ASCII-only or token whitelist grammar.
- Reject confusables and non-ASCII unless explicitly allowed.
- Deterministic normalization and documentation required.

---

### 9. Operator-to-SQL mapping integrity
Concern: SQL behavior drift or injection via config-defined operators.
Decision:
- Operator -> SQL mapping is adapter-code-owned and closed.
- Mapping may enable/disable operators per field only.
- Mapping cannot define SQL operator text or templates.
- Unsupported operators rejected deterministically.

---

### 10. SQL dialect / feature pinning
Concern: Silent semantic drift across PostgreSQL versions.
Decision:
- Pin a PostgreSQL feature subset per adapter version.
- Reject plan/mapping combinations requiring unpinned features.
- No silent fallback to alternative SQL forms.

---

## Performance Constraints

### 1. Placeholder renumbering complexity
Concern: Quadratic behavior from repeated rescans.
Decision:
- Single-pass O(n) deterministic scanner for renumbering.
- No repeated global regex rescans.

---

### 2. String assembly strategy
Concern: Quadratic string concatenation cost.
Decision:
- Assemble SQL via array parts + `join`.
- Avoid repeated `+=` concatenation.

---

### 3. Bounded assembly inputs
Concern: Oversized inputs causing memory/CPU spikes.
Decision:
- Pre-assembly caps on:
  - Fragment count
  - Per-fragment text length
  - Per-fragment values length
- Fail fast, deterministically.

---

### 4. Deterministic fragment normalization
Concern: Formatting overhead and cache instability.
Decision:
- Either no normalization, or exactly one minimal deterministic pass.
- No repeated formatting passes.

---

### 5. ORDER BY / SELECT lookup cost
Concern: Repeated linear scans per request.
Decision:
- Precompute field->SQL resolution maps at mapping load.
- O(1) lookups at runtime.

---

### 6. Expression mapping cost
Concern: Re-validating expensive expressions per request.
Decision:
- Validate expression mappings once at startup or reload.
- Per-request use lookup only.

---

### 7. Output size controls
Concern: Excessive SQL text or parameter arrays.
Decision:
- Cap final SQL text length.
- Cap total bound values count.
- Deterministic failure when exceeded.

---

### 8. Cache-key computation cost
Concern: Large keys and memory pressure.
Decision:
- Use canonical tuple + hash for cache keys.
- Avoid raw plan-derived strings as keys.

---

### 9. Hot-path object allocation discipline
Concern: GC pressure under load.
Decision:
- Allocation-light compile/assemble paths.
- No deep cloning of plans, mappings, or fragments.
- Index-based iteration.
- Bounded, short-lived intermediates only.
- Emit exactly one final `{ text, values }` object per call.

---

## Status

All items above are locked decisions and define the security and performance boundary of `jsonapi-rsql-interface-pg` for `v1.2.x`.

