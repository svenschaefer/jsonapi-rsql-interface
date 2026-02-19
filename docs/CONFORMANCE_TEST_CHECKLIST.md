# Conformance Test Checklist

This checklist defines conformance tests that must pass to claim compliance with the security invariants for `jsonapi-rsql-interface`.

Each item should be implemented as an automated test. Tests must be deterministic and must assert both:
- the returned error code (and status)
- the absence of forbidden information in error detail/meta

## Test Conventions

- All tests treat all query parameters as untrusted user input.
- All tests run the same canonical pipeline entrypoint.
- Tests must validate that compilation never emits raw SQL with embedded user literals.
- Tests must validate that forbidden behaviors are rejected, not ignored.

## Invariant 1 - SQL Injection Resistance

1.1 Unknown field as identifier
- Input: `filter=doesNotExist==1`
- Expect: `unknown_field` (or `field_not_allowed`)
- Assert: no SQL identifiers derived from `doesNotExist`

1.2 Identifier injection attempt
- Input: `filter=name==x"); DROP TABLE users; --`
- Expect: `value_type_mismatch` or `invalid_filter_syntax` depending on grammar
- Assert: no compiled fragment contains `DROP`, `TABLE`, `--`, or unescaped quotes

1.3 Operator injection attempt
- Input: use a token that tries to escape operator context
- Expect: `invalid_filter_syntax` or `operator_not_allowed`
- Assert: operator is selected only from enum allowlist

1.4 Value parameterization
- Input: `filter=name=="abc"`
- Expect: compilation succeeds
- Assert: execution layer receives value via bindings (no literal in SQL fragment)

## Invariant 2 - Complexity Limits / DoS

2.1 Max query string length
- Input: query length > limit
- Expect: `filter_complexity_exceeded` (or `invalid_query_string`)

2.2 Max literal length
- Input: `filter=name=="<very long>"`
- Expect: `filter_complexity_exceeded`

2.3 Max AST depth
- Input: deeply nested parentheses exceeding limit
- Expect: `filter_complexity_exceeded`

2.4 Max AST nodes
- Input: expression with many clauses exceeding node count
- Expect: `filter_complexity_exceeded`

2.5 Max `=in=` list size
- Input: `filter=id=in=(...)` exceeding list limit
- Expect: `filter_complexity_exceeded` (or `in_list_too_large` if you introduce a dedicated code)

## Invariant 3 - Authorization Integrity

3.1 Filter field not allowed
- Configure a resource where `email` is not filterable
- Input: `filter=email=="a@b.c"`
- Expect: `field_not_allowed`

3.2 Sort field not allowed
- Configure a resource where `created` is not sortable
- Input: `sort=-created`
- Expect: `sort_not_allowed`

3.3 Sparse fields not allowed
- Configure `fields[type]` allowlist without `secret`
- Input: `fields[users]=id,secret`
- Expect: `fields_not_allowed` (or `field_not_allowed`)

3.4 Include not allowed
- Configure relationship `memberships` as not includable
- Input: `include=memberships`
- Expect: `include_not_allowed`

3.5 Deny-by-default
- Configure an empty allowlist
- Input: any of filter/sort/fields/include
- Expect: deterministic denial code, not silent ignore

## Invariant 4 - Canonical Parsing and Strict Typing

4.1 Integer strict parsing
- Field type: `int`
- Inputs rejected: `01` if disallowed, `1.0`, `1e3`, `+1` if disallowed by policy
- Expect: `value_type_mismatch`

4.2 Float strict parsing
- Field type: `float`
- Input: `1e-3`
- Expect: `value_type_mismatch` (v1 policy)

4.3 Boolean strict parsing
- Field type: `bool`
- Inputs accepted: `true`, `false` (exact)
- Inputs rejected: `1`, `0`, `TRUE`
- Expect: `value_type_mismatch`

4.4 Date strict parsing
- Field type: `date`
- Accept: `YYYY-MM-DD`
- Reject: locale variants
- Expect: `value_type_mismatch`

4.5 Datetime normalization
- Field type: `datetime`
- Input: `2026-02-19T10:00:00+02:00`
- Expect: normalized instant used internally
- Assert: normalized representation is stable (UTC) and does not depend on runtime locale

4.6 Enum strict matching
- Field type: `enum`
- Input: wrong case
- Expect: `value_type_mismatch` (case-sensitive baseline)

4.7 Empty `=in=` list
- Input: `filter=status=in=()`
- Expect: `empty_in_list_not_allowed`

## Invariant 5 - Error Hygiene

5.1 No schema leakage
- For any rejection, assert:
  - no DB table/column names
  - no SQL fragments
  - no stack traces
  - no internal file paths
- Expect: stable code + safe detail

5.2 Controlled literal echo
- Default diagnostics off:
  - ensure rejected values are not echoed verbatim
- Diagnostics on (if supported):
  - ensure literals only appear under constrained meta keys

## Invariant 6 - Tenant Isolation

6.1 Missing security predicate
- Attempt compilation without providing required tenant/org scope input
- Expect: `security_predicate_required`

6.2 User tries to negate scope
- Ensure no user field can represent the injected predicate
- Input: attempt to filter on `tenant_id` when it is not allowlisted
- Expect: `field_not_allowed`

6.3 Mandatory predicate always ANDed
- Provide a user filter that would otherwise select cross-tenant rows
- Assert: compiled plan always contains mandatory predicate in addition to user filter

## Invariant 7 - Policy Stability

7.1 Forbidden behaviors remain forbidden
- Relationship path filtering in v1:
  - Input: `filter=group.name==x`
  - Expect: `invalid_filter_syntax` or `unknown_field` (depending on grammar), but never compilation success

7.2 Unknown operator remains forbidden
- Input: use unsupported operator token
- Expect: `operator_not_allowed` or `invalid_filter_syntax`

7.3 Limit relaxations require test updates
- Increasing max list size, depth, nodes must be accompanied by explicit test changes
- Add a "limit boundary" test per limit (limit-1 passes, limit+1 fails)

## Minimum Coverage Gate

A release is conformant only if:
- All checklist items are implemented as automated tests, and
- At least one test exists per invariant that asserts both:
  - correct deterministic error code, and
  - absence of forbidden leakage.
