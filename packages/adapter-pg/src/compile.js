const { throwAdapterError } = require("./errors");
const { ensurePreparedMapping } = require("./mapping");

const OPERATOR_TEMPLATES = Object.freeze({
  "==": "=",
  "!=": "<>",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<="
});

function ensurePlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan) || plan.kind !== "query_plan") {
    throwAdapterError("pg_invalid_plan_shape", "Input must be a query_plan object.");
  }
}

function resolveFieldSql(preparedMapping, fieldName, purpose) {
  const fieldMapping = preparedMapping.fields.get(String(fieldName));
  if (!fieldMapping) {
    throwAdapterError("pg_mapping_missing", "Required field mapping is missing.", {
      field: String(fieldName),
      purpose
    });
  }
  return fieldMapping;
}

function enforceLimit(limitName, value, limits) {
  if (value > limits[limitName]) {
    throwAdapterError("pg_limits_exceeded", "Adapter limit exceeded.", {
      limit: limitName
    });
  }
}

function pushBoundValue(values, value) {
  values.push(value);
  return `$${values.length}`;
}

function wildcardPattern(wildcard) {
  if (!wildcard || typeof wildcard !== "object") {
    throwAdapterError("pg_invalid_plan_shape", "Invalid wildcard metadata.");
  }
  const base = String(wildcard.value || "");
  const mode = String(wildcard.mode || "");
  if (mode === "contains") return `%${base}%`;
  if (mode === "starts_with") return `${base}%`;
  if (mode === "ends_with") return `%${base}`;
  throwAdapterError("pg_feature_not_supported", "Wildcard mode is not supported by adapter.");
}

function compileClauseSql(preparedMapping, clause, values, expressionIds) {
  if (!clause || typeof clause !== "object" || Array.isArray(clause)) {
    throwAdapterError("pg_invalid_plan_shape", "Filter clause must be an object.");
  }
  const fieldName = String(clause.field || "");
  const operator = String(clause.operator || "");
  const fieldSql = resolveFieldSql(preparedMapping, fieldName, "filter");
  if (fieldSql.kind === "expression" && fieldSql.expression_id) {
    expressionIds.add(fieldSql.expression_id);
  }
  const lhs = fieldSql.sql;
  const rawValues = Array.isArray(clause.values) ? clause.values : [];

  if (operator === "=in=" || operator === "=out=") {
    if (rawValues.length === 0) {
      throwAdapterError("pg_invalid_plan_shape", "Membership operator requires non-empty values.");
    }
    const bindTokens = rawValues.map((value) => pushBoundValue(values, value));
    const inSql = `${lhs} ${operator === "=in=" ? "IN" : "NOT IN"} (${bindTokens.join(", ")})`;
    return `(${inSql})`;
  }

  if (clause.wildcard !== null && clause.wildcard !== undefined) {
    if (operator !== "==") {
      throwAdapterError("pg_operator_not_supported", "Wildcard clauses require == operator.");
    }
    const wildcard = clause.wildcard;
    const comparator = wildcard.case_sensitive === false ? "ILIKE" : "LIKE";
    const bindToken = pushBoundValue(values, wildcardPattern(wildcard));
    return `(${lhs} ${comparator} ${bindToken})`;
  }

  if (!Object.prototype.hasOwnProperty.call(OPERATOR_TEMPLATES, operator)) {
    throwAdapterError("pg_operator_not_supported", "Operator is not supported by adapter.");
  }

  if (rawValues.length !== 1) {
    throwAdapterError("pg_invalid_plan_shape", "Comparison operator requires exactly one value.");
  }

  const value = rawValues[0];
  if (value === null) {
    if (operator === "==") return `(${lhs} IS NULL)`;
    if (operator === "!=") return `(${lhs} IS NOT NULL)`;
    throwAdapterError("pg_operator_not_supported", "Null value is only supported for == and !=.");
  }

  const bindToken = pushBoundValue(values, value);
  return `(${lhs} ${OPERATOR_TEMPLATES[operator]} ${bindToken})`;
}

function compileWhere(plan, mapping) {
  ensurePlan(plan);
  const preparedMapping = ensurePreparedMapping(mapping);
  const clauses = plan.filter && Array.isArray(plan.filter.clauses) ? plan.filter.clauses : [];
  enforceLimit("max_predicates", clauses.length, preparedMapping.limits);
  if (clauses.length === 0) {
    return { text: "", values: [], meta: { expression_ids: [] } };
  }

  const values = [];
  const expressionIds = new Set();
  const parts = clauses.map((clause) => compileClauseSql(preparedMapping, clause, values, expressionIds));
  enforceLimit("max_bound_values", values.length, preparedMapping.limits);
  return {
    text: parts.join(" AND "),
    values,
    meta: {
      expression_ids: Array.from(expressionIds).sort()
    }
  };
}

