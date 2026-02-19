const { throwAdapterError } = require("./errors");

function validateFragmentShape(label, fragment, limits) {
  if (!fragment || typeof fragment !== "object" || Array.isArray(fragment)) {
    throwAdapterError("pg_fragment_invalid", "Fragment must be an object.", { fragment: label });
  }

  const keys = Object.keys(fragment);
  const allowedKeys = new Set(["text", "values", "meta"]);
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throwAdapterError("pg_fragment_invalid", "Fragment contains unsupported keys.", {
        fragment: label
      });
    }
  }

  if (typeof fragment.text !== "string") {
    throwAdapterError("pg_fragment_invalid", "Fragment text must be a string.", { fragment: label });
  }
  if (!Array.isArray(fragment.values)) {
    throwAdapterError("pg_fragment_invalid", "Fragment values must be an array.", { fragment: label });
  }
  if (fragment.text.length > limits.max_fragment_text_length) {
    throwAdapterError("pg_limits_exceeded", "Fragment text length exceeds adapter limit.", {
      fragment: label,
      limit: "max_fragment_text_length"
    });
  }
  if (fragment.values.length > limits.max_fragment_values) {
    throwAdapterError("pg_limits_exceeded", "Fragment value count exceeds adapter limit.", {
      fragment: label,
      limit: "max_fragment_values"
    });
  }
}

function renumberFragmentPlaceholders(label, fragment, offset) {
  const text = fragment.text;
  const values = fragment.values;
  const seen = new Set();
  const out = [];

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch !== "$") {
      out.push(ch);
      continue;
    }

    const next = text[i + 1];
    if (next === undefined || next < "0" || next > "9") {
      throwAdapterError("pg_fragment_invalid", "Invalid placeholder token form.", { fragment: label });
    }

    let j = i + 1;
    while (j < text.length && text[j] >= "0" && text[j] <= "9") j += 1;
    const rawNum = text.slice(i + 1, j);
    if (rawNum.length > 1 && rawNum[0] === "0") {
      throwAdapterError("pg_fragment_invalid", "Placeholder must use canonical numeric form.", {
        fragment: label
      });
    }

    const localIndex = Number(rawNum);
    if (!Number.isInteger(localIndex) || localIndex <= 0) {
      throwAdapterError("pg_fragment_invalid", "Placeholder index is invalid.", { fragment: label });
    }
    if (localIndex > values.length) {
      throwAdapterError("pg_fragment_invalid", "Placeholder index exceeds fragment values length.", {
        fragment: label
      });
    }
    if (seen.has(localIndex)) {
      throwAdapterError("pg_fragment_invalid", "Duplicate placeholder index in fragment is not allowed.", {
        fragment: label
      });
    }
    seen.add(localIndex);
    out.push(`$${offset + localIndex}`);
    i = j - 1;
  }

  if (seen.size === 0 && values.length > 0) {
    throwAdapterError("pg_fragment_invalid", "Fragment values provided without placeholders.", {
      fragment: label
    });
  }
  if (seen.size !== values.length) {
    throwAdapterError("pg_fragment_invalid", "Placeholder set must be contiguous and match values length.", {
      fragment: label
    });
  }
  for (let idx = 1; idx <= values.length; idx += 1) {
    if (!seen.has(idx)) {
      throwAdapterError("pg_fragment_invalid", "Placeholder sequence has gaps.", { fragment: label });
    }
  }

  return {
    text: out.join(""),
    values
  };
}

module.exports = {
  validateFragmentShape,
  renumberFragmentPlaceholders
};
