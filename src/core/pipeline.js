const { CompilationError } = require("../errors");
const { parseQueryString } = require("./parse");
const { normalizeQuery } = require("./normalize");
const {
  enforceDuplicatePolicy,
  enforceEmptyInListRule,
  enforceFieldSelectionLimits,
  enforceIncludeLimits,
  enforceRootFieldFilterScope,
  enforceSecurityPredicate,
  enforceSortLimits,
  enforceStringLimits
} = require("./policy");
const { compilePlan } = require("./compile");

function ensureObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function compileRequest(input) {
  ensureObject(input, "compileRequest input");
  ensureObject(input.policy || {}, "input.policy");
  ensureObject(input.context || {}, "input.context");

  const rawQuery = typeof input.raw_query === "string" ? input.raw_query : "";
  const queryObject = input.query && typeof input.query === "object" ? input.query : null;
  const params = queryObject || parseQueryString(rawQuery);
  const limits = (input.policy && input.policy.limits) || {};

  enforceStringLimits(rawQuery, limits);
  enforceDuplicatePolicy(params);

  const normalizedQuery = normalizeQuery(params);
  enforceRootFieldFilterScope(normalizedQuery.filter);
  enforceEmptyInListRule(normalizedQuery.filter);
  enforceIncludeLimits(Array.isArray(normalizedQuery.include) ? normalizedQuery.include : [], limits);
  enforceSortLimits(Array.isArray(normalizedQuery.sort) ? normalizedQuery.sort : [], limits);
  enforceFieldSelectionLimits(normalizedQuery, limits);
  enforceSecurityPredicate(input.context);

  return compilePlan(params, normalizedQuery, input.policy, input.context);
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
