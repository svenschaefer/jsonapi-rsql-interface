function compilePlan(params, normalizedQuery, policy, context, typedFilter, complexity) {
  const includeList = Array.isArray(normalizedQuery.include) ? normalizedQuery.include : [];
  const sortList = Array.isArray(normalizedQuery.sort) ? normalizedQuery.sort : [];
  const filterText = typeof normalizedQuery.filter === "string" ? normalizedQuery.filter : "";

  return {
    kind: "query_plan",
    policy_version: String((policy && policy.version) || "v0"),
    tenant_context_present: Boolean(context && context.tenant_context_present === true),
    normalized_query: normalizedQuery,
    filter: {
      expression: filterText,
      dialect: "rsql-fiql",
      clauses: typedFilter.typed_clauses
    },
    bindings: typedFilter.bindings,
    include: includeList,
    sort: sortList,
    page: {
      size: params["page[size]"] || null,
      number: params["page[number]"] || null
    },
    security: {
      predicate: {
        field: String(context.security_predicate.field),
        operator: String(context.security_predicate.operator),
        bound_parameter_key: String(context.security_predicate.bound_parameter_key || "tenant_scope")
      }
    },
    meta: {
      policy_version: String((policy && policy.version) || "v0"),
      tenant_context_present: Boolean(context && context.tenant_context_present === true),
      normalized: true,
      filter_complexity: complexity
    }
  };
}

module.exports = {
  compilePlan
};
