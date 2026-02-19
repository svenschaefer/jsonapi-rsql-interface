const fs = require("fs");
const path = require("path");

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += countFiles(full);
    else total += 1;
  }
  return total;
}

function main() {
  const root = path.resolve(__dirname, "..");
  const rows = [
    {
      metric: "repo_counts",
      src_files: countFiles(path.join(root, "src")),
      test_files: countFiles(path.join(root, "test")),
      docs_files: countFiles(path.join(root, "docs"))
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
