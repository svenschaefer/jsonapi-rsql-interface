const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DEFAULT_HARNESS_DIR = "C:\\code\\jsonapi-rsql-interface-smoke-test";
const DEFAULT_HARNESS_PACKAGE = "jsonapi-rsql-interface-smoke-test";

function parseArgs(argv) {
  const out = {
    phase: "all",
    version: "",
    timestamp: "",
    harnessDir: DEFAULT_HARNESS_DIR,
    harnessPackage: DEFAULT_HARNESS_PACKAGE,
    harnessInstallSpec: ""
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
    if (token === "--timestamp" && next) {
      out.timestamp = next;
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
      continue;
    }
    if (token === "--harness-install-spec" && next) {
      out.harnessInstallSpec = next;
      i += 1;
    }
  }
  return out;
}

function resolvePhaseList(phase) {
  if (phase === "all") {
    return ["pre", "post"];
  }
  if (phase === "pre" || phase === "post") {
    return [phase];
  }
  throw new Error("Invalid --phase. Use 'pre', 'post', or 'all'.");
}

function createRunTimestamp(date = new Date()) {
  const pad2 = (n) => String(n).padStart(2, "0");
  return [
    String(date.getUTCFullYear()),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate()),
    "T",
    pad2(date.getUTCHours()),
    pad2(date.getUTCMinutes()),
    pad2(date.getUTCSeconds()),
    "Z"
  ].join("");
}

function isTimestamp(value) {
  return /^[0-9]{8}T[0-9]{6}Z$/.test(String(value || ""));
}

function getTimestampScopedHarnessDir(baseDir, timestamp, phase, version) {
  const rootDir = path.resolve(baseDir);
  const scopedName = `${timestamp}-${phase}-${version}`;
  if (path.basename(rootDir) === scopedName) {
    return rootDir;
  }
  return path.join(rootDir, scopedName);
}

function validateOptions(options) {
  const hasInstallSpec = Boolean(options.harnessInstallSpec && String(options.harnessInstallSpec).trim());
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(options.version)) {
    throw new Error("Invalid --version. Use semantic version without leading 'v' (for example 1.0.0).");
  }
  const phase = String(options.phase || "all");
  const phases = resolvePhaseList(phase);
  const runTimestamp = options.timestamp ? String(options.timestamp).trim() : createRunTimestamp();
  if (!isTimestamp(runTimestamp)) {
    throw new Error("Invalid --timestamp. Use UTC basic format YYYYMMDDTHHMMSSZ.");
  }
  const harnessDir = path.resolve(options.harnessDir);
  fs.mkdirSync(harnessDir, { recursive: true });
  const scopedHarnessDirs = phases.map((item) => {
    const scopedDir = getTimestampScopedHarnessDir(harnessDir, runTimestamp, item, options.version);
    fs.mkdirSync(scopedDir, { recursive: true });
    return scopedDir;
  });

  return {
    ...options,
    phase,
    timestamp: runTimestamp,
    harnessDir,
    scopedHarnessDirs,
    harnessInstallSpec: hasInstallSpec ? String(options.harnessInstallSpec).trim() : ""
  };
}

function buildInstallSpecs(options) {
  const packageSpec =
    options.harnessInstallSpec && options.harnessInstallSpec.length > 0
      ? options.harnessInstallSpec
      : `${options.harnessPackage}@${options.version}`;
  return options.scopedHarnessDirs.map((targetDir) => {
    if (process.platform === "win32") {
      const command = `npm install --prefix ${targetDir} ${packageSpec} --no-save`;
      return {
        cmd: "cmd.exe",
        args: ["/d", "/s", "/c", command]
      };
    }
    return {
      cmd: "npm",
      args: ["install", "--prefix", targetDir, packageSpec, "--no-save"]
    };
  });
}

function runInstallSpecs(specs) {
  for (const spec of specs) {
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
}

function run() {
  const parsed = parseArgs(process.argv.slice(2));
  const options = validateOptions(parsed);
  const specs = buildInstallSpecs(options);
  runInstallSpecs(specs);
}

if (require.main === module) {
  run();
}

module.exports = {
  DEFAULT_HARNESS_DIR,
  DEFAULT_HARNESS_PACKAGE,
  parseArgs,
  resolvePhaseList,
  createRunTimestamp,
  isTimestamp,
  getTimestampScopedHarnessDir,
  validateOptions,
  buildInstallSpecs,
  runInstallSpecs,
  run
};