function compileOrderBy(plan, mapping) {
  ensurePlan(plan);
  const preparedMapping = ensurePreparedMapping(mapping);
  const sortEntries = Array.isArray(plan.sort) ? plan.sort : [];
  if (sortEntries.length === 0) return { text: "", values: [] };
  enforceLimit("max_order_by_keys", sortEntries.length, preparedMapping.limits);

  const terms = sortEntries.map((entry) => {
    const token = String(entry);
    const desc = token.startsWith("-");
    const fieldName = desc ? token.slice(1) : token;
    const fieldSql = resolveFieldSql(preparedMapping, fieldName, "sort");
    return `${fieldSql.sql} ${desc ? "DESC" : "ASC"}`;
  });

  return {
    text: `ORDER BY ${terms.join(", ")}`,
    values: []
  };
}

function compileLimitOffset(plan, mapping) {
  ensurePlan(plan);
  const preparedMapping = ensurePreparedMapping(mapping);
  const page = plan.page || {};
  if (!Number.isInteger(page.size) || page.size <= 0) {
    return { text: "", values: [] };
  }
  const number = Number.isInteger(page.number) && page.number > 0 ? page.number : 1;
  const offset = (number - 1) * page.size;
  const values = [page.size, offset];
  enforceLimit("max_bound_values", values.length, preparedMapping.limits);
  return {
    text: "LIMIT $1 OFFSET $2",
    values
  };
}

function resolveSecurityValue(securityContext, key) {
  if (!securityContext || typeof securityContext !== "object" || Array.isArray(securityContext)) {
    return { found: false, value: null };
  }
  if (Object.prototype.hasOwnProperty.call(securityContext, key)) {
    return { found: true, value: securityContext[key] };
  }
  const nested = securityContext.values;
  if (nested && typeof nested === "object" && !Array.isArray(nested) && Object.prototype.hasOwnProperty.call(nested, key)) {
    return { found: true, value: nested[key] };
  }
  return { found: false, value: null };
}

function compileSecurityPredicate(plan, mapping, securityContext) {
  ensurePlan(plan);
  const preparedMapping = ensurePreparedMapping(mapping);
  const predicate = plan.security && plan.security.predicate ? plan.security.predicate : null;
  if (!predicate || typeof predicate !== "object") {
    throwAdapterError("pg_security_predicate_required", "Security predicate is missing.");
  }
  const field = String(predicate.field || "");
  const operator = String(predicate.operator || "");
  const bindingKey = String(predicate.bound_parameter_key || "");
  if (!field || !operator || !bindingKey) {
    throwAdapterError("pg_security_predicate_required", "Security predicate is incomplete.");
  }
  if (!Object.prototype.hasOwnProperty.call(OPERATOR_TEMPLATES, operator)) {
    throwAdapterError("pg_operator_not_supported", "Security predicate operator is not supported.");
  }
  const fieldSql = resolveFieldSql(preparedMapping, field, "security_predicate");
  const resolved = resolveSecurityValue(securityContext, bindingKey);
  if (!resolved.found) {
    throwAdapterError("pg_security_predicate_required", "Security predicate binding is missing.");
  }
  const value = resolved.value;
  if (value === null) {
    if (operator === "==") return { text: `(${fieldSql.sql} IS NULL)`, values: [] };
    if (operator === "!=") return { text: `(${fieldSql.sql} IS NOT NULL)`, values: [] };
    throwAdapterError("pg_operator_not_supported", "Null security predicate is only supported for == and !=.");
  }
  return {
    text: `(${fieldSql.sql} ${OPERATOR_TEMPLATES[operator]} $1)`,
    values: [value]
  };
}

function compileSelect(plan, mapping) {
  ensurePlan(plan);
  const preparedMapping = ensurePreparedMapping(mapping);
  if (Array.isArray(plan.include) && plan.include.length > 0) {
    throwAdapterError("pg_feature_not_supported", "Include-driven projection is not supported in v1.2.x.");
  }

  const sparseKey = `fields[${preparedMapping.resource.type}]`;
  const requested = plan.normalized_query && Array.isArray(plan.normalized_query[sparseKey])
    ? plan.normalized_query[sparseKey]
    : null;
  const selectedFields = requested && requested.length > 0
    ? requested
    : preparedMapping.defaultSelect || Array.from(preparedMapping.fields.keys());

  enforceLimit("max_selected_columns", selectedFields.length, preparedMapping.limits);
  const expressionIds = new Set();
  const selectSql = selectedFields.map((fieldName) => {
    const fieldSql = resolveFieldSql(preparedMapping, fieldName, "select");
    if (fieldSql.kind === "expression" && fieldSql.expression_id) {
      expressionIds.add(fieldSql.expression_id);
    }
    return `${fieldSql.sql} AS "${String(fieldName)}"`;
  });

  return {
    text: selectSql.join(", "),
    values: [],
    meta: {
      expression_ids: Array.from(expressionIds).sort()
    }
  };
}

module.exports = {
  OPERATOR_TEMPLATES,
  getTableSql(mapping) {
    const preparedMapping = ensurePreparedMapping(mapping);
    return preparedMapping.resource.table;
  },
  compileWhere,
  compileOrderBy,
  compileLimitOffset,
  compileSecurityPredicate,
  compileSelect
};
