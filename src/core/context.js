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
  const predicate = (context && context.security_predicate) || {};
  const safeContext = {
    tenant_context_present: Boolean(context && context.tenant_context_present === true),
    security_predicate: {
      field: String(predicate.field || ""),
      operator: String(predicate.operator || ""),
      bound_parameter_key: String(predicate.bound_parameter_key || "")
    },
    auth_context_hash: String((context && context.auth_context_hash) || "")
  };

  return stableStringify(safeContext);
}

function createPlanCacheKey(policyVersion, contextFingerprint, normalizedQueryKey) {
  return stableStringify([
    String(policyVersion || ""),
    String(contextFingerprint || ""),
    String(normalizedQueryKey || "")
  ]);
}

module.exports = {
  createContextFingerprint,
  createPlanCacheKey
};
