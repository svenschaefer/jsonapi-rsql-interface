const test = require("node:test");
const assert = require("node:assert/strict");

const { sortStrings, stableObject } = require("../../src/core/determinism");
const { normalizeQuery } = require("../../src/core/normalize");
const { createNormalizedQueryKey } = require("../../src/core/cache-key");

test("sortStrings returns stable lexical ordering without mutating input", () => {
  const input = ["b", "a", "c"];
  const out = sortStrings(input);
  assert.deepEqual(out, ["a", "b", "c"]);
  assert.deepEqual(input, ["b", "a", "c"]);
});

test("stableObject recursively sorts object keys", () => {
  const value = {
    z: 1,
    a: {
      d: 4,
      b: 2
    }
  };
  const stable = stableObject(value);
  assert.equal(JSON.stringify(stable), '{"a":{"b":2,"d":4},"z":1}');
});

test("normalized query key is deterministic across equivalent key/value ordering", () => {
  const a = normalizeQuery({
    include: "groups,roles",
    sort: "-created,name",
    "fields[users]": "name,id",
    filter: "status==active"
  });
  const b = normalizeQuery({
    filter: "status==active",
    "fields[users]": "id,name",
    include: "roles,groups",
    sort: "-created,name"
  });
  assert.equal(createNormalizedQueryKey(a), createNormalizedQueryKey(b));
});

