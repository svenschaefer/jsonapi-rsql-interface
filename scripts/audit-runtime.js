const { spawnSync } = require("child_process");

function getNpmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function parseAuditJson(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    throw new Error(`Failed to parse npm audit JSON output: ${message}`);
  }
}

function countVulnerabilities(payload) {
  const metadata = payload && payload.metadata && payload.metadata.vulnerabilities;
  if (!metadata || typeof metadata !== "object") return 0;
  const levels = ["critical", "high", "moderate", "low", "info"];
  return levels.reduce((sum, level) => sum + Number(metadata[level] || 0), 0);
}

function main() {
  const result = spawnSync(getNpmCommand(), ["audit", "--omit=dev", "--json"], {
    encoding: "utf8",
    shell: false
  });

  if (result.error) {
    throw new Error(`Failed to execute npm audit: ${result.error.message}`);
  }

  const output = result.stdout && result.stdout.trim().length > 0 ? result.stdout.trim() : "";
  if (!output) {
    throw new Error("npm audit returned no JSON output.");
  }

  const payload = parseAuditJson(output);
  const total = countVulnerabilities(payload);

  if (total > 0) {
    process.stderr.write(
      `Runtime dependency audit failed: ${total} vulnerabilities detected (omit=dev).\n`
    );
    process.exit(1);
  }

  if (result.status !== 0) {
    process.stderr.write("Runtime dependency audit failed due to npm audit execution error.\n");
    process.exit(1);
  }

  process.stdout.write(
    `${JSON.stringify({ ok: true, vulnerabilities: 0, mode: "runtime_only" }, null, 2)}\n`
  );
}

main();
