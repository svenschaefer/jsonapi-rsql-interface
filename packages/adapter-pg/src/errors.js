class AdapterError extends Error {
  constructor(code, status, title, detail, meta) {
    super(detail || title || code);
    this.name = "AdapterError";
    this.code = code;
    this.status = Number(status);
    this.title = title;
    if (detail !== undefined) this.detail = detail;
    if (meta !== undefined) this.meta = meta;
  }

  toJSON() {
    const payload = {
      code: this.code,
      status: String(this.status),
      title: this.title
    };
    if (this.detail !== undefined) payload.detail = this.detail;
    if (this.meta !== undefined) payload.meta = this.meta;
    return payload;
  }
}

const ADAPTER_ERROR_CATALOG = Object.freeze({
  pg_invalid_plan_shape: { status: 400, title: "Invalid query plan shape" },
  pg_invalid_mapping_shape: { status: 500, title: "Invalid adapter mapping" },
  pg_mapping_missing: { status: 500, title: "Required mapping is missing" },
  pg_operator_not_supported: { status: 400, title: "Operator is not supported by adapter" },
  pg_feature_not_supported: { status: 400, title: "Feature is not supported by adapter" },
  pg_security_predicate_required: { status: 500, title: "Security predicate is required" },
  pg_fragment_invalid: { status: 400, title: "Invalid SQL fragment" },
  pg_limits_exceeded: { status: 400, title: "Adapter limits exceeded" }
});

function throwAdapterError(code, detail, meta) {
  const entry = ADAPTER_ERROR_CATALOG[code] || {
    status: 500,
    title: "Adapter error"
  };
  throw new AdapterError(code, entry.status, entry.title, detail, meta);
}

module.exports = {
  AdapterError,
  ADAPTER_ERROR_CATALOG,
  throwAdapterError
};
