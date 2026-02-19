const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DEFAULT_HARNESS_DIR = "C:\\code\\jsonapi-rsql-interface-smoke-test";
const DEFAULT_PACKAGE_NAME = "jsonapi-rsql-interface";

function parseArgs(argv) {
  const out = {
    phase: "",
    version: "",
    harnessDir: DEFAULT_HARNESS_DIR,
    packageName: DEFAULT_PACKAGE_NAME
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    const next = i + 1 < argv.length ? String(argv[i + 1]) : "";
    if (token === "--phase" && next) {
      out.phase = next;
      i += 1;
      continue;
    }
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
    if (token === "--package-name" && next) {
      out.packageName = next;
      i += 1;
    }
  }
  return out;
}

function validateOptions(options) {
  if (options.phase !== "pre" && options.phase !== "post") {
    throw new Error("Invalid --phase. Use 'pre' or 'post'.");
  }
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(options.version)) {
    throw new Error("Invalid --version. Use semantic version without leading 'v' (for example 1.0.0).");
  }
  const harnessDir = path.resolve(options.harnessDir);
  if (!fs.existsSync(harnessDir)) {
    throw new Error(`Smoke harness directory does not exist: ${harnessDir}`);
  }
  const harnessPkg = path.join(harnessDir, "package.json");
  if (!fs.existsSync(harnessPkg)) {
    throw new Error(`Smoke harness package.json not found: ${harnessPkg}`);
  }
  return {
    ...options,
    harnessDir
  };
}

function buildRunCommand(options) {
  const script = options.phase === "pre" ? "smoke:prepublish" : "smoke:postpublish";
  const command = `npm run ${script} -- --version ${options.version} --package ${options.packageName} --phase ${options.phase}`;
  if (process.platform === "win32") {
    return {
      cmd: "cmd.exe",
      args: ["/d", "/s", "/c", command]
    };
  }
  return {
    cmd: "npm",
    args: [
      "run",
      script,
      "--",
      "--version",
      options.version,
      "--package",
      options.packageName,
      "--phase",
      options.phase
    ]
  };
}

function run() {
  const parsed = parseArgs(process.argv.slice(2));
  const options = validateOptions(parsed);
  const spec = buildRunCommand(options);

  const result = spawnSync(spec.cmd, spec.args, {
    cwd: options.harnessDir,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    throw new Error(`External smoke command failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`External smoke command failed with exit code ${result.status}.`);
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  DEFAULT_HARNESS_DIR,
  DEFAULT_PACKAGE_NAME,
  parseArgs,
  validateOptions,
  buildRunCommand,
  run
};
