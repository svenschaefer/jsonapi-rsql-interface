const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DEFAULT_HARNESS_DIR = "C:\\code\\jsonapi-rsql-interface-smoke-test";
const DEFAULT_HARNESS_PACKAGE = "jsonapi-rsql-interface-smoke-test";

function parseArgs(argv) {
  const out = {
    version: "",
    harnessDir: DEFAULT_HARNESS_DIR,
    harnessPackage: DEFAULT_HARNESS_PACKAGE
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    const next = i + 1 < argv.length ? String(argv[i + 1]) : "";
    if (token === "--version" && next) {
      out.version = next;
      i += 1;
      continue;
    }
    if (token === "--harness-dir" && next) {
      out.harnessDir = next;
      i += 1;
      continue;
    }
    if (token === "--harness-package" && next) {
      out.harnessPackage = next;
      i += 1;
    }
  }
  return out;
}

function validateOptions(options) {
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(options.version)) {
    throw new Error("Invalid --version. Use semantic version without leading 'v' (for example 1.0.0).");
  }
  const harnessDir = path.resolve(options.harnessDir);
  fs.mkdirSync(harnessDir, { recursive: true });
  return {
    ...options,
    harnessDir
  };
}

function buildInstallSpec(options) {
  const packageSpec = `${options.harnessPackage}@${options.version}`;
  if (process.platform === "win32") {
    const command = `npm install --prefix ${options.harnessDir} ${packageSpec} --no-save`;
    return {
      cmd: "cmd.exe",
      args: ["/d", "/s", "/c", command]
    };
  }
  return {
    cmd: "npm",
    args: ["install", "--prefix", options.harnessDir, packageSpec, "--no-save"]
  };
}

function run() {
  const parsed = parseArgs(process.argv.slice(2));
  const options = validateOptions(parsed);
  const spec = buildInstallSpec(options);
  const result = spawnSync(spec.cmd, spec.args, {
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    throw new Error(`Failed to start harness provisioning command: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Harness provisioning failed with exit code ${result.status}.`);
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  DEFAULT_HARNESS_DIR,
  DEFAULT_HARNESS_PACKAGE,
  parseArgs,
  validateOptions,
  buildInstallSpec,
  run
};
