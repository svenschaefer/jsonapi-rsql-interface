const { throwAdapterError } = require("./errors");
const { ensurePreparedMapping } = require("./mapping");
const { renumberFragmentPlaceholders, validateFragmentShape } = require("./placeholder");

function requireTable(tableValue, preparedMapping) {
  if (typeof tableValue !== "string" || tableValue.trim().length === 0) {
    throwAdapterError("pg_fragment_invalid", "assembleSelectSql requires non-empty table.");
  }
  const table = tableValue.trim();
  if (table !== preparedMapping.resource.table) {
    throwAdapterError(
      "pg_fragment_invalid",
      "assembleSelectSql table must come from getTableSql(mapping)."
    );
  }
  return table;
}

function requireFragment(name, fragment, limits) {
  validateFragmentShape(name, fragment, limits);
  return fragment;
}

function maybeFragment(name, fragment, limits) {
  if (fragment === undefined || fragment === null) return null;
  validateFragmentShape(name, fragment, limits);
  return fragment;
}

function assembleSelectSql(input, mapping) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throwAdapterError("pg_fragment_invalid", "assembleSelectSql input must be an object.");
  }

  const allowedKeys = new Set(["table", "select", "where", "security", "orderBy", "limitOffset"]);
  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      throwAdapterError("pg_fragment_invalid", "assembleSelectSql contains unsupported input key.");
    }
  }

  const preparedMapping = ensurePreparedMapping(mapping);
  const limits = preparedMapping.limits;
  const table = requireTable(input.table, preparedMapping);
  const select = requireFragment("select", input.select, limits);
  const where = maybeFragment("where", input.where, limits);
  const security = maybeFragment("security", input.security, limits);
  const orderBy = maybeFragment("orderBy", input.orderBy, limits);
  const limitOffset = maybeFragment("limitOffset", input.limitOffset, limits);

  const conditionFragments = [];
  if (where && where.text.length > 0) conditionFragments.push({ ...where });
  if (security && security.text.length > 0) conditionFragments.push({ ...security });
  const tailFragments = [];
  if (orderBy && orderBy.text.length > 0) tailFragments.push({ ...orderBy });
  if (limitOffset && limitOffset.text.length > 0) tailFragments.push({ ...limitOffset });

  const fragmentCount = 1 + conditionFragments.length + tailFragments.length;
  if (fragmentCount > limits.max_fragment_count) {
    throwAdapterError("pg_limits_exceeded", "Fragment count exceeds adapter limit.", {
      limit: "max_fragment_count"
    });
  }

  const sqlParts = [`SELECT ${select.text} FROM ${table}`];
  const values = [];

  if (conditionFragments.length > 0) {
    const conditionParts = [];
    for (let index = 0; index < conditionFragments.length; index += 1) {
      const prepared = renumberFragmentPlaceholders(
        `where.${index}`,
        conditionFragments[index],
        values.length
      );
      conditionParts.push(`(${prepared.text})`);
      values.push(...prepared.values);
    }
    sqlParts.push(` WHERE ${conditionParts.join(" AND ")}`);
  }

  for (let index = 0; index < tailFragments.length; index += 1) {
    const prepared = renumberFragmentPlaceholders(
      `tail.${index}`,
      tailFragments[index],
      values.length
    );
    sqlParts.push(` ${prepared.text}`);
    values.push(...prepared.values);
  }

  if (values.length > limits.max_bound_values) {
    throwAdapterError("pg_limits_exceeded", "Bound values count exceeds adapter limit.", {
      limit: "max_bound_values"
    });
  }
  const text = sqlParts.join("");
  if (text.length > limits.max_sql_text_length) {
    throwAdapterError("pg_limits_exceeded", "SQL text length exceeds adapter limit.", {
      limit: "max_sql_text_length"
    });
  }

  return { text, values };
}

module.exports = {
  assembleSelectSql
};
