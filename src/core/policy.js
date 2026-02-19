const { throwCompilationError } = require("../errors");
const { parseByType } = require("./types");
const { useHardenedFieldErrors } = require("./security");

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

function enforceParameterSurfaceLimits(params, limits) {
  const maxParamCount = asLimit(limits.max_param_count, 32);
  const maxKeyValuePairs = asLimit(limits.max_key_value_pairs, 64);
  const maxValueLength = asLimit(limits.max_parameter_value_length, 2048);

  const keys = Object.keys(params || {});
  if (keys.length > maxParamCount) {
    throwCompilationError(
      "invalid_query_string",
      `Parameter count exceeds limit ${maxParamCount}.`,
      { parameter: "query" },
      { limit: "max_param_count", count: keys.length }
    );
  }

  let pairCount = 0;
  for (const key of keys) {
    const value = params[key];
    if (Array.isArray(value)) {
      pairCount += value.length;
      for (const item of value) {
        if (String(item).length > maxValueLength) {
          throwCompilationError(
            "invalid_query_string",
            `Parameter value exceeds max length ${maxValueLength}.`,
            { parameter: key },
            { limit: "max_parameter_value_length" }
          );
        }
      }
      continue;
    }
    pairCount += 1;
    if (String(value).length > maxValueLength) {
      throwCompilationError(
        "invalid_query_string",
        `Parameter value exceeds max length ${maxValueLength}.`,
        { parameter: key },
        { limit: "max_parameter_value_length" }
      );
    }
  }

  if (pairCount > maxKeyValuePairs) {
    throwCompilationError(
      "invalid_query_string",
      `Key/value pair count exceeds limit ${maxKeyValuePairs}.`,
      { parameter: "query" },
      { limit: "max_key_value_pairs", count: pairCount }
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

function enforceFilterLiteralLength(filter, limits) {
  const maxLen = asLimit(limits.max_filter_literal_length, 2048);
  if (typeof filter !== "string") return;
  if (filter.length > maxLen) {
    throwCompilationError(
      "filter_complexity_exceeded",
      `Filter literal length exceeds limit ${maxLen}.`,
      { parameter: "filter" },
      { limit: "max_filter_literal_length", value: filter.length }
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
  const maxPathLength = asLimit(limits.max_include_path_length, 128);
  if (includeList.length > maxCount) {
    throwCompilationError(
      "filter_complexity_exceeded",
      `Include path count exceeds limit ${maxCount}.`,
      { parameter: "include" },
      { limit: "max_include_paths", count: includeList.length }
    );
  }
  for (const path of includeList) {
    if (String(path).length > maxPathLength) {
      throwCompilationError(
        "filter_complexity_exceeded",
        `Include path length exceeds limit ${maxPathLength}.`,
        { parameter: "include" },
        { limit: "max_include_path_length", value: String(path).length }
      );
    }
  }
}

function enforceFilterComplexityLimits(complexity, limits) {
  const maxDepth = asLimit(limits.max_ast_depth, 8);
  const maxNodes = asLimit(limits.max_ast_nodes, 64);

  if ((complexity.ast_depth || 0) > maxDepth) {
    throwCompilationError(
      "filter_complexity_exceeded",
      `Filter AST depth exceeds limit ${maxDepth}.`,
      { parameter: "filter" },
      { limit: "max_ast_depth", value: complexity.ast_depth }
    );
  }

  if ((complexity.ast_nodes || 0) > maxNodes) {
    throwCompilationError(
      "filter_complexity_exceeded",
      `Filter AST node count exceeds limit ${maxNodes}.`,
      { parameter: "filter" },
      { limit: "max_ast_nodes", value: complexity.ast_nodes }
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

function enforceInListSize(clauses, limits) {
  const maxItems = asLimit(limits.max_in_list_items, 50);
  for (const clause of clauses || []) {
    if (clause.operator !== "=in=" && clause.operator !== "=out=") continue;
    if (clause.raw_values.length === 0) {
      throwCompilationError(
        "empty_in_list_not_allowed",
        "Empty =in=() or =out=() is not allowed.",
        { parameter: "filter" }
      );
    }
    if (clause.raw_values.length > maxItems) {
      throwCompilationError(
        "filter_complexity_exceeded",
        `Membership list exceeds limit ${maxItems}.`,
        { parameter: "filter" },
        { limit: "max_in_list_items", value: clause.raw_values.length }
      );
    }
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

function enforceIncludeAllowlist(includeList, policy) {
  if (includeList.length === 0) return;
  const allowlist = (policy && policy.query_dimensions && policy.query_dimensions.include_allowlist) || [];
  const allowed = new Set(allowlist);
  for (const includePath of includeList) {
    if (!allowed.has(includePath)) {
      throwCompilationError(
        "include_not_allowed",
        `Include path is not allowed: ${includePath}.`,
        { parameter: "include" },
        { include: includePath }
      );
    }
  }
}

function enforceSortAllowlist(sortList, policy) {
  if (sortList.length === 0) return;
  const allowlist = (policy && policy.query_dimensions && policy.query_dimensions.sortable_fields) || [];
  const allowed = new Set(allowlist);
  for (const key of sortList) {
    const field = key.startsWith("-") ? key.slice(1) : key;
    if (!allowed.has(field)) {
      throwCompilationError(
        "sort_not_allowed",
        `Sort field is not allowed: ${field}.`,
        { parameter: "sort" },
        { field }
      );
    }
  }
}

function enforceFieldsAllowlist(normalizedQuery, policy) {
  const map =
    (policy && policy.query_dimensions && policy.query_dimensions.fields_allowlist) || Object.create(null);
  for (const [key, value] of Object.entries(normalizedQuery)) {
    if (!key.startsWith("fields[")) continue;
    const resourceType = key.slice(7, -1);
    const allowed = new Set(Array.isArray(map[resourceType]) ? map[resourceType] : []);
    for (const field of Array.isArray(value) ? value : []) {
      if (!allowed.has(field)) {
        throwCompilationError(
          "fields_not_allowed",
          `Field is not allowed in sparse fieldset: ${field}.`,
          { parameter: key },
          { field, resource: resourceType }
        );
      }
    }
  }
}

function enforceNoWildcardSemantics(clauses) {
  for (const clause of clauses || []) {
    if (clause.operator !== "==" && clause.operator !== "!=") continue;
    for (const raw of clause.raw_values || []) {
      if (String(raw).includes("*")) {
        throwCompilationError(
          "invalid_filter_syntax",
          "Wildcard semantics are not supported in v1.",
          { parameter: "filter" }
        );
      }
    }
  }
}

function typeCheckFilterClauses(clauses, policy) {
  const fields = (policy && policy.fields) || {};
  const hardenedFieldErrors = useHardenedFieldErrors(policy);
  const typed = [];
  const bindings = [];
  let bindIndex = 1;

  for (const clause of clauses || []) {
    const fieldDef = fields[clause.field];
    if (!fieldDef) {
      throwCompilationError(
        hardenedFieldErrors ? "field_not_allowed" : "unknown_field",
        hardenedFieldErrors
          ? "Field is not allowed."
          : `Unknown field: ${clause.field}.`,
        { parameter: "filter" },
        { field: clause.field }
      );
    }
    if (fieldDef.filterable === false) {
      throwCompilationError(
        "field_not_allowed",
        `Field is not filterable: ${clause.field}.`,
        { parameter: "filter" },
        { field: clause.field }
      );
    }
    const allowedOps = Array.isArray(fieldDef.operators) ? fieldDef.operators : [];
    if (!allowedOps.includes(clause.operator)) {
      throwCompilationError(
        "operator_not_allowed",
        `Operator ${clause.operator} is not allowed for field ${clause.field}.`,
        { parameter: "filter" },
        { field: clause.field, operator: clause.operator }
      );
    }

    const parsedValues = [];
    let normalizedFromTimezone = false;
    for (const raw of clause.raw_values) {
      if (raw === "null") {
        if (clause.operator !== "==" && clause.operator !== "!=") {
          throwCompilationError(
            "value_type_mismatch",
            "Null literal is only allowed with == or != operators.",
            { parameter: "filter" },
            { field: clause.field, operator: clause.operator }
          );
        }
        parsedValues.push(null);
        continue;
      }

      const parsed = parseByType(fieldDef.type, raw, fieldDef);
      if (!parsed.ok) {
        throwCompilationError(
          "value_type_mismatch",
          `Value does not match field type '${fieldDef.type}'.`,
          { parameter: "filter" },
          { field: clause.field, expected_type: fieldDef.type }
        );
      }
      parsedValues.push(parsed.value);
      if (parsed.normalized) normalizedFromTimezone = true;
    }

    const bindKey = `p${bindIndex}`;
    bindIndex += 1;
    bindings.push({ key: bindKey, values: parsedValues });
    typed.push({
      field: clause.field,
      operator: clause.operator,
      values: parsedValues,
      expected_type: fieldDef.type,
      normalized_from_timezone: normalizedFromTimezone
    });
  }

  return { typed_clauses: typed, bindings };
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
};
