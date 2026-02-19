const fs = require("fs");
const path = require("path");

function exists(relPath) {
  const root = path.resolve(__dirname, "..");
  return fs.existsSync(path.join(root, relPath));
}

function maturityLevel() {
  const checks = [
    exists("README.md"),
    exists("docs/NPM_RELEASE.md"),
    exists("docs/DEV_TOOLING.md"),
    exists("scripts/release-smoke-check.js"),
    exists(".github/workflows/ci.yml")
  ];
  const score = checks.filter(Boolean).length;
  if (score >= 5) return 4;
  if (score >= 4) return 3;
  if (score >= 3) return 2;
  return 1;
}

function main() {
  const level = maturityLevel();
  const rows = [
    {
      maturity_level: level,
      maturity_label:
        level === 4
          ? "Release-ready workflow baseline"
          : level === 3
            ? "Strong workflow baseline"
            : level === 2
              ? "Basic workflow baseline"
              : "Early baseline"
    }
  ];
  const payload = {
    generated_at: new Date().toISOString(),
    rows,
    seeds: rows
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();
