const { sortStrings, stableObject } = require("./determinism");

function normalizeQuery(params) {
  const out = {};
  const entries = Object.entries(params || {});

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      if (key === "sort") {
        out[key] = value
          .map((item) => String(item).trim())
          .filter(Boolean);
      } else {
        out[key] = sortStrings(value.map((item) => String(item)));
      }
      continue;
    }

    if (typeof value !== "string") {
      out[key] = value;
      continue;
    }

    if (key === "sort") {
      out[key] = value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      continue;
    }

    if (key === "include" || key.startsWith("fields[")) {
      out[key] = sortStrings(
        value
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
      );
      continue;
    }

    out[key] = value;
  }

  return stableObject(out);
}

module.exports = {
  normalizeQuery
};
