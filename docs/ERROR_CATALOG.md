# Error Catalog

Machine-readable baseline error catalog for `jsonapi-rsql-interface`.

This catalog defines stable `code -> status -> title` mappings that are treated as contract surface.

## Baseline Codes

| code | status | title |
|---|---:|---|
| `invalid_query_string` | `400` | Invalid query string |
| `invalid_filter_syntax` | `400` | Invalid filter syntax |
| `filter_complexity_exceeded` | `400` | Filter complexity exceeded |
| `unknown_field` | `400` | Unknown field |
| `field_not_allowed` | `400` | Field not allowed |
| `operator_not_allowed` | `400` | Operator not allowed |
| `value_type_mismatch` | `400` | Value type mismatch |
| `wildcard_not_allowed` | `400` | Wildcard not allowed |
| `wildcard_operator_not_allowed` | `400` | Wildcard operator not allowed |
| `wildcard_type_not_supported` | `400` | Wildcard type not supported |
| `invalid_wildcard_pattern` | `400` | Invalid wildcard pattern |
| `empty_in_list_not_allowed` | `400` | Empty in-list is not allowed |
| `sort_not_allowed` | `400` | Sort not allowed |
| `include_not_allowed` | `400` | Include not allowed |
| `fields_not_allowed` | `400` | Fields not allowed |
| `page_parameter_invalid` | `400` | Invalid page parameter |
| `security_predicate_required` | `500` | Security predicate required |
| `internal_error` | `500` | Internal compilation error |

## Serialization Rules

- Internal status handling may remain numeric.
- JSON:API serialization must emit `status` as a string.

## Contract Notes

- Error `code` is compatibility-critical and must be contract-tested.
- When diagnostic richness is needed, prefer `meta` fields over creating unstable, overly-specific new codes.
