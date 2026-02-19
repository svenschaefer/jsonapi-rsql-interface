const { CompilationError, throwCompilationError } = require("../errors");
const { parseQueryString } = require("./parse");
const { normalizeQuery } = require("./normalize");
const { parseFilterExpression } = require("./filter");
const { createNormalizedQueryKey } = require("./cache-key");
const { createContextFingerprint, createPlanCacheKey } = require("./context");
const { validatePolicySecurityArtifacts } = require("./security");
const {
  enforceDuplicatePolicy,
  enforceFieldsAllowlist,
  enforceFieldSelectionLimits,
  enforceFilterComplexityLimits,
  enforceFilterLiteralLength,
  enforceIncludeAllowlist,
  enforceIncludeLimits,
  enforceInListSize,
  enforcePageParameters,
  enforceParameterSurfaceLimits,
  enforceRawParameterPairEstimate,
  enforceRootFieldFilterScope,
  enforceSecurityPredicate,
  enforceSortAllowlist,
  enforceSortLimits,
  enforceStringLimits,
  typeCheckFilterClauses
} = require("./policy");
const { compilePlan } = require("./compile");

function ensureObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throwCompilationError(
      "invalid_query_string",
      `${label} must be an object.`,
      { parameter: "query" },
      { input_shape: label }
    );
  }
}

function compileRequest(input) {
  const startedAt = Date.now();
  ensureObject(input, "compileRequest input");
  ensureObject(input.policy || {}, "input.policy");
  ensureObject(input.context || {}, "input.context");

  const rawQuery = typeof input.raw_query === "string" ? input.raw_query : "";
  const queryObject = input.query && typeof input.query === "object" ? input.query : null;
  const limits = (input.policy && input.policy.limits) || {};

  validatePolicySecurityArtifacts(input.policy);
  if (!queryObject) {
    enforceStringLimits(rawQuery, limits);
    enforceRawParameterPairEstimate(rawQuery, limits);
  }
  const params = queryObject || parseQueryString(rawQuery);
  enforceParameterSurfaceLimits(params, limits);
  enforceDuplicatePolicy(params);
  enforceSecurityPredicate(input.context);
  const page = enforcePageParameters(params, limits);

  const normalizedQuery = normalizeQuery(params);
  const normalizedQueryKey = createNormalizedQueryKey(normalizedQuery);
  const contextFingerprint = createContextFingerprint(input.context);
  const policyVersion = String((input.policy && input.policy.version) || "v0");
  const planCacheKey = createPlanCacheKey(policyVersion, contextFingerprint, normalizedQueryKey);
  const filterParse = parseFilterExpression(normalizedQuery.filter || "");

  enforceRootFieldFilterScope(filterParse.clauses);
  enforceFilterLiteralLength(normalizedQuery.filter || "", limits);
  enforceFilterComplexityLimits(filterParse.complexity, limits);
  enforceInListSize(filterParse.clauses, limits);
  enforceIncludeLimits(Array.isArray(normalizedQuery.include) ? normalizedQuery.include : [], limits);
  enforceSortLimits(Array.isArray(normalizedQuery.sort) ? normalizedQuery.sort : [], limits);
  enforceFieldSelectionLimits(normalizedQuery, limits);
  enforceIncludeAllowlist(Array.isArray(normalizedQuery.include) ? normalizedQuery.include : [], input.policy);
  enforceSortAllowlist(Array.isArray(normalizedQuery.sort) ? normalizedQuery.sort : [], input.policy);
  enforceFieldsAllowlist(normalizedQuery, input.policy);
  const typedFilter = typeCheckFilterClauses(filterParse.clauses, input.policy);

  const compiled = compilePlan(
    normalizedQuery,
    input.policy,
    input.context,
    typedFilter,
    page,
    filterParse.complexity,
    normalizedQueryKey,
    contextFingerprint,
    planCacheKey
  );

  const maxCompileMs = Number.isInteger(limits.max_compile_ms) ? limits.max_compile_ms : null;
  if (maxCompileMs !== null) {
    const elapsed = Date.now() - startedAt;
    if (elapsed > maxCompileMs) {
      throwCompilationError(
        "filter_complexity_exceeded",
        `Compilation time budget exceeded (${elapsed}ms > ${maxCompileMs}ms).`,
        { parameter: "query" },
        { limit: "max_compile_ms", elapsed_ms: elapsed }
      );
    }
  }

  return compiled;
}

function compileRequestSafe(input) {
  try {
    const plan = compileRequest(input);
    return { ok: true, plan };
  } catch (err) {
    if (err instanceof CompilationError) {
      return { ok: false, errors: [err.toJSON()] };
    }
    return {
      ok: false,
      errors: [
        {
          code: "internal_error",
          status: "500",
          title: "Internal compilation error"
        }
      ]
    };
  }
}

module.exports = {
  compileRequest,
  compileRequestSafe
};
