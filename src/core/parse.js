const { throwCompilationError } = require("../errors");

function decodeQueryComponent(rawValue, parameterName) {
  try {
    return decodeURIComponent(String(rawValue).replace(/\+/g, "%20"));
  } catch {
    throwCompilationError(
      "invalid_query_string",
      `Malformed percent-encoding in query parameter '${parameterName}'.`,
      { parameter: parameterName }
    );
  }
}

function parseQueryString(rawQuery) {
  const text = String(rawQuery || "").trim();
  if (text.length === 0) return {};

  const queryText = text.startsWith("?") ? text.slice(1) : text;
  const parts = queryText.split("&").filter(Boolean);
  const out = {};

  for (const part of parts) {
    const idx = part.indexOf("=");
    const rawKey = idx >= 0 ? part.slice(0, idx) : part;
    const rawValue = idx >= 0 ? part.slice(idx + 1) : "";
    const key = decodeQueryComponent(rawKey, "query");
    const value = decodeQueryComponent(rawValue, key || "query");

    if (Object.prototype.hasOwnProperty.call(out, key)) {
      const previous = out[key];
      out[key] = Array.isArray(previous) ? previous.concat([value]) : [previous, value];
    } else {
      out[key] = value;
    }
  }

  return out;
}

module.exports = {
  parseQueryString
};
