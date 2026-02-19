const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const fixturesDir = path.resolve(__dirname, "..", "fixtures");

function collectJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(dir, name));
}

test("fixtures contain only synthetic/non-secret-like values", () => {
  const files = collectJsonFiles(fixturesDir);
  const forbidden = [
    /sk_live_/i,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
    /xox[baprs]-/i
  ];

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    for (const pattern of forbidden) {
      assert.equal(
        pattern.test(raw),
        false,
        `fixture appears to contain secret-like material (${pattern}) in ${path.basename(file)}`
      );
    }
  }
});
