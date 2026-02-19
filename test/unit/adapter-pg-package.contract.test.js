const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("@jsonapi-rsql/pg package contract baseline", () => {
  const pkgPath = path.resolve(__dirname, "../../packages/adapter-pg/package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  assert.equal(pkg.name, "@jsonapi-rsql/pg");
  assert.equal(pkg.type, "commonjs");
  assert.equal(pkg.main, "./src/index.js");
  assert.ok(pkg.exports && pkg.exports["."] === "./src/index.js");
  assert.ok(pkg.peerDependencies);
  assert.ok(pkg.peerDependencies["jsonapi-rsql-interface"]);
  assert.equal(pkg.engines.node, ">=20.0.0");
});

test("@jsonapi-rsql/pg README documents assembly helper", () => {
  const readmePath = path.resolve(__dirname, "../../packages/adapter-pg/README.md");
  const text = fs.readFileSync(readmePath, "utf8");

  assert.ok(text.includes("assembleSelectSql"));
  assert.ok(text.includes("compileWhere"));
  assert.ok(text.includes("compileSecurityPredicate(plan, mapping, securityContext)"));
  assert.ok(text.includes("pg_security_predicate_required"));
});
