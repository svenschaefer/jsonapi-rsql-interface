class CompilationError extends Error {
  constructor(code, status, title, detail, source, meta) {
    super(detail || title || code);
    this.name = "CompilationError";
    this.code = code;
    this.status = Number(status);
    this.title = title;
    if (detail !== undefined) this.detail = detail;
    if (source !== undefined) this.source = source;
    if (meta !== undefined) this.meta = meta;
  }

  toJSON() {
    const payload = {
      code: this.code,
      status: String(this.status),
      title: this.title
    };
    if (this.detail !== undefined) payload.detail = this.detail;
    if (this.source !== undefined) payload.source = this.source;
    if (this.meta !== undefined) payload.meta = this.meta;
    return payload;
  }
}

const ERROR_CATALOG = Object.freeze({
  invalid_query_string: { status: 400, title: "Invalid query string" },
  invalid_filter_syntax: { status: 400, title: "Invalid filter syntax" },
  filter_complexity_exceeded: { status: 400, title: "Filter complexity exceeded" },
  unknown_field: { status: 400, title: "Unknown field" },
  field_not_allowed: { status: 400, title: "Field not allowed" },
  operator_not_allowed: { status: 400, title: "Operator not allowed" },
  value_type_mismatch: { status: 400, title: "Value type mismatch" },
  empty_in_list_not_allowed: { status: 400, title: "Empty in-list is not allowed" },
  sort_not_allowed: { status: 400, title: "Sort not allowed" },
  include_not_allowed: { status: 400, title: "Include not allowed" },
  fields_not_allowed: { status: 400, title: "Fields not allowed" },
  page_parameter_invalid: { status: 400, title: "Invalid page parameter" },
  security_predicate_required: { status: 500, title: "Security predicate required" },
  internal_error: { status: 500, title: "Internal compilation error" }
});

function throwCompilationError(code, detail, source, meta) {
  const entry = ERROR_CATALOG[code] || { status: 500, title: "Compilation error" };
  throw new CompilationError(code, entry.status, entry.title, detail, source, meta);
}

module.exports = {
  CompilationError,
  ERROR_CATALOG,
  throwCompilationError
};
