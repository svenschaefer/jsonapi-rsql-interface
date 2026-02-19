const { throwCompilationError } = require("../errors");

const DEFAULT_SENSITIVE_PATTERNS = [
  "password",
  "password_hash",
  "secret",
  "api_key",
  "access_token",
  "refresh_token"
];
const WRITE_POLICY_KEYS = ["writable", "writeable", "updatable", "mutable", "createable"];

function shouldValidate(policy) {
  return Boolean(policy && policy.security && policy.security.validate_artifacts === true);
}

function getSensitivePatterns(policy) {
  const configured =
    policy &&
    policy.security &&
    Array.isArray(policy.security.sensitive_field_deny_patterns) &&
    policy.security.sensitive_field_deny_patterns.length > 0
      ? policy.security.sensitive_field_deny_patterns
      : DEFAULT_SENSITIVE_PATTERNS;
  return configured.map((p) => String(p).toLowerCase());
}

function useNameHeuristics(policy) {
  return !(policy && policy.security && policy.security.use_name_heuristics === false);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fieldNameLooksSensitive(fieldName, patterns) {
  const lower = String(fieldName).toLowerCase();
  return patterns.some((pattern) => {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(pattern)}([^a-z0-9]|$)`);
    return re.test(lower);
  });
}

function validatePolicySecurityArtifacts(policy) {
  if (!shouldValidate(policy)) return;
  const fields = (policy && policy.fields) || {};
  const patterns = getSensitivePatterns(policy);

  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    if (!fieldDef || typeof fieldDef !== "object") continue;

    for (const writeKey of WRITE_POLICY_KEYS) {
      if (Object.prototype.hasOwnProperty.call(fieldDef, writeKey)) {
        throwCompilationError(
          "field_not_allowed",
          `Write-policy flag is not allowed in read/query policy artifacts: ${fieldName}.${writeKey}.`,
          { parameter: "policy" },
          { field: fieldName, key: writeKey }
        );
      }
    }

    const explicitlySensitive = fieldDef.sensitive === true;
    const sensitiveByName = useNameHeuristics(policy) && fieldNameLooksSensitive(fieldName, patterns);
    if ((explicitlySensitive || sensitiveByName) &&
        (fieldDef.filterable === true || fieldDef.selectable === true || fieldDef.sortable === true)) {
      throwCompilationError(
        "field_not_allowed",
        `Sensitive field exposure is blocked by policy validation: ${fieldName}.`,
        { parameter: "policy" },
        { field: fieldName, category: "sensitive_field" }
      );
    }
  }
}

function useHardenedFieldErrors(policy) {
  return Boolean(policy && policy.security && policy.security.hardened_mode === true);
}

module.exports = {
  useHardenedFieldErrors,
  validatePolicySecurityArtifacts
};
