const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { loadProjectConfig } = require("../../src/tools");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "jsonapi-rsql-interface-config-"));
}

test("loadProjectConfig loads explicit config file", () => {
  const dir = makeTempDir();
  const file = path.join(dir, "custom-config.json");
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        policy: {
          version: "v-test"
        }
      },
      null,
      2
    ),
    "utf8"
  );

  const loaded = loadProjectConfig({ configPath: file, requireExists: true });
  assert.equal(loaded.exists, true);
  assert.equal(loaded.path, path.resolve(file));
  assert.equal(loaded.config.policy.version, "v-test");
});

test("loadProjectConfig returns empty config when default file is missing", () => {
  const dir = makeTempDir();
  const loaded = loadProjectConfig({ cwd: dir });
  assert.equal(loaded.exists, false);
  assert.equal(loaded.path, path.resolve(dir, "project.config.json"));
  assert.deepEqual(loaded.config, {});
});

test("loadProjectConfig rejects invalid JSON and non-object content", () => {
  const dir = makeTempDir();

  const badJson = path.join(dir, "bad-json.json");
  fs.writeFileSync(badJson, "{ not-valid", "utf8");
  assert.throws(
    () => loadProjectConfig({ configPath: badJson, requireExists: true }),
    /Invalid JSON/i
  );

  const badShape = path.join(dir, "bad-shape.json");
  fs.writeFileSync(badShape, JSON.stringify(["not", "an", "object"]), "utf8");
  assert.throws(
    () => loadProjectConfig({ configPath: badShape, requireExists: true }),
    /must contain a JSON object/i
  );
});
