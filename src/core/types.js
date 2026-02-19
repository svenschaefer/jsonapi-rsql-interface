const INT64_MIN = BigInt("-9223372036854775808");
const INT64_MAX = BigInt("9223372036854775807");

function stripQuotes(raw) {
  const value = String(raw);
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseInt64(raw) {
  const value = String(raw);
  if (!/^-?(0|[1-9]\d*)$/.test(value)) return { ok: false };
  const big = BigInt(value);
  if (big < INT64_MIN || big > INT64_MAX) return { ok: false };
  return { ok: true, value: value };
}

function parseFloatStrict(raw) {
  const value = String(raw);
  if (!/^-?(\d+)(\.\d+)?$/.test(value)) return { ok: false };
  const num = Number(value);
  if (!Number.isFinite(num)) return { ok: false };
  return { ok: true, value: value };
}

function parseBooleanStrict(raw) {
  const value = String(raw);
  if (value !== "true" && value !== "false") return { ok: false };
  return { ok: true, value: value === "true" };
}

function parseDateStrict(raw) {
  const value = String(raw);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false };
  const dt = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return { ok: false };
  const roundTrip = dt.toISOString().slice(0, 10);
  if (roundTrip !== value) return { ok: false };
  return { ok: true, value };
}

function parseDatetimeStrict(raw) {
  const value = String(raw);
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)(Z|[+-]\d{2}:\d{2})$/
  );
  if (!match) return { ok: false };
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return { ok: false };
  return { ok: true, value: dt.toISOString(), normalized: match[2] !== "Z" };
}

function parseUuidStrict(raw) {
  const value = stripQuotes(raw);
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  return ok ? { ok: true, value } : { ok: false };
}

function parseEnumStrict(raw, fieldDef) {
  const value = stripQuotes(raw);
  const allowed = Array.isArray(fieldDef.enum_values) ? fieldDef.enum_values : [];
  if (!allowed.includes(value)) return { ok: false };
  return { ok: true, value };
}

function parseByType(fieldType, raw, fieldDef) {
  const rawValue = stripQuotes(raw);
  if (fieldType === "string") return { ok: true, value: rawValue };
  if (fieldType === "int") return parseInt64(rawValue);
  if (fieldType === "float") return parseFloatStrict(rawValue);
  if (fieldType === "bool") return parseBooleanStrict(rawValue);
  if (fieldType === "date") return parseDateStrict(rawValue);
  if (fieldType === "datetime") return parseDatetimeStrict(rawValue);
  if (fieldType === "uuid") return parseUuidStrict(rawValue);
  if (fieldType === "enum") return parseEnumStrict(rawValue, fieldDef);
  return { ok: false };
}

module.exports = {
  parseByType
};
