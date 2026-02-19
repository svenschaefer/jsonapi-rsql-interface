const path = require("path");

function fail(message) {
  throw new Error(message);
}

function main() {
  const root = path.resolve(__dirname, "..");
  const pkg = require(path.join(root, "package.json"));
  const api = require(path.join(root, "src", "index.js"));
  const cli = require(path.join(root, "src", "tools", "cli.js"));

  if (!api || typeof api.compileRequest !== "function" || typeof api.compileRequestSafe !== "function") {
    fail("API smoke failed: expected compileRequest and compileRequestSafe exports.");
  }
  if (!cli || typeof cli.usage !== "function") {
    fail("CLI smoke failed: usage function is missing.");
  }

  const usage = cli.usage();
  if (!/Usage:/i.test(usage)) {
    fail("CLI smoke failed: usage output did not include 'Usage:'.");
  }

  const binKeys = Object.keys(pkg.bin || {});
  if (binKeys.length === 0) {
    fail("Package smoke failed: package.json bin mapping is missing.");
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        package: pkg.name,
        version: pkg.version,
        bin: binKeys
      },
      null,
      2
    ) + "\n"
  );
}

main();
