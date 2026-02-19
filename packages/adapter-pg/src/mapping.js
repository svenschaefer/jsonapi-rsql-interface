const { throwAdapterError } = require("./errors");

const IDENTIFIER_TOKEN_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ADAPTER_DIALECT_PROFILE = "postgresql-v1-core";

const DEFAULT_LIMITS = Object.freeze({
  max_predicates: 200,
  max_selected_columns: 100,
  max_order_by_keys: 25,
  max_fragment_count: 8,
  max_fragment_text_length: 100000,
  max_fragment_values: 10000,
  max_sql_text_length: 250000,
  max_bound_values: 50000
});

function ensureObject(value, code, detail, meta) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throwAdapterError(code, detail, meta);
  }
}

function assertAsciiIdentifier(pathLabel, value) {
  if (typeof value !== "string" || value.length === 0) {
    throwAdapterError("pg_invalid_mapping_shape", "Mapping identifier must be a non-empty string.", {
      path: pathLabel
    });
  }
  const tokens = value.split(".");
  if (tokens.length === 0 || tokens.some((token) => !IDENTIFIER_TOKEN_RE.test(token))) {
    throwAdapterError("pg_invalid_mapping_shape", "Mapping identifier contains unsupported characters.", {
      path: pathLabel
    });
  }
}

function quoteIdentifier(identifier) {
  const tokens = String(identifier).split(".");
  return tokens.map((token) => `"${token}"`).join(".");
}

function normalizeFieldMapping(fieldName, fieldDef) {
  ensureObject(
    fieldDef,
    "pg_invalid_mapping_shape",
    "Field mapping must be an object.",
    { field: fieldName }
  );

  const kind = String(fieldDef.kind || "");
  if (kind === "column") {
    assertAsciiIdentifier(`fields.${fieldName}.column`, fieldDef.column);
    return {
      kind: "column",
      sql: quoteIdentifier(fieldDef.column),
      expression_id: null
    };
  }

  if (kind === "expression") {
    if (fieldDef.trusted !== true) {
      throwAdapterError(
        "pg_invalid_mapping_shape",
        "Expression mappings require explicit trusted=true.",
        { field: fieldName }
      );
    }
    if (typeof fieldDef.sql !== "string" || fieldDef.sql.trim().length === 0) {
      throwAdapterError(
        "pg_invalid_mapping_shape",
        "Expression mapping requires non-empty sql text.",
        { field: fieldName }
      );
    }
    const expressionId =
      typeof fieldDef.expression_id === "string" && fieldDef.expression_id.trim().length > 0
        ? fieldDef.expression_id.trim()
        : null;
    return {
      kind: "expression",
      sql: fieldDef.sql.trim(),
      expression_id: expressionId
    };
  }

  throwAdapterError("pg_invalid_mapping_shape", "Field mapping kind is not supported.", {
    field: fieldName
  });
}

function normalizeLimits(rawLimits) {
  const limits = {
    ...DEFAULT_LIMITS
  };
  if (!rawLimits) return limits;
  ensureObject(
    rawLimits,
    "pg_invalid_mapping_shape",
    "Adapter limits must be an object.",
    { path: "limits" }
  );
  for (const key of Object.keys(DEFAULT_LIMITS)) {
    if (rawLimits[key] === undefined) continue;
    const value = rawLimits[key];
    if (!Number.isInteger(value) || value <= 0) {
      throwAdapterError("pg_invalid_mapping_shape", "Adapter limit must be a positive integer.", {
        path: `limits.${key}`
      });
    }
    limits[key] = value;
  }
  return limits;
}

function prepareMapping(mapping) {
  ensureObject(mapping, "pg_invalid_mapping_shape", "Mapping must be an object.");
  const requestedDialectProfile =
    mapping.dialect_profile === undefined ? ADAPTER_DIALECT_PROFILE : String(mapping.dialect_profile).trim();
  if (requestedDialectProfile !== ADAPTER_DIALECT_PROFILE) {
    throwAdapterError(
      "pg_feature_not_supported",
      "Mapping requests an unsupported dialect profile.",
      { feature: "dialect_profile" }
    );
  }
  ensureObject(mapping.resource, "pg_invalid_mapping_shape", "resource mapping is required.", {
    path: "resource"
  });

  assertAsciiIdentifier("resource.table", mapping.resource.table);
  const resourceType = String(mapping.resource.type || "").trim();
  if (resourceType.length === 0) {
    throwAdapterError("pg_invalid_mapping_shape", "resource.type is required.", {
      path: "resource.type"
    });
  }

  ensureObject(mapping.fields, "pg_invalid_mapping_shape", "fields mapping is required.", {
    path: "fields"
  });
  const fieldKeys = Object.keys(mapping.fields);
  if (fieldKeys.length === 0) {
    throwAdapterError("pg_invalid_mapping_shape", "fields mapping must not be empty.");
  }

  const fields = new Map();
  for (const key of fieldKeys) {
    fields.set(key, normalizeFieldMapping(key, mapping.fields[key]));
  }

  let defaultSelect = null;
  if (mapping.default_select !== undefined) {
    if (!Array.isArray(mapping.default_select)) {
      throwAdapterError("pg_invalid_mapping_shape", "default_select must be an array when provided.", {
        path: "default_select"
      });
    }
    defaultSelect = mapping.default_select.map((value) => String(value));
  }

  return Object.freeze({
    __prepared_mapping: true,
    version: mapping.version ? String(mapping.version) : "",
    hash: mapping.hash ? String(mapping.hash) : "",
    dialect_profile: ADAPTER_DIALECT_PROFILE,
    resource: Object.freeze({
      table: quoteIdentifier(mapping.resource.table),
      type: resourceType
    }),
    fields,
    defaultSelect,
    limits: Object.freeze(normalizeLimits(mapping.limits))
  });
}

function ensurePreparedMapping(mapping) {
  if (mapping && mapping.__prepared_mapping === true) return mapping;
  return prepareMapping(mapping);
}

module.exports = {
  ADAPTER_DIALECT_PROFILE,
  DEFAULT_LIMITS,
  prepareMapping,
  ensurePreparedMapping
};
