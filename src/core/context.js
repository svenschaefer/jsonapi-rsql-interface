function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  if (!value || typeof value !== "object") {
    return JSON.stringify(value);
  }
  const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
  const pairs = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`);
  return `{${pairs.join(",")}}`;
}

function createContextFingerprint(context) {
  const safeContext = {
    tenant_context_present: Boolean(context && context.tenant_context_present === true),
    security_predicate: {
      field: String(context && context.security_predicate && context.security_predicate.field),
      operator: String(context && context.security_predicate && context.security_predicate.operator),
      bound_parameter_key: String(
        (context && context.security_predicate && context.security_predicate.bound_parameter_key) || ""
      )
    },
    auth_context_hash: String((context && context.auth_context_hash) || "")
  };

  return stableStringify(safeContext);
}

function createPlanCacheKey(policyVersion, contextFingerprint, normalizedQueryKey) {
  return `${policyVersion}|${contextFingerprint}|${normalizedQueryKey}`;
}

module.exports = {
  createContextFingerprint,
  createPlanCacheKey
};
