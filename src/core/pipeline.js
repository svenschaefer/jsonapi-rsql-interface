const { CompilationError, throwCompilationError } = require("../errors");
const { parseQueryString } = require("./parse");
const { normalizeQuery } = require("./normalize");
const { parseFilterExpression } = require("./filter");
const { createNormalizedQueryKey } = require("./cache-key");
const { validatePolicySecurityArtifacts } = require("./security");
const {
  enforceDuplicatePolicy,
  enforceEmptyInListRule,
  enforceFieldsAllowlist,
  enforceFieldSelectionLimits,
  enforceFilterComplexityLimits,
  enforceFilterLiteralLength,
  enforceIncludeAllowlist,
  enforceIncludeLimits,
  enforceInListSize,
  enforceNoWildcardSemantics,
  enforceParameterSurfaceLimits,
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
    throw new Error(`${label} must be an object.`);
  }
}

function compileRequest(input) {
  const startedAt = Date.now();
  ensureObject(input, "compileRequest input");
  ensureObject(input.policy || {}, "input.policy");
  ensureObject(input.context || {}, "input.context");

  const rawQuery = typeof input.raw_query === "string" ? input.raw_query : "";
  const queryObject = input.query && typeof input.query === "object" ? input.query : null;
  const params = queryObject || parseQueryString(rawQuery);
  const limits = (input.policy && input.policy.limits) || {};

  validatePolicySecurityArtifacts(input.policy);
  enforceStringLimits(rawQuery, limits);
  enforceParameterSurfaceLimits(params, limits);
  enforceDuplicatePolicy(params);

  const normalizedQuery = normalizeQuery(params);
  const normalizedQueryKey = createNormalizedQueryKey(normalizedQuery);
  const filterParse = parseFilterExpression(normalizedQuery.filter || "");

  enforceRootFieldFilterScope(normalizedQuery.filter);
  enforceFilterLiteralLength(normalizedQuery.filter || "", limits);
  enforceEmptyInListRule(normalizedQuery.filter);
  enforceNoWildcardSemantics(filterParse.clauses);
  enforceFilterComplexityLimits(filterParse.complexity, limits);
  enforceInListSize(filterParse.clauses, limits);
  enforceIncludeLimits(Array.isArray(normalizedQuery.include) ? normalizedQuery.include : [], limits);
  enforceSortLimits(Array.isArray(normalizedQuery.sort) ? normalizedQuery.sort : [], limits);
  enforceFieldSelectionLimits(normalizedQuery, limits);
  enforceIncludeAllowlist(Array.isArray(normalizedQuery.include) ? normalizedQuery.include : [], input.policy);
  enforceSortAllowlist(Array.isArray(normalizedQuery.sort) ? normalizedQuery.sort : [], input.policy);
  enforceFieldsAllowlist(normalizedQuery, input.policy);
  enforceSecurityPredicate(input.context);

  const typedFilter = typeCheckFilterClauses(filterParse.clauses, input.policy);

  const compiled = compilePlan(
    params,
    normalizedQuery,
    input.policy,
    input.context,
    typedFilter,
    filterParse.complexity,
    normalizedQueryKey
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
    throw err;
  }
}

module.exports = {
  compileRequest,
  compileRequestSafe
};
