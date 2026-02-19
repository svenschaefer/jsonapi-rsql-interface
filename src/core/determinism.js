function sortStrings(values) {
  return values.slice().sort((a, b) => a.localeCompare(b));
}

function stableObject(input) {
  if (Array.isArray(input)) {
    return input.map(stableObject);
  }
  if (!input || typeof input !== "object") {
    return input;
  }

  const keys = Object.keys(input).sort((a, b) => a.localeCompare(b));
  const out = {};
  for (const key of keys) {
    out[key] = stableObject(input[key]);
  }
  return out;
}

module.exports = {
  sortStrings,
  stableObject
};
