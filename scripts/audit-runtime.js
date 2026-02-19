const { spawnSync } = require("child_process");

function getAuditCommandSpec(platform = process.platform) {
  if (platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", "npm audit --omit=dev --json"]
    };
  }
  return {
    command: "npm",
    args: ["audit", "--omit=dev", "--json"]
  };
}

function extractJsonCandidate(text) {
  const source = typeof text === "string" ? text.trim() : "";
  if (!source) return "";

  const directStart = source.startsWith("{") ? 0 : -1;
  if (directStart === 0) return source;

  const firstBrace = source.indexOf("{");
  const lastBrace = source.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return source.slice(firstBrace, lastBrace + 1);
  }

  return "";
}

function parseAuditJson(text) {
  const candidate = extractJsonCandidate(text);
  if (!candidate) {
    throw new Error("No JSON object found in npm audit output.");
  }
  try {
    return JSON.parse(candidate);
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
  const spec = getAuditCommandSpec();
  const result = spawnSync(spec.command, spec.args, {
    encoding: "utf8",
    shell: false
  });

  if (result.error) {
    throw new Error(`Failed to execute npm audit: ${result.error.message}`);
  }

  const stdout = typeof result.stdout === "string" ? result.stdout : "";
  const stderr = typeof result.stderr === "string" ? result.stderr : "";
  if (!stdout.trim() && !stderr.trim()) {
    throw new Error("npm audit returned no JSON output.");
  }

  let payload = null;
  let parseError = null;
  const sources = [stdout, stderr, `${stdout}\n${stderr}`];
  for (const source of sources) {
    try {
      payload = parseAuditJson(source);
      break;
    } catch (err) {
      parseError = err;
    }
  }
  if (!payload) {
    throw parseError || new Error("Failed to parse npm audit JSON output.");
  }

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
    `${JSON.stringify({ ok: true, vulnerabilities: 0, mode: "runtime_only", status: result.status }, null, 2)}\n`
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  getAuditCommandSpec,
  extractJsonCandidate,
  parseAuditJson,
  countVulnerabilities,
  main
};
