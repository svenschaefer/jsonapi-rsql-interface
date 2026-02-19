const { throwCompilationError } = require("../errors");

function asLimit(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function enforceStringLimits(rawQuery, limits) {
  const maxRaw = asLimit(limits.max_raw_query_length, 4096);
  const maxDecoded = asLimit(limits.max_decoded_query_length, 4096);

  if (rawQuery && rawQuery.length > maxRaw) {
    throwCompilationError(
      "invalid_query_string",
      `Raw query exceeds limit ${maxRaw}.`,
      { parameter: "query" },
      { limit: "max_raw_query_length", value: rawQuery.length }
    );
  }

  if (rawQuery && decodeURIComponent(rawQuery.replace(/\+/g, "%20")).length > maxDecoded) {
    throwCompilationError(
      "invalid_query_string",
      `Decoded query exceeds limit ${maxDecoded}.`,
      { parameter: "query" },
      { limit: "max_decoded_query_length" }
    );
  }
}

function enforceDuplicatePolicy(params) {
  for (const [key, value] of Object.entries(params || {})) {
    if (Array.isArray(value)) {
      throwCompilationError(
        "invalid_query_string",
        `Duplicate parameter is not allowed: ${key}.`,
        { parameter: key },
        { duplicate_parameter: key }
      );
    }
  }
}

function enforceRootFieldFilterScope(filter) {
  if (typeof filter !== "string" || filter.trim().length === 0) return;
  if (/\b[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*\b/.test(filter)) {
    throwCompilationError(
      "invalid_filter_syntax",
      "Relationship-path filtering is not supported in v1.",
      { parameter: "filter" }
    );
  }
}

function enforceEmptyInListRule(filter) {
  if (typeof filter !== "string" || filter.trim().length === 0) return;
  if (/=in=\(\s*\)|=out=\(\s*\)/.test(filter)) {
    throwCompilationError(
      "empty_in_list_not_allowed",
      "Empty =in=() or =out=() is not allowed.",
      { parameter: "filter" }
    );
  }
}

function enforceIncludeLimits(includeList, limits) {
  const maxCount = asLimit(limits.max_include_paths, 10);
  if (includeList.length > maxCount) {
    throwCompilationError(
      "filter_complexity_exceeded",
      `Include path count exceeds limit ${maxCount}.`,
      { parameter: "include" },
      { limit: "max_include_paths", count: includeList.length }
    );
  }
}

function enforceSortLimits(sortList, limits) {
  const maxCount = asLimit(limits.max_sort_keys, 8);
  if (sortList.length > maxCount) {
    throwCompilationError(
      "filter_complexity_exceeded",
      `Sort key count exceeds limit ${maxCount}.`,
      { parameter: "sort" },
      { limit: "max_sort_keys", count: sortList.length }
    );
  }
}

function enforceFieldSelectionLimits(normalizedQuery, limits) {
  const maxFields = asLimit(limits.max_sparse_fields, 25);
  for (const [key, value] of Object.entries(normalizedQuery)) {
    if (!key.startsWith("fields[")) continue;
    const count = Array.isArray(value) ? value.length : 0;
    if (count > maxFields) {
      throwCompilationError(
        "filter_complexity_exceeded",
        `Sparse field selection exceeds limit ${maxFields}.`,
        { parameter: key },
        { limit: "max_sparse_fields", count }
      );
    }
  }
}

function enforceSecurityPredicate(context) {
  const has = Boolean(
    context &&
      context.security_predicate &&
      typeof context.security_predicate === "object" &&
      context.security_predicate.field &&
      context.security_predicate.operator
  );

  if (!has) {
    throwCompilationError(
      "security_predicate_required",
      "Mandatory security predicate is missing from context.",
      { parameter: "context" }
    );
  }
}

module.exports = {
  enforceDuplicatePolicy,
  enforceEmptyInListRule,
  enforceFieldSelectionLimits,
  enforceIncludeLimits,
  enforceRootFieldFilterScope,
  enforceSecurityPredicate,
  enforceSortLimits,
  enforceStringLimits
};
